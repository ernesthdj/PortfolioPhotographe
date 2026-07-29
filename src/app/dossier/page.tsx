import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDossier } from "@/app/actions/dossier";
import { DossierBuilder } from "@/components/DossierBuilder";

export default async function DossierPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const dossier = await getOrCreateDossier();
  if (!dossier) redirect("/connexion");

  if (dossier.statut === "envoye") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-2xl text-ink">Votre dossier a été envoyé</p>
        <p className="mt-3 text-[14px] leading-[1.7] text-ink/70">
          Merci ! Je reviens vers vous très vite.
        </p>
      </div>
    );
  }

  const [{ data: formules }, { data: services }, { data: champs }, { data: options }, { data: reponses }] =
    await Promise.all([
      supabase.from("formules").select("id, nom, prix_base").eq("actif", true).order("ordre_affichage"),
      supabase
        .from("services_carte")
        .select("id, nom, description, prix, categorie")
        .eq("actif", true)
        .order("ordre_affichage"),
      supabase
        .from("dossier_champs")
        .select("id, libelle, cle, type, options_json, obligatoire, section")
        .eq("actif", true)
        .order("ordre_affichage"),
      supabase.from("dossier_options").select("service_id").eq("dossier_id", dossier.id),
      supabase.from("dossier_reponses").select("champ_id, valeur").eq("dossier_id", dossier.id),
    ]);

  return (
    <DossierBuilder
      dossierId={dossier.id}
      formules={formules ?? []}
      initialFormuleId={dossier.formule_id}
      services={services ?? []}
      initialServiceIds={(options ?? []).map((o) => o.service_id)}
      champs={champs ?? []}
      initialReponses={Object.fromEntries((reponses ?? []).map((r) => [r.champ_id, r.valeur ?? ""]))}
    />
  );
}
