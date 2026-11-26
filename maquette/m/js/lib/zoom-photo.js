// Photo agrandie, commune à tous les écrans : le cadre part de la vignette, la photo se développe, la croix la repose
// dans sa vignette pendant que la page se redessine (retour rapide, jamais l'intro rejouée). Elle se couche avec le
// téléphone (capteur d'orientation) quand elle est en paysage.
//
// Usage (dans un écran) :
//   const zoom = creerZoomPhotos(e, ctx, { liste: () => [{ idx, cap }], tuile: (i) => élément de la vignette i });
//   zoom.ouvrir(i) · zoom.nettoyer() (dans desactiver) · zoom.ouvert() · zoom.masqueChrome()
// `liste` = photos à parcourir dans l'ordre (idx = indice dans PHOTOS, cap = légende) ; chaque vignette doit contenir
// un <button> (rendu au focus au retour) et l'élément portant `data-rv` qui l'enveloppe sert à poser `fq-skip`.
import { el, svg } from '../../../js/lib/dom.js';
import { PHOTOS } from '../photos.js';

export function creerZoomPhotos(e, ctx, { liste: lireListe, tuile: trouverTuile }) {
  let v = null, zoom = null, inclinaison = 0;
  /** La page elle-même est en paysage (le système a pivoté l'écran) : c'est lui qui tourne, pas la photo. */
  const enPaysage = () => { try { return matchMedia('(orientation: landscape)').matches; } catch (x) { return false; } };
  const reduit = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (x) { return false; } };
  const rectDe = (n) => { const rr = e.racine.getBoundingClientRect(), r = n.getBoundingClientRect(); return { l: r.left - rr.left, t: r.top - rr.top, w: r.width, h: r.height }; };

  function creerZoom(liste) {
    const fond = el('div', { class: 'zoom-fond' });
    const imgs = liste.map((m) => { const p = PHOTOS[m.idx]; const i = el('div', { class: 'zimg reel ton-' + p.ton + (p.nb ? ' nb' : ''), role: 'img', 'aria-label': p.alt }, el('span', null, p.libelle)); i.style.setProperty('--img', 'url("' + (p.srcGrand || p.src) + '")'); i.style.setProperty('--img0', 'url("' + p.src + '")'); return i; });
    const boite = el('div', { class: 'zbox' }, ...imgs);
    const icone = (...d) => svg('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, ...d.map((x) => svg('path', { d: x })));
    const bFermer = el('button', { type: 'button', class: 'ib ib-fermer', 'aria-label': 'Fermer la photo', on: { click: fermer } }, icone('M6 6l12 12M18 6L6 18'));
    const num = el('span', { class: 'mono' }), cap = el('div', { class: 'mono', style: { marginTop: '8px' } });
    const legende = el('div', { class: 'zcap' }, el('div', { class: 'eyebrow' }, el('span', { class: 'regle', 'aria-hidden': 'true' }), num), cap);
    const bPrec = el('button', { type: 'button', class: 'ib ib-prec', 'aria-label': 'Photo précédente', on: { click: () => aller(-1) } }, icone('M15 5l-7 7 7 7'));
    const bSuiv = el('button', { type: 'button', class: 'ib ib-suiv', 'aria-label': 'Photo suivante', on: { click: () => aller(1) } }, icone('M9 5l7 7-7 7'));
    const ctl = el('div', { class: 'zctl' }, bFermer, legende, bPrec, bSuiv);
    const racine = el('div', { class: 'zoom', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo agrandie' }, fond, boite, ctl);
    return { racine, fond, boite, imgs, ctl, legende, num, cap };
  }

  function ecouter(oui) {
    try {
      if (oui && !ecouter.dh) {
        ecouter.dh = (ev) => {
          if (ev.gamma === null || ev.gamma === undefined) return;
          if (enPaysage()) { if (inclinaison !== 0) { inclinaison = 0; rendreZoom(); } return; }   // écran déjà pivoté par le système : on ne tourne pas une 2e fois
          const g = ev.gamma;
          let tl = inclinaison;
          if (g < -55) tl = 90; else if (g > 55) tl = -90; else if (Math.abs(g) < 35) tl = 0;   // hystérésis : pas de va-et-vient près du seuil
          if (tl !== inclinaison) { inclinaison = tl; rendreZoom(); }
        };
        window.addEventListener('deviceorientation', ecouter.dh);
        ecouter.rz = () => rendreZoom();   // le système pivote l'écran : la photo se replace à la nouvelle taille
        window.addEventListener('resize', ecouter.rz);
      } else if (!oui && ecouter.dh) { window.removeEventListener('deviceorientation', ecouter.dh); window.removeEventListener('resize', ecouter.rz); ecouter.dh = null; ecouter.rz = null; }
    } catch (x) { /* capteur indisponible : la photo reste droite */ }
  }
  /** iPhone : l'accès au capteur se demande depuis un geste de l'utilisateur ; l'ouverture d'une photo (un tap) en est un. */
  function demanderCapteur() {
    try { const D = window.DeviceOrientationEvent; if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {}); } catch (x) { /* refus : la photo reste droite */ }
  }

  function rendreZoom() {
    if (!v || !zoom) return;
    const liste = v.liste;
    const W = e.racine.clientWidth, H = e.racine.clientHeight, m = liste[v.i], p = PHOTOS[m.idx];
    const ecranPaysage = enPaysage();
    const paysage = p.r > 1, rot = paysage && !ecranPaysage ? inclinaison : 0;   // une photo en paysage se couche quand on couche le téléphone (écran verrouillé en portrait)
    let cible;
    if (rot !== 0) { const Wd = Math.min(H * 0.73, (W - 44) * p.r), Hd = Wd / p.r; cible = { l: W / 2 - Wd / 2, t: H * 0.44 - Hd / 2, w: Wd, h: Hd, rot }; }
    else if (ecranPaysage) { const w = Math.min(W - 100, (H - 16) * p.r), h = w / p.r; cible = { l: (W - w) / 2, t: (H - h) / 2, w, h, rot: 0 }; }   // écran en paysage : la photo remplit la hauteur (légende posée dessus), boutons sur les côtés
    else { const w = Math.min(W - 44, H * 0.71 * p.r), h = w / p.r; cible = { l: (W - w) / 2, t: (H - h) / 2 - 28, w, h, rot: 0 }; }
    const b = v.ph === 'to' ? cible : { ...v.rect, rot: 0 };
    Object.assign(zoom.boite.style, { left: b.l + 'px', top: b.t + 'px', width: b.w + 'px', height: b.h + 'px', transform: `rotate(${b.rot}deg)` });
    zoom.boite.className = 'zbox pr' + (v.ph === 'back' ? ' bk' : '');
    zoom.fond.classList.toggle('on', v.ph === 'to');
    zoom.ctl.style.opacity = v.ph === 'to' ? '1' : '0';
    zoom.ctl.style.pointerEvents = v.ph === 'to' ? 'auto' : 'none';
    zoom.legende.style.top = (ecranPaysage ? cible.t + cible.h - 50 : rot !== 0 ? H - 144 : Math.min(cible.t + cible.h + 22, H - 144)) + 'px';
    zoom.legende.style.left = ecranPaysage ? cible.l + 14 + 'px' : '';     // en paysage la légende est sur la photo, en bas à gauche
    zoom.legende.style.right = ecranPaysage ? 'auto' : ''
    zoom.num.textContent = `${String(v.i + 1).padStart(2, '0')} / ${String(liste.length).padStart(2, '0')}`;
    zoom.cap.textContent = m.cap;
    zoom.imgs.forEach((im, k) => {
      const nb = PHOTOS[liste[k].idx].nb ? ' nb' : '';
      im.className = 'zimg reel ton-' + PHOTOS[liste[k].idx].ton + nb + (v.ph === 'back' ? (k === v.i ? ' fin' : '') : (k === v.i ? ' on' + (v.premier ? ' pr' : ' nx') : (k === v.prev ? ' out' : '')));
    });
  }

  function ouvrir(i) {
    if (v) return;
    const tuile = trouverTuile(i);
    if (!tuile) return;
    const liste = lireListe();
    v = { i, prev: -1, ph: 'from', rect: rectDe(tuile), premier: true, liste };
    zoom = creerZoom(liste);
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
    document.documentElement.classList.add('zoom-ouvert');   // en paysage, le visualiseur prend tout l'écran (voir ecrans.css)
    demanderCapteur();
    ecouter(true);
    rendreZoom();
    e.vie.timeout(() => { if (v) { v.ph = 'to'; rendreZoom(); } }, 60);
    e.vie.timeout(() => { const f = zoom && zoom.racine.querySelector('[aria-label="Fermer la photo"]'); if (f) f.focus({ preventScroll: true }); }, 700);
  }
  function aller(d) {
    if (!v || v.ph !== 'to') return;
    v = { ...v, prev: v.i, i: (v.i + d + v.liste.length) % v.liste.length, premier: false };
    rendreZoom();
  }
  function fermer() {
    if (!v || v.ph !== 'to') return;
    const tuile = trouverTuile(v.i);
    if (tuile) tuile.scrollIntoView({ block: 'center', inline: 'nearest' });
    e.vie.timeout(() => {
      if (!v) return;
      const rect = tuile ? rectDe(tuile) : v.rect;
      // la page se redessine PENDANT que la photo revient (retour rapide, sans voile) : rien ne repasse à la fin
      e.racine.querySelectorAll('.rv[data-rv]').forEach((x) => x.classList.add('fq'));
      if (tuile) (tuile.closest('[data-rv]') || tuile).classList.add('fq-skip');      // la photo refermée rejoint sa place sans aucune animation
      e.racine.classList.remove('out');
      v = { ...v, ph: 'back', rect, prev: -1 };
      rendreZoom();
      ctx.majChrome();
      e.vie.timeout(() => { nettoyer(); if (tuile) { const t = tuile.querySelector('button'); if (t) t.focus({ preventScroll: true }); } }, reduit() ? 0 : 700);
    }, 70);
  }
  function nettoyer() {
    ecouter(false);
    document.documentElement.classList.remove('zoom-ouvert');
    if (zoom) { zoom.racine.remove(); zoom = null; }
    v = null; inclinaison = 0;
    // 'fq' reste en place : le retirer ferait changer les animations de toute la page et la rejouerait en entier
  }

  return { ouvrir, nettoyer, ouvert: () => !!v, masqueChrome: () => !!v && v.ph !== 'back' };
}
