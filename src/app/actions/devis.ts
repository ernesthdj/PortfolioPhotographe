"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { geocode, haversineDistanceKm } from "@/lib/geo";
import { getParametresTarifs } from "@/lib/parametres-tarifs";
import { calculateFraisDeplacement, calculateTotal } from "@/lib/devis";
import { devisSchema, type DevisFormValues } from "@/lib/validation/devis-schema";
import { getClientIp, isRateLimited, logAttempt } from "@/lib/rate-limit";
import { resend, FROM_EMAIL, ERNEST_EMAIL } from "@/lib/resend";
import { renderConfirmationEmail, renderNotificationEmail } from "@/lib/emails/devis";

export type TravelFeeEstimate =
  | {
      ok: true;
      distanceKm: number | null;
      fraisDeplacement: number;
      rayonGratuitKm: number;
      tarifParKm: number;
    }
  | { ok: false };

// Déclenchée au blur du champ ville (jamais en debounce de frappe) — voir
// docs/modules/DEVIS.md §3 et §6.
export async function estimateTravelFee(ville: string): Promise<TravelFeeEstimate> {
  const trimmed = ville.trim();
  const parametres = await getParametresTarifs();

  if (!parametres) return { ok: false };

  if (!trimmed) {
    return {
      ok: true,
      distanceKm: null,
      fraisDeplacement: 0,
      rayonGratuitKm: parametres.rayon_gratuit_km,
      tarifParKm: parametres.tarif_par_km,
    };
  }

  const clientCoords = await geocode(trimmed);
  if (!clientCoords || parametres.lat === null || parametres.lon === null) {
    // Ville non géocodable — fallback gracieux, ne bloque jamais la saisie.
    return { ok: false };
  }

  const distanceKm = haversineDistanceKm(clientCoords, {
    lat: parametres.lat,
    lon: parametres.lon,
  });
  const fraisDeplacement = calculateFraisDeplacement(
    distanceKm,
    parametres.rayon_gratuit_km,
    parametres.tarif_par_km
  );

  return {
    ok: true,
    distanceKm,
    fraisDeplacement,
    rayonGratuitKm: parametres.rayon_gratuit_km,
    tarifParKm: parametres.tarif_par_km,
  };
}

export type SubmitDevisResult =
  | { ok: true }
  | { ok: false; error: "validation" | "rate_limited" | "formule_introuvable" | "unknown" };

export async function submitDevis(values: DevisFormValues): Promise<SubmitDevisResult> {
  const parsed = devisSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "validation" };
  }
  const data = parsed.data;

  // Honeypot rempli -> faux succès, rien n'est traité (docs/modules/DEVIS.md cas limite 5).
  if (data.honeypot) {
    return { ok: true };
  }

  const ip = await getClientIp();
  if (await isRateLimited(ip)) {
    return { ok: false, error: "rate_limited" };
  }
  await logAttempt(ip);

  const supabase = createAdminClient();

  const { data: formule } = await supabase
    .from("formules")
    .select("id, nom, prix_base")
    .eq("id", data.formuleId)
    .eq("actif", true)
    .single();

  if (!formule) {
    return { ok: false, error: "formule_introuvable" };
  }

  // Prix recalculé côté serveur — jamais de confiance dans un prix envoyé par le client.
  let distanceKm: number | null = null;
  let fraisDeplacement = 0;
  if (data.villeZone) {
    const estimate = await estimateTravelFee(data.villeZone);
    if (estimate.ok) {
      distanceKm = estimate.distanceKm;
      fraisDeplacement = estimate.fraisDeplacement;
    }
  }

  const total = calculateTotal(formule.prix_base, fraisDeplacement);
  const nombreInvites = data.nombreInvites ? parseInt(data.nombreInvites, 10) : undefined;

  const { data: lead, error: insertError } = await supabase
    .from("leads")
    .insert({
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      date_mariage: data.dateMariage,
      ville_zone: data.villeZone || null,
      distance_km: distanceKm,
      nombre_invites: nombreInvites ?? null,
      formule_id: formule.id,
      prix_estime: total,
      message: data.message || null,
      statut: "nouveau",
    })
    .select("id")
    .single();

  if (insertError || !lead) {
    return { ok: false, error: "unknown" };
  }

  const emailData = {
    nom: data.nom,
    email: data.email,
    telephone: data.telephone,
    dateMariage: data.dateMariage,
    villeZone: data.villeZone || undefined,
    nombreInvites,
    message: data.message || undefined,
    formuleNom: formule.nom,
    prixBase: formule.prix_base,
    fraisDeplacement,
    total,
    distanceKm: distanceKm ?? undefined,
  };

  const notification = renderNotificationEmail(emailData);
  const confirmation = renderConfirmationEmail(emailData);

  await Promise.allSettled([
    resend.emails.send({
      from: FROM_EMAIL,
      to: ERNEST_EMAIL,
      subject: notification.subject,
      html: notification.html,
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: confirmation.subject,
      html: confirmation.html,
    }),
  ]);

  return { ok: true };
}
