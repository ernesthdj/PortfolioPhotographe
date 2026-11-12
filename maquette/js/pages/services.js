// Site · Services (retenue C : une fiche par service). Traduit PServices.dc.html.
import { rythme, E } from '../lib/anim.js';
import { monterEntete, animationsEntete } from '../lib/entete.js';
import { $, el, svg, mot, ecrire, animer, liste } from '../lib/dom.js';
import { creerVie } from '../lib/vie.js';

let vie = null;

export function init() {
  vie = creerVie();
  const R = rythme(.62), { K, T } = R;
  const fond = $('#fond');
  monterEntete(fond, { actif: 'services', a: animationsEntete(R) });

  // Tons de placeholder à la place des photos du canvas (0..4)
  const PH = [
    { ton: 'ton-1', alt: 'Les mariés devant le château' }, { ton: 'ton-2', alt: 'Couple enlacé dans un champ' },
    { ton: 'ton-3', alt: 'Les mariés sur un balcon en fer forgé' }, { ton: 'ton-4', alt: 'Baiser sur la joue' },
    { ton: 'ton-5', alt: 'Couple debout dans un grand champ' }
  ];
  const SVC = [
    { t: 'Mariages', i: 'le grand jour.', d: 'Des préparatifs à la soirée, la journée racontée en entier.', p: 0, ex: 'Samedi · 12:00 → 23:00 · 3 lieux' },
    { t: 'Engagement', i: 'avant le oui.', d: 'Une séance à deux, dans un lieu qui vous ressemble.', p: 1, ex: '1 h 30 · 1 lieu en extérieur' },
    { t: 'Famille', i: 'à la maison.', d: 'Chez vous, au rythme de vos habitudes, sans pose forcée.', p: 3, nb: true, ex: '2 h · à domicile' },
    { t: 'Anniversaires', i: 'la fête.', d: 'Les proches, les discours, les éclats de rire.', p: 2, ex: 'Soirée · 19:00 → 23:00 · 1 salle' },
    { t: 'Événementiel', i: 'le moment fort.', d: 'Conférences, lancements et soirées d’entreprise.', p: 4, ex: 'Journée · 09:00 → 17:00 · 1 lieu' },
    { t: 'Culinaire & studio', i: 'la matière.', d: 'Plats, produits et portraits en lumière maîtrisée.', p: 0, nb: true, ex: 'Demi-journée · en studio' }
  ];
  const LIG = [['Forfait de base', '[prix] €'], ['Durée incluse', '[X h]'], ['Heure supplémentaire', '[prix] € / h'], ['Trajet', '[X] km inclus']];

  const st = { sel: 0, sw: 0, out: false };
  let tChoix = null;

  // ---- animations fixes (table `a` de la planche)
  const a = {
    eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .6),
    pillL: `drawS ${.9 * K}s ${E} ${1.0 * K}s both`, pill: `habille 1.8s ease-in-out ${1.9 * K}s both`,
    pillC: 'apparait 1.8s ease-in-out 5.4s both, comete 20s linear 5.4s infinite', indA: `wIn ${.5 * K}s ${E} ${2.6 * K}s both`,
    r1: T(2.6, .6), r2: T(2.75, .6), chL: `wIn ${.4 * K}s ${E} ${1.9 * K}s both`,
    exL: `drawS ${.9 * K}s ${E} ${3.4 * K}s both`, exB: `habille 1.8s ease-in-out ${4.2 * K}s both`, exT: T(3.7, .5),
    dFl: `habille 1.2s ease ${4.0 * K}s both`, dCta: T(4.3, .5), arr: `wIn ${.4 * K}s ${E} ${4.8 * K}s both`
  };

  // ---- éléments
  const W = { eye: $('#eye'), r1: $('#r1'), r2: $('#r2'), ch: $('#ch'), t: $('#t'), i: $('#i'), d: $('#d'), exT: $('#ex-t'), ex: $('#ex'), tot: $('#tot'), cal: $('#cal'), dCta: $('#d-cta'), g: $('#g') };
  ecrire(W.eye, 'Services'); ecrire(W.r1, 'Prix de départ indicatifs'); ecrire(W.r2, 'le devis suit votre journée');
  ecrire(W.exT, 'Exemple de simulation'); ecrire(W.tot, '≈ [prix] €'); ecrire(W.cal, 'trajets et durée compris'); ecrire(W.dCta, 'Simuler ma journée');
  animer($('#eye-trait'), a.eyeL); animer(W.eye, a.eye);
  animer($('#pill-verre'), a.pill);
  document.querySelectorAll('.pill-l').forEach((p) => animer(p, a.pillL));
  animer($('#pill-c'), a.pillC); animer($('#ind'), a.indA);
  animer(W.r1, a.r1); animer(W.r2, a.r2); animer($('#ch-trait'), a.chL);
  document.querySelectorAll('.ex-l').forEach((p) => animer(p, a.exL));
  animer($('#ex-verre'), a.exB); animer(W.exT, a.exT);
  animer($('#d-fl'), a.dFl); animer(W.dCta, a.dCta); animer($('#d-arr'), a.arr);

  // ---- chapitres (colonne de gauche)
  const chapsEl = $('#chaps');
  liste(chapsEl, SVC, (c) => c.t, (c, i) => {
    const k = mot(String(i + 1).padStart(2, '0'), T(1.5 + i * .1, .3));
    const t = mot(c.t, T(1.55 + i * .1, .5));
    return el('button', { type: 'button', class: 'chap', 'aria-pressed': 'false', on: { click: () => choisir(i) } }, el('span', { class: 'k' }, k), t);
  });

  function choisir(i) {
    if (st.out || i === st.sel) return;
    st.out = true; render();
    if (tChoix) vie.clearTimeout(tChoix);
    tChoix = vie.timeout(() => { st.sel = i; st.sw += 1; st.out = false; render(); }, 340);
  }

  // ---- lignes de tarif et filets
  const lignesEl = $('#lignes'), filsEl = $('#fils');
  liste(lignesEl, LIG, (l) => l[0], (l, k) => {
    const wl = mot(l[0]), wv = mot(l[1]);
    const n = el('div', { class: 'ligne', style: { top: 364 + k * 36 + 'px' } }, el('span', { class: 'l' }, wl), el('span', { class: 'v' }, wv));
    n._wl = wl; n._wv = wv; return n;
  });
  const fils = LIG.map((_, k) => {
    const p = svg('path', { class: 'fil', pathLength: '100', d: `M0 ${392 + k * 36} L520 ${392 + k * 36}` });
    filsEl.append(p); return p;
  });

  // ---- cadre de la photo : sa géométrie suit la largeur gagnée (+gx), recalculée au redimensionnement
  const cadre = [$('#cadre'), $('#cadre-c')];
  const geometrie = () => {
    const dx = window.__scene ? window.__scene.dx : 0, gx = Math.min(dx, 260), w = 453 + gx;
    cadre.forEach((p) => p.setAttribute('d', `M1 1 L${w} 1 L${w} 641 L1 641 Z`));
  };
  geometrie();
  vie.ecouter(window, 'scene:resize', geometrie);

  // ---- rendu (équivalent de renderVals)
  function render() {
    const first = st.sw === 0, alt = st.sw % 2 === 1, s = SVC[st.sel], ph = PH[s.p];
    const Rr = (dl, d) => { const n = alt ? 'wIn2' : 'wIn'; return { o: `${n} ${d}s ${E} ${dl.toFixed(2)}s both`, f: `${n} ${d}s ${E} ${(dl + .16).toFixed(2)}s both` }; };
    const O = (k) => ({ o: `wOut .28s ${E} ${(.03 + k * .02).toFixed(2)}s both`, f: `wOut .26s ${E} ${(k * .02).toFixed(2)}s both` });
    const Wa = (k, dlF, d) => st.out ? O(k) : (first ? T(dlF, d) : Rr(.08 + k * .07, Math.min(.7, d)));

    [...chapsEl.children].forEach((b, i) => { b.className = st.sel === i ? 'chap on' : 'chap'; b.setAttribute('aria-pressed', st.sel === i ? 'true' : 'false'); });
    const ind = $('#ind'); ind.style.top = (194 + st.sel * 52 + 40) + 'px'; ind.style.width = Math.round(s.t.length * 8.4) + 'px';

    const dl = first ? 1.6 * K : .05, devN = (s.nb ? 'devNB' : 'dev') + (alt ? '2' : '');
    const photo = $('#photo');
    photo.className = 'ph ' + ph.ton; photo.setAttribute('aria-label', ph.alt); photo.firstElementChild.textContent = 'Photo · ' + s.t;
    animer(photo, st.out ? 'devOut .3s ease-out forwards' : `${devN} 2.8s ease-in-out ${dl.toFixed(2)}s both`);
    animer($('#cadre'), st.out ? 'none' : `${alt ? 'trace2' : 'trace'} 2.6s ${E} ${dl.toFixed(2)}s both`);
    animer($('#cadre-c'), st.out ? 'eteint .2s ease forwards' : `apparait 1.8s ease-in-out ${first ? 5.8 : 3.2}s both, comete 18s linear ${first ? 5.8 : 3.2}s infinite`);

    // textes de la fiche : réécrits seulement si le chapitre change
    const maj = (w, contenu, cle, anim) => { if (w._cle !== cle) { ecrire(w, contenu); w._cle = cle; } animer(w, anim); };
    const ital = (txt, taille) => () => el('i', { style: `font:italic 400 ${taille}px/1 'Instrument Serif',serif` }, txt);
    maj(W.ch, 'Chapitre ' + String(st.sel + 1).padStart(2, '0') + ' / 06', 'ch' + st.sel, Wa(0, 2.0, .6));
    maj(W.t, s.t, 't' + st.sel, Wa(1, 2.1, .9));
    maj(W.i, ital(s.i, 50), 'i' + st.sel, Wa(2, 2.35, .9));
    maj(W.d, s.d, 'd' + st.sel, Wa(3, 2.6, 1.1));
    maj(W.ex, s.ex, 'ex' + st.sel, Wa(8, 3.9, .8));
    animer(W.tot, Wa(9, 4.1, .6)); animer(W.cal, Wa(10, 4.3, .6));
    maj(W.g, 'Voir les photos · ' + s.t, 'g' + st.sel, Wa(11, 4.6, .6));
    [...lignesEl.children].forEach((n, k) => { animer(n._wl, Wa(4 + k, 2.9 + k * .12, .6)); animer(n._wv, Wa(4 + k, 3.0 + k * .12, .5)); });
    fils.forEach((p, k) => animer(p, st.out ? `undrawS .3s ${E} ${(k * .03).toFixed(2)}s both`
      : (first ? `drawS ${.8 * K}s ${E} ${((2.85 + k * .12) * K).toFixed(2)}s both` : `${alt ? 'drawS2' : 'drawS'} .6s ${E} ${(.1 + k * .07).toFixed(2)}s both`)));
  }
  render();

}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
