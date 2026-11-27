// Règles de placement des photos de l'administration : logique PURE (sans DOM ni réseau), testée dans tests/placement.test.ts.
// Une « édition » est la copie de travail du manifeste : { photos: [{ id, alt, published }], slots: { cle: [placement] }, events: [{ id, svc, tag, txt, photos: [placement] }] },
// où un placement est l'objet photo { photo, legende: { actif, texte }, fx, fy, format }. Les emplacements et leurs limites viennent du registre data/zones.js (le même que le serveur).

import { SERVICES, CLES, SERIES, limite, nomZone } from '../../data/zones.js';
export { CLES, limite, nomZone };
export const SVC = SERVICES;
export const MAX_SERIES = SERIES.max;
export const MAX_PHOTOS_SERIE = SERIES.maxPhotos;
export const MAX_TAG = 160;
export const MAX_TXT = 240;
export const MAX_ALT = 200;

/** Photo posée sans habillage (légende masquée, recadrage et format de la photo) : forme de tout placement fraîchement créé. */
export const parDefaut = (photo) => ({ photo, legende: { actif: false, texte: '' }, fx: null, fy: null, format: 'auto' });
/** Identifiants des photos d'une liste de placements, dans l'ordre. */
export const idsDe = (liste) => liste.map((p) => p.photo);

// ---- copie de travail ---------------------------------------------------------------------------------------
const clone = (v) => JSON.parse(JSON.stringify(v));

export function depuisManifeste(m) {
  return {
    photos: m.photos.map((p) => ({ id: p.id, alt: p.alt, published: p.published })),
    slots: clone(m.slots ?? {}),
    events: clone(m.events ?? []),
  };
}

/** Manifeste à envoyer : le serveur garde ses champs techniques (fichier, dimensions, point focal), l'édition fournit le reste. */
export function versManifeste(serveur, ed) {
  const par = new Map(ed.photos.map((p) => [p.id, p]));
  const slots = {};
  for (const [cle, ids] of Object.entries(ed.slots)) if (ids.length) slots[cle] = [...ids];
  return {
    ...serveur,
    photos: serveur.photos.map((o) => { const e = par.get(o.id); return e ? { ...o, alt: e.alt.trim().slice(0, MAX_ALT), published: e.published } : o; }),
    slots,
    events: ed.events.map((e) => ({ id: e.id, svc: e.svc, tag: e.tag.trim().slice(0, MAX_TAG), txt: e.txt.trim().slice(0, MAX_TXT), photos: [...e.photos] })),
  };
}

/** Garde les modifications en cours quand le serveur change (envoi, suppression) : nouvelles photos ajoutées, photos supprimées retirées partout. */
export function reporter(ed, m) {
  const connues = new Map(ed.photos.map((p) => [p.id, p]));
  const photos = m.photos.map((p) => connues.get(p.id) ?? { id: p.id, alt: p.alt, published: p.published });
  const vivantes = new Set(photos.map((p) => p.id));
  const garde = (liste) => liste.filter((p) => vivantes.has(p.photo));
  return {
    photos,
    slots: Object.fromEntries(Object.entries(ed.slots).map(([k, v]) => [k, garde(v)])),
    events: ed.events.map((e) => ({ ...e, photos: garde(e.photos) })),
  };
}

// ---- placement ----------------------------------------------------------------------------------------------
/** Place une photo dans un emplacement. Un emplacement d'une seule place est remplacé ; les autres refusent quand ils sont pleins. */
export function placer(ed, cle, id) {
  if (!CLES.includes(cle)) return { ed, erreur: 'Emplacement inconnu.' };
  const liste = ed.slots[cle] ?? [];
  if (idsDe(liste).includes(id)) return { ed, erreur: 'Cette photo est déjà dans « ' + nomZone(cle) + ' ».' };
  const max = limite(cle);
  if (max > 1 && liste.length >= max) return { ed, erreur: '« ' + nomZone(cle) + ' » est pleine (' + max + ' photos).' };
  return { ed: { ...ed, slots: { ...ed.slots, [cle]: max === 1 ? [parDefaut(id)] : [...liste, parDefaut(id)] } } };
}

export function retirer(ed, cle, id) {
  return { ...ed, slots: { ...ed.slots, [cle]: (ed.slots[cle] ?? []).filter((p) => p.photo !== id) } };
}

/** Déplace l'élément `i` de `delta` rang (−1 = avant, +1 = après) ; bornes respectées. */
export function deplacer(liste, i, delta) {
  const j = i + delta;
  if (i < 0 || i >= liste.length || j < 0 || j >= liste.length) return liste;
  const l = [...liste];
  [l[i], l[j]] = [l[j], l[i]];
  return l;
}

// ---- séries de la galerie -----------------------------------------------------------------------------------
export function idSerie(existants, hasard = Math.random) {
  let id;
  do { id = 'evt' + Math.floor(hasard() * 36 ** 8).toString(36).padStart(8, '0'); } while (existants.some((e) => e.id === id));
  return id;
}

export function ajouterSerie(ed, svc = 0, hasard = Math.random) {
  if (ed.events.length >= MAX_SERIES) return { ed, erreur: 'Maximum ' + MAX_SERIES + ' séries.' };
  return { ed: { ...ed, events: [...ed.events, { id: idSerie(ed.events, hasard), svc, tag: '', txt: '', photos: [] }] } };
}

