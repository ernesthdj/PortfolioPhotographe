// Chargeur du CMS : lit UNE fois /api/photos au chargement du module (top-level await) et garde la réponse 60 s dans sessionStorage,
// pour que les pages suivantes de la même visite n'attendent pas le réseau. Toute erreur (hors ligne, poste local, API en panne, lenteur > 2 s)
// donne `null` : le site retombe alors sur ses photos de test, sans message.
const CLE = 'cms-photos-v1';
const VALIDITE_MS = 60_000;
const DELAI_MS = 2000;

function lireCache() {
  try {
    const brut = sessionStorage.getItem(CLE);
    if (!brut) return undefined;
    const { t, m } = JSON.parse(brut);
    return typeof t === 'number' && Date.now() - t < VALIDITE_MS ? m : undefined;
  } catch { return undefined; }
}

async function charger() {
  const cache = lireCache();
  if (cache !== undefined) return cache;
  const ctl = new AbortController();
  const minuteur = setTimeout(() => ctl.abort(), DELAI_MS);
  try {
    const res = await fetch('/api/photos', { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const { manifest } = await res.json();
    const m = manifest && typeof manifest === 'object' ? manifest : null;
    try { sessionStorage.setItem(CLE, JSON.stringify({ t: Date.now(), m })); } catch { /* stockage plein ou interdit : sans conséquence */ }
    return m;
  } catch { return null; }
  finally { clearTimeout(minuteur); }
}

/** Manifeste public (photos publiées, emplacements, séries) ou null. */
export const CMS = await charger();
