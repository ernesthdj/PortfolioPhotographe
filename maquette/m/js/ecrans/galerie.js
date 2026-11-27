// Galerie : un fil par catégorie (sous-navigation du dock), reportages regroupés par événement, rangées de
// photos à leur format, témoignage à la place d'une photo. Toucher une photo l'agrandit depuis sa vignette ;
// la croix la repose dans sa vignette pendant que la page se redessine (retour rapide, jamais l'intro rejouée).
import { creerEcran } from '../lib/ecran.js';
import { eyebrow, titre, ecrit, filet, lienFleche, photo, rv } from '../lib/ecriture.js';
import { el } from '../../../js/lib/dom.js';
import { creerZoomPhotos } from '../lib/zoom-photo.js';
import { PHOTOS } from '../photos.js';
import { EVT } from '../../../data/galerie-evenements.js';

export const titreDoc = 'Galerie · Ernest H.';

const CATS = [
  ['tout', 'Tout', 'Toutes les', 'histoires.'], ['mariages', 'Mariages', 'Les', 'mariages.'], ['engagement', 'Engagement', 'Les', 'engagements.'],
  ['famille', 'Famille', 'Les', 'familles.'], ['anniversaires', 'Anniversaires', 'Les', 'anniversaires.'], ['evenementiel', 'Événementiel', 'Les', 'événements.'], ['culinaire', 'Culinaire', 'Le', 'culinaire.']
];
// Événements = ceux de la version PC (data/galerie-evenements.js) : mêmes photos, mêmes séries, même ordre. `quote` : un témoignage s'invite dans la grille.
const CLE = ['mariages', 'engagement', 'famille', 'anniversaires', 'evenementiel', 'culinaire'];
const EV = {};
EVT.forEach((ev) => { const l = (EV[CLE[ev.svc]] = EV[CLE[ev.svc]] || []); l.push({ tag: ev.tag, line: ev.txt, ph: ev.ph, quote: l.length === 0 && [0, 1, 3].includes(ev.svc) }); });
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
    TETES.forEach(([cle, label], q) => { if (!EV[cle]) return; items.push({ t: 'h', label, num: '0' + (q + 1), cle }); grouper(EV[cle][0], EV[cle][0].ph.slice(0, 3), false); });   // un service sans série (CMS partiel) est sauté
  } else {
    (EV[cat] || []).forEach((ev) => { items.push({ t: 'm', tag: ev.tag, line: ev.line }); grouper(ev, ev.ph, !!ev.quote); });
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
