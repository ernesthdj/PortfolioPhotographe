// Galerie : un fil par catégorie (sous-navigation du dock), reportages regroupés par événement, rangées de
// photos à leur format, témoignage à la place d'une photo. Toucher une photo l'agrandit depuis sa vignette ;
// la croix la repose dans sa vignette pendant que la page se redessine (retour rapide, jamais l'intro rejouée).
import { creerEcran } from '../lib/ecran.js';
import { eyebrow, titre, ecrit, filet, lienFleche, photo, rv } from '../lib/ecriture.js';
import { el } from '../../../js/lib/dom.js';
import { creerZoomPhotos } from '../lib/zoom-photo.js';
import { PHOTOS } from '../photos.js';

export const titreDoc = 'Galerie · Ernest H.';

const CATS = [
  ['tout', 'Tout', 'Toutes les', 'histoires.'], ['mariages', 'Mariages', 'Les', 'mariages.'], ['engagement', 'Engagement', 'Les', 'engagements.'],
  ['famille', 'Famille', 'Les', 'familles.'], ['anniversaires', 'Anniversaires', 'Les', 'anniversaires.'], ['evenementiel', 'Événementiel', 'Les', 'événements.'], ['culinaire', 'Culinaire', 'Le', 'culinaire.']
];
// exemples : étiquettes, lignes et lieux restent entre crochets ; `ph` = indices dans PHOTOS ; `quote` = un témoignage s'invite dans la grille
const EV = {
  mariages: [{ tag: 'Mariage · [Lieu] · 2026', line: '[Une ligne sur la journée, écrite par Ernest.]', ph: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], quote: true }, { tag: 'Mariage · [Lieu] · 2025', line: '[Une ligne sur la journée.]', ph: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32] }],
  engagement: [{ tag: 'Engagement · [Lieu] · 2026', line: '[Une ligne sur la séance.]', ph: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42], quote: true }],
  famille: [{ tag: 'Famille · [Lieu] · 2026', line: '[Une ligne sur la séance.]', ph: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52] }],
  anniversaires: [{ tag: 'Anniversaire · [Lieu] · 2026', line: '[Une ligne sur la soirée.]', ph: [53, 54, 55, 56, 57, 58, 59, 60], quote: true }],
  evenementiel: [{ tag: 'Événement · [Lieu] · 2026', line: '[Une ligne sur l’événement.]', ph: [61, 62, 63, 64, 65, 66, 67, 68] }],
  culinaire: [{ tag: 'Culinaire · [Lieu] · 2026', line: '[Une ligne sur la commande.]', ph: [69, 70, 71, 72, 73, 74, 75, 76] }]
};
const TETES = [['mariages', 'Mariages'], ['engagement', 'Engagement'], ['famille', 'Famille lifestyle'], ['anniversaires', 'Anniversaires'], ['evenementiel', 'Événementiel'], ['culinaire', 'Culinaire & studio']];

/** Éléments du fil d'une catégorie + liste à plat des photos (pour le zoom). */
function assembler(cat) {
  const items = [], liste = [];
  const cliche = (idx, large, d, tag) => { const n = liste.length; liste.push({ idx, cap: tag }); items.push({ t: 'p', n, idx, large, d }); };
  const grouper = (ev, phs, avecCitation) => {
    let cite = !avecCitation;
    for (let k = 0; k < phs.length; k++) {
      const p = PHOTOS[phs[k]];
      if (p.r > 1) { cliche(phs[k], true, 0, ev.tag); continue; }
      const suivant = phs[k + 1] !== undefined ? PHOTOS[phs[k + 1]] : null;
      if (suivant && suivant.r < 1) { cliche(phs[k], false, 0, ev.tag); cliche(phs[k + 1], false, 0.25, ev.tag); k++; }
      else { cliche(phs[k], false, 0, ev.tag); if (!cite) { items.push({ t: 'q' }); cite = true; } }
    }
  };
  if (cat === 'tout') {
    TETES.forEach(([cle, label], q) => { items.push({ t: 'h', label, num: '0' + (q + 1), cle }); grouper(EV[cle][0], EV[cle][0].ph.slice(0, 3), false); });
  } else {
    EV[cat].forEach((ev) => { items.push({ t: 'm', tag: ev.tag, line: ev.line }); grouper(ev, ev.ph, !!ev.quote); });
  }
  return { items, liste };
}

