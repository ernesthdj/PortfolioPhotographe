// Catalogue d'exemple de l'atelier (services, options, catégories, types de fiches, modèles de production).
// Il DÉRIVE de la référence de prix du simulateur (data/tarifs.js) : mêmes services, mêmes prix, mêmes catégories.
// Quelques entrées propres à l'atelier (archivées ou jamais utilisées) servent aux états « archivé » et « supprimable ».
import { SERVICES, OPTIONS, CATEGORIES, KM_OFFERTS, PRIX_KM, hm } from './tarifs.js';
import { DOSSIERS } from './dossiers.js';

export const CATS0 = CATEGORIES.slice();
export const MODES = [['P1', 'Forfait'], ['P2', 'Durée'], ['P3', 'Forfait + dépassement'], ['P4', 'Quantité'], ['P5', 'Par personne'], ['P6', 'Paliers']];
export const ARR = ['Aucun', 'Au quart d’heure', 'À la demi-heure', 'À l’heure'];
/** Paramètres de transport communs (franchise et prix au km du simulateur). */
export const TRANSPORT = { franchiseKm: KM_OFFERTS, prixKm: PRIX_KM };

const FICHE = { mar: 'Fiche mariage', eng: 'Fiche mariage', fam: 'Fiche portrait', ann: 'Fiche portrait', evt: 'Fiche reportage', cul: 'Fiche culinaire' };
const prixP3 = (s) => `${s.base} € · ${hm(s.incl)} incluses · ${s.extra} € / h en plus`;
const utilise = (sid) => DOSSIERS.filter((d) => d.cfg.sid === sid).length;
const utiliseOpt = (k) => DOSSIERS.filter((d) => d.cfg.opts.includes(k)).length;

export const SRV = SERVICES.map((s) => ({
  k: s.id, t: s.t, cats: [CATEGORIES[s.cat]], mode: s.mode,
  px: s.mode === 'P3' ? prixP3(s) : `${s.unit} € / plat · de ${s.min} à ${s.max}`,
  fiche: FICHE[s.id], used: utilise(s.id), base: s.base, incl: s.incl, extra: s.extra, unit: s.unit, min: s.min, max: s.max
})).concat([
  { k: 'mini', t: 'Mini-séance de Noël', cats: [CATEGORIES[1]], mode: 'P1', px: '90 €', fiche: 'Fiche portrait', used: 0, arch: true }
]);

const OPT_CATS = { album: [0, 1], tir: [0, 1, 2], sec: [0] };
export const OPT = Object.entries(OPTIONS).map(([k, [t, prix]]) => ({
  k, t, cats: OPT_CATS[k].map((i) => CATEGORIES[i]), mode: 'P1', px: `${prix} €`,
  fiche: SERVICES.filter((s) => s.opts.includes(k)).length + ' services', used: utiliseOpt(k)
})).concat([
  { k: 'drn', t: 'Vol de drone', cats: [CATEGORIES[2]], mode: 'P1', px: '150 €', fiche: '2 services', used: 0, arch: true }
]);

const nSrv = (cat) => SRV.filter((s) => !s.arch && s.cats.includes(cat)).length;
const nOpt = (cat) => OPT.filter((o) => !o.arch && o.cats.includes(cat)).length;
const libelle = (cat) => `${nSrv(cat)} service${nSrv(cat) > 1 ? 's' : ''}${nOpt(cat) ? ` · ${nOpt(cat)} option${nOpt(cat) > 1 ? 's' : ''}` : ''}`;
export const CAT_L = CATEGORIES.map((t, i) => ({ k: 'c' + (i + 1), t, s: libelle(t) })).map((c, i) => (i === 0 ? { ...c, red: 'Mariage hors saison' } : c));

const nomsDe = (fiche) => SERVICES.filter((s) => FICHE[s.id] === fiche).map((s) => s.t).join(', ');
export const TYPES = [
  { k: 't1', t: 'Fiche mariage', n: '11 champs · 1 groupe', svc: nomsDe('Fiche mariage'), mod: '10 nov. 2026' },
  { k: 't2', t: 'Fiche reportage', n: '8 champs', svc: nomsDe('Fiche reportage'), mod: '2 oct. 2026' },
  { k: 't3', t: 'Fiche portrait', n: '6 champs', svc: nomsDe('Fiche portrait'), mod: '28 sept. 2026' },
  { k: 't4', t: 'Fiche culinaire', n: '7 champs', svc: nomsDe('Fiche culinaire'), mod: '14 sept. 2026' }
];
export const TYPES_F = ['texte', 'nombre', 'date', 'heure', 'adresse', 'liste', 'case', 'lien'];
export const CH0 = [
  { k: 'f1', t: 'Date du mariage', ty: 'date', ob: true }, { k: 'f2', t: 'Heure de la cérémonie', ty: 'heure', ob: true },
  { k: 'f3', t: 'Lieu', ty: 'groupe répétable', ob: true, sub: 'Nom du lieu · Adresse · Heure d’arrivée · Heure de fin' },
  { k: 'f4', t: 'Nombre d’invités', ty: 'nombre', ob: false }, { k: 'f5', t: 'Type de cérémonie', ty: 'liste', ob: false, sub: 'civile · religieuse · laïque' },
  { k: 'f6', t: 'Personnes à photographier en priorité', ty: 'texte', ob: false }, { k: 'f7', t: 'Moments clés', ty: 'texte', ob: false },
  { k: 'f8', t: 'Contact le jour J', ty: 'texte', ob: true }, { k: 'f9', t: 'Moodboard', ty: 'lien', ob: false },
  { k: 'f10', t: 'Restrictions du lieu ou du culte', ty: 'texte', ob: false }, { k: 'f11', t: 'Plan de table fourni', ty: 'case', ob: false }
];
export const SVC_P = SERVICES.map((s) => [s.id, s.t]);
export const MOD0 = [
  { k: 'm1', t: 'Production mariage', et: ['Tri', 'Retouche', 'Export'], sv: { mar: 42, eng: 42 } },
  { k: 'm2', t: 'Production reportage', et: ['Tri', 'Retouche légère'], sv: { evt: 10 } },
  { k: 'm3', t: 'Production portrait', et: ['Tri', 'Retouche'], sv: { fam: 21, ann: 21 } }
];
