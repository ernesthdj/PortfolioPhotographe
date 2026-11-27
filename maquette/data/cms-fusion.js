// Fusion du manifeste du CMS (API publique /api/photos) avec les photos du site : logique PURE, sans réseau ni DOM (testée dans tests/fusion.test.ts).
// Les photos du CMS sont ajoutées À LA SUITE des photos de test (indices nbBase, nbBase + 1…) : les pages gardent leur logique « indice dans PHOTOS ».

const FILE_RE = /^cms\/photos\/[a-z0-9._-]{4,80}$/;

const estObjet = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const estNombre = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * @param {unknown} manifeste réponse publique (`manifest` de /api/photos) ou null
 * @param {number} nbBase nombre de photos déjà présentes dans PHOTOS
 * @param {string} base adresse publique du store (« https://….vercel-storage.com/ »)
 * @returns {{ photos: { alt: string, altG: string, label: string, r: number, ton: number, src: string, cms: true }[], slots: Record<string, number[]>, events: { svc: number, tag: string, txt: string, ph: number[] }[] }}
 */
export function fusionner(manifeste, nbBase, base) {
  const vide = { photos: [], slots: {}, events: [] };
  if (!estObjet(manifeste) || !Array.isArray(manifeste.photos)) return vide;

  const photos = [];
  const indice = new Map();
  for (const p of manifeste.photos) {
    if (!estObjet(p) || p.published === false) continue;
    if (typeof p.id !== 'string' || typeof p.file !== 'string' || !FILE_RE.test(p.file)) continue;
    if (!estNombre(p.w) || !estNombre(p.h) || indice.has(p.id)) continue;
    const alt = typeof p.alt === 'string' && p.alt.trim() ? p.alt.trim() : 'Photographie';
    indice.set(p.id, nbBase + photos.length);
    photos.push({ alt, altG: alt, label: alt, r: p.w / p.h, ton: (photos.length % 8) + 1, src: base + p.file, cms: true });
  }

  const versIndices = (ids) => (Array.isArray(ids) ? ids.map((id) => indice.get(id)).filter((i) => i !== undefined) : []);

  const slots = {};
  if (estObjet(manifeste.slots)) {
    for (const [cle, ids] of Object.entries(manifeste.slots)) {
      const l = versIndices(ids);
      if (l.length) slots[cle] = l;
    }
  }

  const events = [];
  if (Array.isArray(manifeste.events)) {
    for (const e of manifeste.events) {
      if (!estObjet(e) || !Number.isInteger(e.svc) || e.svc < 0 || e.svc > 5) continue;
      const ph = versIndices(e.photos);
      if (ph.length) events.push({ svc: e.svc, tag: String(e.tag ?? ''), txt: String(e.txt ?? ''), ph });
    }
  }

  return { photos, slots, events };
}
