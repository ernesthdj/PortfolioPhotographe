// Source de données d'exemple UNIQUE pour les dossiers, partagée par l'espace client et l'atelier.
// Les montants (centimes TVAC, TVA 21 %) DÉRIVENT de la référence de prix du simulateur : data/tarifs.js.
// Aucune donnée réelle : tout est factice.

import { calculer, totalCentimes, service, COMMUNES, hm, virgule } from './tarifs.js';

/** « Aujourd'hui » dans la maquette (mercredi 11 novembre 2026), au format AAAAMMJJ. */
export const AUJOURDHUI = 20261111;
export const DATE_JOUR_LONGUE = 'mercredi 11 novembre 2026';

/** Étapes d'un dossier : libellé, couleur du point. Refusé / Annulé : contour seul (clos). */
export const ETAPES = {
  soumis: { t: 'Soumis', c: '#3AA6B5' },
  accepte: { t: 'Accepté', c: '#D9783A' },
  confirme: { t: 'Confirmé', c: '#7A1F33' },
  realise: { t: 'Réalisé', c: '#0D0E10' },
  refuse: { t: 'Refusé', c: 'transparent' },
  annule: { t: 'Annulé', c: 'transparent' }
};
/** Transitions autorisées (R06.8). */
export const TRANSITIONS = { soumis: ['accepte', 'refuse', 'annule'], accepte: ['confirme', 'annule'], confirme: ['realise', 'annule'], realise: [], refuse: [], annule: [] };

// num, client, e-mail, date du shooting (affichage), AAAAMMJJ, étape, demande en attente,
// puis la prestation telle que la configure le simulateur : { sid, dur | qty, opts, c (indice de commune) }
const BRUT = [
  ['2027-014', 'Camille D.', 'camille.d@example.com', '12 juin 2027', 20270612, 'soumis', true, { sid: 'mar', dur: 9.25, opts: ['album'], c: 0 }],
  ['2027-019', 'Hugo M.', 'hugo.m@example.com', '4 avr. 2027', 20270404, 'soumis', false, { sid: 'fam', dur: 2, opts: [], c: 1 }],
  ['2027-021', 'Sara K.', 'sara.k@example.com', '9 janv. 2027', 20270109, 'soumis', false, { sid: 'fam', dur: 1.5, opts: [], c: 3 }],
  ['2027-023', 'Nora B.', 'nora.b@example.com', '21 nov. 2026', 20261121, 'soumis', false, { sid: 'fam', dur: 1.5, opts: ['tir'], c: 3 }],
  ['2027-002', 'Studio Lemaire', 'contact@studio-lemaire.example', '20 févr. 2027', 20270220, 'accepte', true, { sid: 'evt', dur: 4, opts: ['tir'], c: 0 }],
  ['2026-047', 'Liège Events', 'hello@liege-events.example', '6 déc. 2026', 20261206, 'accepte', false, { sid: 'evt', dur: 4, opts: [], c: 2 }],
  ['2027-008', 'Inès & Tom', 'ines.tom@example.com', '3 juil. 2027', 20270703, 'accepte', false, { sid: 'mar', dur: 10, opts: ['album', 'sec'], c: 1 }],
  ['2027-011', 'Nora B.', 'nora.b@example.com', '15 mars 2027', 20270315, 'accepte', false, { sid: 'fam', dur: 2, opts: ['album'], c: 1 }],
  ['2027-005', 'Café Lumen', 'bonjour@cafe-lumen.example', '28 janv. 2027', 20270128, 'accepte', false, { sid: 'cul', qty: 20, opts: [], c: -1 }],
  ['2027-024', 'Camille D.', 'camille.d@example.com', '27 févr. 2027', 20270227, 'accepte', false, { sid: 'fam', dur: 2, opts: ['album'], c: 0 }],
  ['2027-003', 'Famille L.', 'famille.l@example.com', '28 nov. 2026', 20261128, 'accepte', false, { sid: 'fam', dur: 2, opts: [], c: 1 }],
  ['2026-048', 'Anaïs & Paul', 'anais.paul@example.com', '28 nov. 2026', 20261128, 'accepte', false, { sid: 'mar', dur: 5, opts: [], c: 2 }],
  ['2026-041', 'Famille R.', 'famille.r@example.com', '14 nov. 2026', 20261114, 'confirme', false, { sid: 'fam', dur: 2, opts: [], c: 1 }],
  ['2026-043', 'Ateliers V.', 'rh@ateliers-v.example', '18 nov. 2026', 20261118, 'confirme', false, { sid: 'evt', dur: 2, opts: [], c: 0 }],
  ['2026-044', 'Maison Ota', 'cuisine@maison-ota.example', '22 nov. 2026', 20261122, 'confirme', false, { sid: 'cul', qty: 12, opts: [], c: -1 }],
  ['2026-046', 'Léa & Max', 'lea.max@example.com', '19 juin 2027', 20270619, 'confirme', false, { sid: 'mar', dur: 8, opts: ['album'], c: 3 }],
  ['2026-019', 'Thomas & Léa', 'thomas.lea@example.com', '19 sept. 2026', 20260919, 'realise', false, { sid: 'mar', dur: 9, opts: ['album'], c: 1 }],
  ['2026-031', 'Julien P.', 'julien.p@example.com', '17 oct. 2026', 20261017, 'realise', false, { sid: 'evt', dur: 3, opts: [], c: 2 }],
  ['2026-035', 'Ateliers Nord', 'contact@ateliers-nord.example', '30 oct. 2026', 20261030, 'realise', false, { sid: 'evt', dur: 2, opts: [], c: 4 }],
  ['2026-038', 'Chloé & Sam', 'chloe.sam@example.com', '31 oct. 2026', 20261031, 'realise', false, { sid: 'mar', dur: 8, opts: [], c: 3 }],
  ['2026-037', 'Famille M.', 'famille.m@example.com', '1 nov. 2026', 20261101, 'realise', false, { sid: 'fam', dur: 2, opts: [], c: 1 }],
  ['2025-007', 'Camille D.', 'camille.d@example.com', '3 mars 2025', 20250303, 'realise', false, { sid: 'cul', qty: 10, opts: [], c: -1 }],
  ['2026-028', 'Amandine V.', 'amandine.v@example.com', '2 oct. 2026', 20261002, 'refuse', false, { sid: 'fam', dur: 1.5, opts: [], c: 0 }],
  ['2026-025', 'Brasserie Nord', 'contact@brasserie-nord.example', '20 sept. 2026', 20260920, 'annule', false, { sid: 'cul', qty: 15, opts: [], c: -1 }]
];

