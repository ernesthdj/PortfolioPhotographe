// Logique et données communes au planning (E39) et à la production (E28).
// Reprend les parties utiles de clients-logic des planches, en s'appuyant sur data/dossiers.js
// pour les numéros, clients, services, dates de shooting et étapes (une seule source de vérité).
import { DOSSIERS, SHOOTINGS, AUJOURDHUI, dossier } from '../../data/dossiers.js';

export const TODAY = AUJOURDHUI;
export const STC = { soumis: '#3AA6B5', accepte: '#D9783A', confirme: '#7A1F33' };
const WDL = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const WDS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
export const MOIS = { 10: 'octobre', 11: 'novembre', 12: 'décembre' };

// ------------------------------------------------------------------ production (E28)
// Étapes, étape en cours, dates de passage et échéance de livraison : propres à la production (planche).
// Client, service et date de shooting viennent de DOSSIERS.
const SUIVI = [
  { num: '2026-019', ech: '31 oct.', ek: 20261031, st: ['Tri', 'Retouche', 'Export', 'Livraison'], cur: 2, dt: ['22 sept.', '8 oct.', '30 oct.'] },
  { num: '2026-031', ech: '6 nov.', ek: 20261106, st: ['Tri', 'Retouche légère', 'Livraison'], cur: 1, dt: ['19 oct.', '24 oct.'] },
  { num: '2026-035', ech: '13 nov.', ek: 20261113, st: ['Tri', 'Retouche', 'Livraison'], cur: 2, dt: ['3 nov.', '6 nov.', '10 nov.'] },
  { num: '2026-037', ech: '22 nov.', ek: 20261122, st: ['Tri', 'Retouche', 'Livraison'], cur: 1, dt: ['2 nov.', '9 nov.'] },
  { num: '2026-038', ech: '12 déc.', ek: 20261212, st: ['Tri', 'Retouche', 'Export', 'Livraison'], cur: 0, dt: ['2 nov.'] }
];

/** Shootings réalisés, non livrés : copie modifiable par la page. */
export function productionInitiale() {
  return SUIVI.map((s) => {
    const d = dossier(s.num);
    return { k: 'p' + s.num, num: s.num, cli: d.cli, srv: d.srv, sh: d.date.replace(/ \d{4}$/, ''), ech: s.ech, ek: s.ek, st: s.st.slice(), cur: s.cur, dt: s.dt.slice() };
  });
}

/** Repère d'échéance : en retard / proche (7 jours) / dans les temps. */
export function repere(p) {
  return p.ek < TODAY ? ['En retard', '#7A1F33', 'none']
    : p.ek <= TODAY + 7 ? ['Échéance proche', '#D9783A', 'none']
      : ['Dans les temps', 'transparent', 'inset 0 0 0 1.5px #8C8E93'];
}

// ------------------------------------------------------------------ planning (E39)
export const GRID = Array.from({ length: 42 }, (_, i) => {
  const dt = new Date(2026, 9, 26 + i);
  return { k: dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate(), d: dt.getDate(), m: dt.getMonth() + 1, wd: i % 7, i };
});
const dansGrille = (k) => k >= GRID[0].k && k <= GRID[41].k;

/** Shootings comptés (acceptés, confirmés) et signalés (soumis) qui ont une heure dans SHOOTINGS. */
export const EV = DOSSIERS
  .filter((d) => SHOOTINGS[d.num] && ['soumis', 'accepte', 'confirme'].includes(d.et) && dansGrille(d.k))
  .sort((a, b) => a.k - b.k || SHOOTINGS[a.num].h.localeCompare(SHOOTINGS[b.num].h))
  .map((d) => {
    const s = SHOOTINGS[d.num];
    return { k: d.k, d: s.d, hT: s.h, h: Number(s.h.slice(0, 2)) + Number(s.h.slice(3)) / 60, t: d.srv + ' · ' + s.lieu + (d.et === 'soumis' ? ' · signalé' : ''), ty: d.et, num: d.num };
  });

/** Livraisons (échéances de la production) et paiements, tous rattachés à des dossiers existants. */
const ALL = SUIVI.filter((s) => dansGrille(s.ek)).map((s) => ({ k: s.ek, t: 'Livraison · n° ' + s.num, ty: 'liv' }))
  .concat([
    { k: 20261120, t: 'Acompte · n° 2026-047', ty: 'pay' },
    { k: 20261203, t: 'Solde · n° 2026-041', ty: 'pay' }
  ]);
export const BLK = { 20261124: 'Formation', 20261125: 'Formation', 20261130: 'Congé' };
export const SUR = { 20261128: true };

export const evDay = (k) => EV.filter((e) => e.k === k);
export const allDay = (k) => ALL.filter((e) => e.k === k);
export const caseVide = (k) => !evDay(k).length && !allDay(k).length && !BLK[k];
export const DESC = (k) => { const g = GRID.find((z) => z.k === k); return WDL[g.wd] + ' ' + g.d + ' ' + MOIS[g.m]; };
export const majuscule = (s) => s.replace(/^./, (c) => c.toUpperCase());

/** Élément d'agenda (shooting) : couleur, ombre, libellé accessible. */
export const item = (e) => ({
  t: e.t, hT: e.hT || '', c: e.ty === 'soumis' ? 'transparent' : STC[e.ty], sh: e.ty === 'soumis' ? 'inset 0 0 0 1.5px #3AA6B5' : 'none',
  aria: (e.hT ? e.hT + ', ' : '') + e.t + ', dossier ' + e.num + (e.ty === 'soumis' ? ', soumis, pas encore compté' : '')
});
/** Élément d'agenda (livraison ou paiement). */
export const itemEcheance = (e) => ({ t: e.t, hT: '', c: 'transparent', sh: e.ty === 'liv' ? 'inset 0 0 0 1.5px #0D0E10' : 'inset 0 0 0 1.5px #D9783A', aria: e.t });
export const hhmm = (h) => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
