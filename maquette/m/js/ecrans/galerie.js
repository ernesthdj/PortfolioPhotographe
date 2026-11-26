// Galerie : un fil par catégorie (sous-navigation du dock), reportages regroupés par événement, rangées de
// photos à leur format, témoignage à la place d'une photo. Toucher une photo l'agrandit depuis sa vignette ;
// la croix la repose dans sa vignette pendant que la page se redessine (retour rapide, jamais l'intro rejouée).
import { creerEcran } from '../lib/ecran.js';
import { eyebrow, titre, ecrit, filet, lienFleche, photo, rv } from '../lib/ecriture.js';
import { el, svg } from '../../../js/lib/dom.js';
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
  let cat = 'tout', liste = [], v = null, zoom = null, pivot = false, capte = false, inclinaison = 0;
  const reduit = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (x) { return false; } };

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
    const bouton = el('button', { type: 'button', class: 'tap', 'aria-label': ph.alt + ' — agrandir', on: { click: () => ouvrir(it.n) } });
    return rv(el('div', { class: 'tuile' + (it.large ? ' large' : ''), 'data-pid': String(it.n) }, p, bouton));
  };

  const construire = () => {
    const c = CATS.find((x) => x[0] === cat);
    const { items, liste: l } = assembler(cat);
    liste = l;
    e.page.replaceChildren(eyebrow('Galerie'), titre(c[2], c[3]), el('div', { class: 'flux' }, ...items.map(rendre)));
  };

  // ---------- photo agrandie ----------
  const rectDe = (n) => { const rr = e.racine.getBoundingClientRect(), r = n.getBoundingClientRect(); return { l: r.left - rr.left, t: r.top - rr.top, w: r.width, h: r.height }; };

  function creerZoom() {
    const fond = el('div', { class: 'zoom-fond' });
    const imgs = liste.map((m) => { const p = PHOTOS[m.idx]; const i = el('div', { class: 'zimg reel ton-' + p.ton + (p.nb ? ' nb' : ''), role: 'img', 'aria-label': p.alt }, el('span', null, p.libelle)); i.style.setProperty('--img', 'url("' + p.src + '")'); return i; });
    const boite = el('div', { class: 'zbox' }, ...imgs);
    const icone = (...d) => svg('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, ...d.map((x) => svg('path', { d: x })));
    const bPivot = el('button', { type: 'button', class: 'ib', 'aria-pressed': 'false', 'aria-label': 'Option : pivoter la photo quand on incline le téléphone', style: { left: '16px', top: 'calc(16px + env(safe-area-inset-top))' }, on: { click: basculerPivot } }, icone('M20 12a8 8 0 1 1-2.6-5.9', 'M20 4v4h-4'));
    const bFermer = el('button', { type: 'button', class: 'ib', 'aria-label': 'Fermer la photo', style: { right: '16px', top: 'calc(16px + env(safe-area-inset-top))' }, on: { click: fermer } }, icone('M6 6l12 12M18 6L6 18'));
    const num = el('span', { class: 'mono' }), cap = el('div', { class: 'mono', style: { marginTop: '8px' } });
    const legende = el('div', { class: 'zcap' }, el('div', { class: 'eyebrow' }, el('span', { class: 'regle', 'aria-hidden': 'true' }), num), cap);
    const bPrec = el('button', { type: 'button', class: 'ib', 'aria-label': 'Photo précédente', style: { left: '22px', bottom: 'calc(28px + env(safe-area-inset-bottom))' }, on: { click: () => aller(-1) } }, icone('M15 5l-7 7 7 7'));
    const bSuiv = el('button', { type: 'button', class: 'ib', 'aria-label': 'Photo suivante', style: { right: '22px', bottom: 'calc(28px + env(safe-area-inset-bottom))' }, on: { click: () => aller(1) } }, icone('M9 5l7 7-7 7'));
    const ctl = el('div', { class: 'zctl' }, bPivot, bFermer, legende, bPrec, bSuiv);
    const racine = el('div', { class: 'zoom', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo agrandie' }, fond, boite, ctl);
    return { racine, fond, boite, imgs, ctl, bPivot, legende, num, cap };
  }

  function ecouter(oui) {
    try {
      if (oui && !ecouter.dh) {
        ecouter.dh = (ev) => {
          if (ev.gamma === null || ev.gamma === undefined) return;
          capte = true;
          const g = ev.gamma;
          let tl = inclinaison;
          if (g < -55) tl = 90; else if (g > 55) tl = -90; else if (Math.abs(g) < 35) tl = 0;   // hystérésis : pas de va-et-vient près du seuil
          if (tl !== inclinaison) { inclinaison = tl; rendreZoom(); }
        };
        window.addEventListener('deviceorientation', ecouter.dh);
      } else if (!oui && ecouter.dh) { window.removeEventListener('deviceorientation', ecouter.dh); ecouter.dh = null; }
    } catch (x) { /* capteur indisponible : la rotation reste manuelle */ }
  }
  function basculerPivot() {
    pivot = !pivot;
    try { if (pivot && window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function') window.DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (x) { /* refus : on garde 90° fixe */ }
    rendreZoom();
  }

  function rendreZoom() {
    if (!v || !zoom) return;
    const W = e.racine.clientWidth, H = e.racine.clientHeight, m = liste[v.i], p = PHOTOS[m.idx];
    const paysage = p.r > 1, rot = paysage && pivot ? (capte ? inclinaison : 90) : 0;
    let cible;
    if (rot !== 0) { const Wd = Math.min(H * 0.73, (W - 44) * p.r), Hd = Wd / p.r; cible = { l: W / 2 - Wd / 2, t: H * 0.44 - Hd / 2, w: Wd, h: Hd, rot }; }
    else { const w = Math.min(W - 44, H * 0.71 * p.r), h = w / p.r; cible = { l: (W - w) / 2, t: (H - h) / 2 - 28, w, h, rot: 0 }; }
    const b = v.ph === 'to' ? cible : { ...v.rect, rot: 0 };
    Object.assign(zoom.boite.style, { left: b.l + 'px', top: b.t + 'px', width: b.w + 'px', height: b.h + 'px', transform: `rotate(${b.rot}deg)` });
    zoom.boite.className = 'zbox pr' + (v.ph === 'back' ? ' bk' : '');
    zoom.fond.classList.toggle('on', v.ph === 'to');
    zoom.ctl.style.opacity = v.ph === 'to' ? '1' : '0';
    zoom.ctl.style.pointerEvents = v.ph === 'to' ? 'auto' : 'none';
    zoom.bPivot.hidden = !paysage;
    zoom.bPivot.classList.toggle('pv', pivot);
    zoom.bPivot.setAttribute('aria-pressed', String(pivot));
    zoom.legende.style.top = (rot !== 0 ? H - 144 : Math.min(cible.t + cible.h + 22, H - 144)) + 'px';
    zoom.num.textContent = `${String(v.i + 1).padStart(2, '0')} / ${String(liste.length).padStart(2, '0')}`;
    zoom.cap.textContent = m.cap;
    zoom.imgs.forEach((im, k) => {
      const nb = PHOTOS[liste[k].idx].nb ? ' nb' : '';
      im.className = 'zimg reel ton-' + PHOTOS[liste[k].idx].ton + nb + (v.ph === 'back' ? (k === v.i ? ' fin' : '') : (k === v.i ? ' on' + (v.premier ? ' pr' : ' nx') : (k === v.prev ? ' out' : '')));
    });
  }

  function ouvrir(i) {
    if (v) return;
    const tuile = e.racine.querySelector(`[data-pid="${i}"]`);
    if (!tuile) return;
    v = { i, prev: -1, ph: 'from', rect: rectDe(tuile), premier: true };
    zoom = creerZoom();
    e.racine.append(zoom.racine);
    // un tap en dehors de la photo (et hors boutons) la referme aussi ; la couche de boutons couvre tout l'écran, on compare donc avec le cadre de la photo
    zoom.racine.addEventListener('click', (ev) => {
      if (ev.target.closest('.ib')) return;
      const r = zoom.boite.getBoundingClientRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) return;
      fermer();
    });
    e.racine.querySelectorAll('.fq-skip').forEach((x) => x.classList.remove('fq-skip'));
    e.racine.classList.add('out');                    // le fond se décompose derrière la photo
    ctx.majChrome();
    ecouter(true);
    rendreZoom();
    e.vie.timeout(() => { if (v) { v.ph = 'to'; rendreZoom(); } }, 60);
    e.vie.timeout(() => { const f = zoom && zoom.racine.querySelector('[aria-label="Fermer la photo"]'); if (f) f.focus({ preventScroll: true }); }, 700);
  }
  function aller(d) {
    if (!v || v.ph !== 'to') return;
    v = { ...v, prev: v.i, i: (v.i + d + liste.length) % liste.length, premier: false };
    rendreZoom();
  }
  function fermer() {
    if (!v || v.ph !== 'to') return;
    const tuile = e.racine.querySelector(`[data-pid="${v.i}"]`);
    if (tuile) tuile.scrollIntoView({ block: 'center', inline: 'nearest' });
    e.vie.timeout(() => {
      if (!v) return;
      const rect = tuile ? rectDe(tuile) : v.rect;
      // la page se redessine PENDANT que la photo revient (retour rapide, sans voile) : rien ne repasse à la fin
      e.racine.querySelectorAll('.rv[data-rv]').forEach((x) => x.classList.add('fq'));
      if (tuile) tuile.classList.add('fq-skip');      // la photo refermée rejoint sa place sans aucune animation
      e.racine.classList.remove('out');
      v = { ...v, ph: 'back', rect, prev: -1 };
      rendreZoom();
      ctx.majChrome();
      e.vie.timeout(() => { nettoyerZoom(); if (tuile) { const t = tuile.querySelector('button'); if (t) t.focus({ preventScroll: true }); } }, reduit() ? 0 : 700);
    }, 70);
  }
  function nettoyerZoom() {
    ecouter(false);
    if (zoom) { zoom.racine.remove(); zoom = null; }
    v = null; inclinaison = 0;
    // 'fq' reste en place : le retirer ferait changer les animations de toute la page et la rejouerait en entier
  }

  return {
    ...e,
    activer(arg) { cat = CATS.some((c) => c[0] === arg) ? arg : 'tout'; construire(); e.activer(); },
    desactiver() { e.vie.nettoyer(); nettoyerZoom(); e.racine.classList.remove('out'); e.desactiver(); },
    changer(arg) { const k = CATS.some((c) => c[0] === arg) ? arg : 'tout'; if (k === cat || v) return; cat = k; e.refaire(construire); },
    sousNav() { return { cle: 'galerie', liste: CATS.map(([k, l]) => [k, l]), courant: cat, choisir: (k) => ctx.aller('galerie', k === 'tout' ? null : k) }; },
    masqueChrome: () => !!v && v.ph !== 'back'
  };
}