/** Configuration de la prestation au format du simulateur (lieux : un seul, à 14 h). */
const cfgDe = (p) => ({ sid: p.sid, dur: p.dur, qty: p.qty, opts: p.opts, lieux: service(p.sid).tech ? [{ c: p.c, h: 14 }] : [] });

export const DOSSIERS = BRUT.map((r) => {
  const cfg = cfgDe(r[7]);
  return { num: r[0], cli: r[1], mail: r[2], srv: service(r[7].sid).t, date: r[3], k: r[4], et: r[5], c: totalCentimes(cfg).ttc, dem: r[6], cfg };
});
export const dossier = (num) => DOSSIERS.find((d) => d.num === num);

/** Client connecté dans l'espace client : ses dossiers sont ceux de « Mes dossiers ». */
export const CLIENT_CONNECTE = { nom: 'Camille D.', mail: 'camille.d@example.com', dossiers: ['2027-014', '2027-024', '2025-007'] };

/** Lieu du mariage du dossier 2027-014 (Bruxelles, 44,8 km : transport 32,30 € comme dans le simulateur). */
export const LIEU_014 = { nom: 'Château du Karreveld', ville: COMMUNES[0], km: 44.8 };

/**
 * Dossier 2027-014 : lignes à prix figés (centimes HTVA), calculées par le simulateur (data/tarifs.js),
 * identiques côté client et côté atelier. 700,00 + 120,00 + 32,30 = 852,30 € HTVA, soit 1 031,28 € TVAC.
 */
const CALC_014 = calculer(dossier('2027-014').cfg);
const [L_SRV, L_ALB, L_TRP] = CALC_014.lignes;
export const LIGNES_014 = [
  { id: 'mar', o: L_SRV.o, t: L_SRV.t, d: L_SRV.sub + ' · 13:00 – 22:15 · ' + LIEU_014.nom + ', ' + LIEU_014.ville, ht: Math.round(L_SRV.ht * 100) },
  { id: 'album', o: L_ALB.o, t: L_ALB.t, d: '20 pages, couverture lin', ht: Math.round(L_ALB.ht * 100) },
  { id: 'trp', o: L_TRP.o, t: 'Transport', d: L_TRP.t, ht: Math.round(L_TRP.ht * 100), sub: L_TRP.sub }
];
/** Soumis le / modifiable jusqu'au. */
export const DATES_014 = { soumis: '9 novembre 2026', soumisCourt: '9 nov. 2026', limite: '13 mai 2027' };

/** Heure, durée (h) et lieu des shootings qui apparaissent dans le planning et le tableau de bord. */
export const SHOOTINGS = {
  '2026-041': { h: '10:30', d: 2, lieu: 'Namur' },
  '2026-043': { h: '09:00', d: 2, lieu: 'Bruxelles' },
  '2027-023': { h: '10:00', d: 1.5, lieu: 'Charleroi' },
  '2026-044': { h: '14:00', d: 3, lieu: 'Bruxelles' },
  '2027-003': { h: '11:00', d: 2, lieu: 'Namur' },
  '2026-048': { h: '15:00', d: 5, lieu: 'Liège' },
  '2026-047': { h: '18:00', d: 4, lieu: 'Liège' }
};

export { hm, virgule };
