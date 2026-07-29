import "server-only";

export type Coordinates = { lat: number; lon: number };

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Géocodage via Nominatim (OpenStreetMap) — gratuit, sans clé API, limité à 1
// requête/seconde et usage non intensif (voir docs/modules/DEVIS.md §3 et §6).
// Ne jamais appeler depuis le client : toujours via une Server Action, déclenchée au
// blur du champ ville (jamais en debounce de frappe).
export async function geocode(query: string): Promise<Coordinates | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      // Nominatim exige un User-Agent identifiant l'application.
      "User-Agent": "PortfolioPhotographe/1.0 (devis simulator)",
    },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (results.length === 0) return null;

  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
}

// Distance à vol d'oiseau (formule de Haversine), en kilomètres — approximation
// assumée pour rester 100% gratuit, toujours présentée comme "estimation" côté UI.
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371; // rayon moyen de la Terre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
