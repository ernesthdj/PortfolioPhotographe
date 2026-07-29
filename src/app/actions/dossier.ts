"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL, ERNEST_EMAIL } from "@/lib/resend";

export type DossierData = {
  id: string;
  statut: "brouillon" | "envoye";
  formule_id: string | null;
  lead_id: string | null;
};

// Récupère le dossier de l'utilisateur connecté, ou le crée — en le liant à un lead
// existant (venu du devis rapide, même email) ou en créant un nouveau lead minimal
// (entrée directe, sans être passé par le devis — voir docs/modules/DOSSIER.md §2).
export async function getOrCreateDossier(): Promise<DossierData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("dossiers")
    .select("id, statut, formule_id, lead_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const admin = createAdminClient();

  const { data: existingLead } = await admin
    .from("leads")
    .select("id, formule_id")
    .eq("email", user.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let leadId = existingLead?.id ?? null;
  let formuleId = existingLead?.formule_id ?? null;

  if (!leadId) {
    const { data: newLead } = await admin
      .from("leads")
      .insert({ email: user.email, statut: "nouveau" })
      .select("id")
      .single();
    leadId = newLead?.id ?? null;
  }

  const { data: created } = await supabase
    .from("dossiers")
    .insert({ user_id: user.id, lead_id: leadId, formule_id: formuleId, statut: "brouillon" })
    .select("id, statut, formule_id, lead_id")
    .single();

  return created ?? null;
}

export async function setDossierFormule(dossierId: string, formuleId: string) {
  const supabase = await createClient();
  await supabase.from("dossiers").update({ formule_id: formuleId }).eq("id", dossierId);
}

// Ajoute/retire une option à la carte — prix figé en snapshot au moment de l'ajout
// (voir docs/modules/DOSSIER.md §5).
export async function toggleServiceOption(dossierId: string, serviceId: string) {
  const supabase = await createClient();

  const { data: existingOption } = await supabase
    .from("dossier_options")
    .select("id")
    .eq("dossier_id", dossierId)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (existingOption) {
    await supabase.from("dossier_options").delete().eq("id", existingOption.id);
    return { added: false };
  }

  const { data: service } = await supabase
    .from("services_carte")
    .select("id, prix, actif")
    .eq("id", serviceId)
    .eq("actif", true)
    .single();

  if (!service) return { added: false };

  await supabase.from("dossier_options").insert({
    dossier_id: dossierId,
    service_id: service.id,
    prix_snapshot: service.prix,
    disponible_snapshot: true,
  });

  return { added: true };
}

export async function saveDossierReponse(dossierId: string, champId: string, valeur: string) {
  const supabase = await createClient();
  await supabase
    .from("dossier_reponses")
    .upsert(
      { dossier_id: dossierId, champ_id: champId, valeur },
      { onConflict: "dossier_id,champ_id" }
    );
}

export type SubmitDossierResult =
  | { ok: true }
  | { ok: false; error: "formule_manquante" | "unknown" };

// Envoi final — voir docs/modules/DOSSIER.md §2. La vérification email n'est pas
// exigée ici (contrainte Supabase, voir §4 : accès immédiat priorisé, risque accepté).
export async function submitDossier(dossierId: string): Promise<SubmitDossierResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "unknown" };

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, formule_id, lead_id")
    .eq("id", dossierId)
    .single();

  if (!dossier || !dossier.formule_id) {
    return { ok: false, error: "formule_manquante" };
  }

  const admin = createAdminClient();

  const [{ data: formule }, { data: options }, { data: reponses }, { data: champs }] =
    await Promise.all([
      admin.from("formules").select("nom, prix_base").eq("id", dossier.formule_id).single(),
      supabase
        .from("dossier_options")
        .select("prix_snapshot, services_carte(nom)")
        .eq("dossier_id", dossierId),
      supabase.from("dossier_reponses").select("champ_id, valeur").eq("dossier_id", dossierId),
      admin.from("dossier_champs").select("id, libelle"),
    ]);

  await supabase.from("dossiers").update({ statut: "envoye" }).eq("id", dossierId);

  if (dossier.lead_id) {
    await admin.from("leads").update({ statut: "configure" }).eq("id", dossier.lead_id);
  }

  const totalOptions = (options ?? []).reduce((sum, o) => sum + Number(o.prix_snapshot), 0);
  const total = (formule?.prix_base ?? 0) + totalOptions;

  const champLabels = new Map((champs ?? []).map((c) => [c.id, c.libelle]));
  const reponsesHtml = (reponses ?? [])
    .filter((r) => r.valeur)
    .map((r) => `<tr><td style="padding:4px 0;color:#8A5A2F">${champLabels.get(r.champ_id) ?? ""}</td><td style="padding:4px 0">${r.valeur}</td></tr>`)
    .join("");
  const optionsHtml = (options ?? [])
    .map(
      (o) =>
        `<tr><td style="padding:4px 0;color:#8A5A2F">${(o as { services_carte?: { nom?: string } }).services_carte?.nom ?? "Option"}</td><td style="padding:4px 0">${Number(o.prix_snapshot).toFixed(0)}€</td></tr>`
    )
    .join("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ERNEST_EMAIL,
    subject: `Dossier complet reçu — ${user.email}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#EFE7D8;padding:32px;color:#2B2521">
        <div style="max-width:560px;margin:0 auto;background:#F4EEE4;border:1px solid rgba(43,37,33,.12);padding:32px">
          <h1 style="font-size:20px;margin:0 0 20px">Dossier complet — ${user.email}</h1>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:4px 0;color:#8A5A2F">Formule</td><td style="padding:4px 0">${formule?.nom ?? ""} — ${formule?.prix_base ?? 0}€</td></tr>
            ${optionsHtml}
            ${reponsesHtml}
            <tr><td style="padding:8px 0;color:#8A5A2F;font-weight:bold">Total estimé</td><td style="padding:8px 0;font-weight:bold">${total.toFixed(0)}€</td></tr>
          </table>
        </div>
      </div>
    `,
  });

  return { ok: true };
}
