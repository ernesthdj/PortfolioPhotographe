// Calcul du devis — fonction pure, voir docs/modules/DEVIS.md §3 et §6.
// prix_estime = prix_base(formule) + max(0, distance_km - rayon_gratuit_km) * tarif_par_km

export function calculateFraisDeplacement(
  distanceKm: number,
  rayonGratuitKm: number,
  tarifParKm: number
): number {
  return Math.max(0, distanceKm - rayonGratuitKm) * tarifParKm;
}

export function calculateTotal(prixBase: number, fraisDeplacement: number): number {
  return prixBase + fraisDeplacement;
}