export function retirerSerie(ed, id) {
  return { ...ed, events: ed.events.filter((e) => e.id !== id) };
}

export function majSerie(ed, id, champs) {
  return { ...ed, events: ed.events.map((e) => (e.id === id ? { ...e, ...champs } : e)) };
}

export function placerDansSerie(ed, serieId, photoId) {
  const e = ed.events.find((x) => x.id === serieId);
  if (!e) return { ed, erreur: 'Série introuvable.' };
  if (idsDe(e.photos).includes(photoId)) return { ed, erreur: 'Cette photo est déjà dans la série.' };
  if (e.photos.length >= MAX_PHOTOS_SERIE) return { ed, erreur: 'Une série contient au plus ' + MAX_PHOTOS_SERIE + ' photos.' };
  return { ed: majSerie(ed, serieId, { photos: [...e.photos, parDefaut(photoId)] }) };
}

export function retirerDeSerie(ed, serieId, photoId) {
  const e = ed.events.find((x) => x.id === serieId);
  return e ? majSerie(ed, serieId, { photos: e.photos.filter((p) => p.photo !== photoId) }) : ed;
}

export function deplacerDansSerie(ed, serieId, i, delta) {
  const e = ed.events.find((x) => x.id === serieId);
  return e ? majSerie(ed, serieId, { photos: deplacer(e.photos, i, delta) }) : ed;
}

export function deplacerSerie(ed, id, delta) {
  const i = ed.events.findIndex((e) => e.id === id);
  return { ...ed, events: deplacer(ed.events, i, delta) };
}

const nomSerie = (e) => e.tag.trim() || SVC[e.svc] || 'Série';

// ---- où est une photo ? -------------------------------------------------------------------------------------
/** Étiquettes « Intro », « Accueil · Mariages », « Galerie · Mariage Paris »… ; vide si la photo n'est placée nulle part. */
export function etiquettes(ed, id) {
  const l = [];
  for (const cle of CLES) if (idsDe(ed.slots[cle] ?? []).includes(id)) l.push(nomZone(cle));
  for (const e of ed.events) if (idsDe(e.photos).includes(id)) l.push('Galerie · ' + nomSerie(e));
  return l;
}

// ---- changements en attente ---------------------------------------------------------------------------------
const meme = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Liste lisible de ce qui sera écrit à l'enregistrement (`base` = dernière copie enregistrée). Vide = rien à enregistrer. */
export function changements(base, ed) {
  const l = [];
  const avant = new Map(base.photos.map((p) => [p.id, p]));
  let pub = 0, depub = 0, alt = 0;
  for (const p of ed.photos) {
    const o = avant.get(p.id);
    if (!o) continue;
    if (p.published && !o.published) pub++;
    if (!p.published && o.published) depub++;
    if (p.alt.trim() !== o.alt.trim()) alt++;
  }
  if (pub) l.push(pub + ' photo' + (pub > 1 ? 's' : '') + ' publiée' + (pub > 1 ? 's' : ''));
  if (depub) l.push(depub + ' photo' + (depub > 1 ? 's' : '') + ' retirée' + (depub > 1 ? 's' : '') + ' du site');
  if (alt) l.push(alt + ' texte' + (alt > 1 ? 's' : '') + ' alternatif' + (alt > 1 ? 's' : '') + ' modifié' + (alt > 1 ? 's' : ''));

  for (const cle of CLES) {
    const a = base.slots[cle] ?? [], b = ed.slots[cle] ?? [];
    if (meme(a, b)) continue;
    const ia = idsDe(a), ib = idsDe(b);
    const ajout = ib.filter((x) => !ia.includes(x)).length, retrait = ia.filter((x) => !ib.includes(x)).length;
    const sansChangementDeContenu = !ajout && !retrait;
    const detail = [ajout ? '+' + ajout : '', retrait ? '−' + retrait : '', sansChangementDeContenu ? (meme(ia, ib) ? 'habillage modifié' : 'ordre ou habillage modifié') : ''].filter(Boolean).join(' ');
    l.push(nomZone(cle) + ' : ' + detail + ' (' + b.length + ' photo' + (b.length > 1 ? 's' : '') + ')');
  }

  const evAvant = new Map(base.events.map((e) => [e.id, e]));
  for (const e of ed.events) {
    const o = evAvant.get(e.id);
    if (!o) l.push('Série « ' + nomSerie(e) + ' » ajoutée (' + e.photos.length + ' photo' + (e.photos.length > 1 ? 's' : '') + ')');
    else if (!meme(o, e)) l.push('Série « ' + nomSerie(e) + ' » modifiée');
  }
  for (const o of base.events) if (!ed.events.some((e) => e.id === o.id)) l.push('Série « ' + nomSerie(o) + ' » supprimée');
  if (!meme(base.events.map((e) => e.id).filter((id) => ed.events.some((e) => e.id === id)), ed.events.map((e) => e.id).filter((id) => base.events.some((e) => e.id === id)))) l.push('Ordre des séries modifié');
  return l;
}