export function creer(ctx) {
  const e = creerEcran(ctx);
  let cat = 'tout', liste = [];

  // ---------- fil ----------
  const rendre = (it) => {
    if (it.t === 'h') {
      return rv(el('div', { class: 'g-tete' },
        el('div', { class: 'g-bandeau' },
          el('div', null, el('span', { class: 'mono g-num' }, ecrit(it.num, { d: 0, u: 0.5 })), el('div', { class: 'g-label' }, ecrit(it.label, { d: 0.15, u: 0.6 }))),
          lienFleche('Voir plus', { onClick: () => ctx.aller('galerie', it.cle), aria: 'Voir plus : ' + it.label, d: 0.5 })),
        filet(0.1, 1)));
    }
    if (it.t === 'm') {
      return rv(el('div', { class: 'g-marque' }, el('span', { class: 'mono' }, ecrit(it.tag, { d: 0, u: 0.6 })), el('div', { class: 'g-ligne' }, ecrit(it.line, { d: 0.3, u: 0.7, bloc: true })), filet(0.1, 1)));
    }
    if (it.t === 'q') {
      return rv(el('div', { class: 'citation' },
        el('div', { class: 'ser' }, ecrit('« [Un témoignage', { d: 0.2, u: 0.8, tete: true })),
        el('div', { class: 'ser' }, ecrit('court.] »', { d: 0.6, u: 0.7, tete: true })),
        el('div', { class: 'mono' }, ecrit('[Prénoms]', { d: 1, u: 0.5 }))));
    }
    const ph = PHOTOS[it.idx];
    const p = photo({ ton: ph.ton, nb: ph.nb, libelle: ph.libelle, alt: ph.alt, src: ph.src, d: it.d });
    p.removeAttribute('role'); p.setAttribute('aria-hidden', 'true');
    const bouton = el('button', { type: 'button', class: 'tap', 'aria-label': ph.alt + ' — agrandir', on: { click: () => zoom.ouvrir(it.n) } });
    return rv(el('div', { class: 'tuile' + (it.large ? ' large' : ''), 'data-pid': String(it.n) }, p, bouton));
  };

  const construire = () => {
    const c = CATS.find((x) => x[0] === cat);
    const { items, liste: l } = assembler(cat);
    liste = l;
    e.page.replaceChildren(eyebrow('Galerie'), titre(c[2], c[3]), el('div', { class: 'flux' }, ...items.map(rendre)));
  };

  // ---------- photo agrandie (module commun à tous les écrans) ----------
  const zoom = creerZoomPhotos(e, ctx, { liste: () => liste, tuile: (i) => e.racine.querySelector(`[data-pid="${i}"]`) });

  return {
    ...e,
    activer(arg) { cat = CATS.some((c) => c[0] === arg) ? arg : 'tout'; construire(); e.activer(); },
    desactiver() { e.vie.nettoyer(); zoom.nettoyer(); e.racine.classList.remove('out'); e.desactiver(); },
    changer(arg) { const k = CATS.some((c) => c[0] === arg) ? arg : 'tout'; if (k === cat || zoom.ouvert()) return; cat = k; e.refaire(construire); },
    sousNav() { return { cle: 'galerie', liste: CATS.map(([k, l]) => [k, l]), courant: cat, choisir: (k) => ctx.aller('galerie', k === 'tout' ? null : k) }; },
    masqueChrome: zoom.masqueChrome
  };
}
