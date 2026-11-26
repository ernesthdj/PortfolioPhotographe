// Accueil (dashboard public). Traduit PAccueil.dc.html : en-tête à indicateur liquide, accroche tournante
// écrite par la goutte d'encre, collage justifié qui change selon le service survolé, ligne des services,
// photo agrandie. Monté par accueil.html (avec bouton « Rejouer ») et par l'intro (index.html, sans bouton).
import { E } from '../lib/anim.js';
import { el, svg, mot, ecrire, animer, liste, cheminSvg, cadrePhoto, setMot } from '../lib/dom.js';
import { monterEntete, majEntete, enteteMontee } from '../lib/entete.js';
import { creerVie } from '../lib/vie.js';
import { mesures as scene } from '../lib/scene.js';   // (« mesures » est déjà le nom de la mesure de texte plus bas)
import { memoriserFocus } from '../lib/modale.js';
import { creerPhotoAgrandie } from '../lib/photo-agrandie.js';
import { creerSurligneur } from '../lib/surligneur.js';
import { monterVagabond } from '../lib/vagabond.js';
import { PHOTOS, habillePhoto } from '../../data/photos-site.js';

const FRAGMENT = (...n) => { const f = document.createDocumentFragment(); f.append(...n); return f; };

// ---- contenus ----------------------------------------------------------------------------------------------
const SERVICES = [
  { t: 'Mariages', set: [0, 1, 2, 3] }, { t: 'Engagement', set: [1, 2, 4] },
  { t: 'Famille lifestyle', set: [3, 4, 0, 1, 2] }, { t: 'Anniversaires', set: [0, 4, 3] },
  { t: 'Événementiel', set: [2, 1, 0, 3, 4] }, { t: 'Culinaire & studio', set: [4, 3, 2, 1] }
];
const CAPS = ['Les mariés', 'Plein air', 'Le balcon', 'Complicité', 'Instant'];
const SERIF = (px) => `italic 400 ${px}px/1 'Instrument Serif', serif`;
const HERO = [
  { eye: 'Photographe · Belgique', lh: 62.6, font: '300 58px/1.08 Inter, sans-serif', ls: '-.035em', em: SERIF(64),
    lines: [['Des instants'], ['racontés comme'], ['ils ont été ', 'vécus.']], ind: [0, 0, 0],
    para: ['Mariages, familles, événements :', 'des images qui gardent l’émotion du moment.'] },
  { eye: 'Témoignage · Mariage', lh: 47.9, font: "italic 400 42px/1.14 'Instrument Serif', serif", ls: '-.01em', em: SERIF(42),
    lines: [['« On revit chaque instant'], ['en regardant'], ['nos photos. »']], ind: [0, 28, 56],
    para: ['— [Prénoms des mariés], [lieu]'] },
  { eye: 'Mariages · Familles · Événements', lh: 56.2, font: '600 54px/1.04 Inter, sans-serif', ls: '-.045em', em: SERIF(60),
    lines: [['Lumière naturelle,'], ['émotion ', 'vraie.']], ind: [0, 64],
    para: ['Un regard discret, de la préparation', 'à la dernière photo de la soirée.'] },
  { eye: 'Témoignage · Anniversaire', lh: 44.8, font: "italic 400 38px/1.18 'Instrument Serif', serif", ls: '-.01em', em: SERIF(38),
    lines: [['« Discret toute la soirée,'], ['et pourtant rien'], ['ne lui a échappé. »']], ind: [0, 0, 0],
    para: ['— [Prénom], [ville]'] },
  { eye: 'Six façons de raconter', lh: 57.2, font: '300 52px/1.1 Inter, sans-serif', ls: '-.035em', em: SERIF(58),
    lines: [['Des familles,'], ['des fêtes,'], ['des ', 'promesses.']], ind: [0, 44, 88],
    para: ['Choisissez un service ci-dessous', 'pour découvrir sa galerie.'] }
];
const COMC = ['#3AA6B5', '#0D0E10', '#D9783A', '#7A1F33'];
const COUL = ['#3AA6B5', '#D9783A', '#7A1F33', '#3AA6B5'];
const CDUR = [16, 13, 19, 15, 17], CDIR = ['comete', 'cometeR', 'comete', 'cometeR', 'comete'];
const NAV_TXT = ['Galerie', 'Services', 'À propos', 'Contact'];

// ---- mosaïque : lignes justifiées qui maximisent la surface ------------------------------------------------
// Zone du collage : ancrée à droite, elle s'élargit de dx avec la fenêtre ; la grille justifiée se recalcule sur cette largeur.
function rectsMosaique(ratios, dx = 0) {
  const AX = 640, AY = 124, AW = 716 + dx, AH = 452, GAP = 16, n = ratios.length;
  let best = null;
  for (let mask = 0; mask < (1 << (n - 1)); mask++) {
    const rows = []; let row = [0];
    for (let i = 1; i < n; i++) { if (mask & (1 << (i - 1))) { rows.push(row); row = [i]; } else row.push(i); }
    rows.push(row);
    const hs = rows.map((rw) => (AW - GAP * (rw.length - 1)) / rw.reduce((t, i) => t + ratios[i], 0));
    const tot = hs.reduce((t, h) => t + h, 0) + GAP * (rows.length - 1);
    const kk = Math.min(1, AH / tot);
    const area = rows.reduce((t, rw, ri) => t + rw.reduce((u, i) => u + ratios[i] * hs[ri] * kk * hs[ri] * kk, 0), 0);
    if (!best || -area < best.score) best = { rows, hs, tot, score: -area };
  }
  const k = Math.min(1, AH / best.tot), out = new Array(n);
  let y = AY + (AH - best.tot * k) / 2;
  best.rows.forEach((rw, ri) => {
    const h = best.hs[ri] * k, rowW = rw.reduce((t, i) => t + ratios[i] * h, 0) + GAP * (rw.length - 1);
    let x = AX + (AW - rowW) / 2;
    rw.forEach((i) => { const w = ratios[i] * h; out[i] = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }; x += w + GAP; });
    y += h + GAP;
  });
  return out;
}

function emplacement(p, cls) {
  const n = el('div', { class: cls + ' ph ton-' + p.ton, role: 'img', 'aria-label': p.alt }, el('span', null, p.label));
  habillePhoto(n, p);
  return n;
}
function majEmplacement(n, p, cls) {
  n.className = cls + ' ph ton-' + p.ton;
  n.setAttribute('aria-label', p.alt);
  n.firstElementChild.textContent = p.label;
  habillePhoto(n, p);
}

/**
 * @param {HTMLElement} hote conteneur 1440x900 (position absolute, inset 0)
 * @param {{seul?: boolean, retard?: number}} opt seul : planche autonome (bouton « Rejouer ») ; retard : décalage en secondes
 */
export function monterAccueil(hote, { seul = true, retard = 0 } = {}) {
  const vie = creerVie(), dejaLa = enteteMontee();
  const D = seul ? 0 : retard;
  let vivant = true, rejoue = false;
  const S = { ph: 'in', lbI: null, lbSt: 'from', lbN: 0, fast: false, navH: null, svc: 0, svcN: 0, svcFade: false, heroI: 0, heroN: 0, heroOut: false, lbLast: null };
  const tm = {}; let navW = null, mctx = null, rj = null;

  // ---------- construction du décor statique ----------
  hote.classList.add('accueil');
  vie.aFaire(() => hote.classList.remove('accueil'));
  const pNav = el('div', { class: 'pastille', 'aria-hidden': 'true', style: 'top:30px;height:48px' });
  const pGal = el('div', { class: 'pastille', 'aria-hidden': 'true', style: 'left:80px;top:488px;width:200px;height:48px' });
  const pSvc = el('div', { class: 'pastille', 'aria-hidden': 'true', style: 'left:64px;top:596px;width:1312px;height:116px' });
  const pp = { nTop: cheminSvg(''), nBot: cheminSvg(''), nLoop: cheminSvg('', { class: 'comete' }),
    sTop: cheminSvg('M64 654 L64 620 A24 24 0 0 1 88 596 L1352 596 A24 24 0 0 1 1376 620 L1376 654'),
    sBot: cheminSvg('M64 654 L64 688 A24 24 0 0 0 88 712 L1352 712 A24 24 0 0 0 1376 688 L1376 654'),
    sLoop: cheminSvg('M64 654 L64 620 A24 24 0 0 1 88 596 L1352 596 A24 24 0 0 1 1376 620 L1376 688 A24 24 0 0 1 1352 712 L88 712 A24 24 0 0 1 64 688 Z', { class: 'comete' }) };
  pp.nLoop.style.stroke = '#3AA6B5'; pp.sLoop.style.stroke = '#D9783A';
  const svgNav = svg('svg', { class: 'pp', 'aria-hidden': 'true' }, pp.nTop, pp.nBot, pp.nLoop);
  const svgPP = svg('svg', { class: 'pp', 'aria-hidden': 'true' }, pp.sTop, pp.sBot, pp.sLoop);
  const mosaique = el('div', { style: 'display:contents' });
  const lb1 = cheminSvg('M80 148 L580 148', { style: 'stroke-width:1px' }), lb2 = cheminSvg('M80 566 L580 566', { style: 'stroke-width:1px' });
  const pillT = cheminSvg('M80 512 Q80 488 104 488 L256 488 Q280 488 280 512'), pillB = cheminSvg('M80 512 Q80 536 104 536 L256 536 Q280 536 280 512');
  const svgLn = svg('svg', { class: 'ln', 'aria-hidden': 'true', style: 'left:0;top:0;width:1440px;height:900px' }, lb1, lb2, pillT, pillB);
  hote.append(pGal, pSvc, svgPP, mosaique, svgLn);

  const a0 = { sep: 'none', logo: { o: '', f: '' }, sig: 'none', n0: { o: '', f: '' }, n1: { o: '', f: '' }, n2: { o: '', f: '' }, n3: { o: '', f: '' }, hFl: 'none', hCta: { o: '', f: '' }, navU: 'none' };
  const ent = monterEntete(hote, { actif: null, a: a0 });
  // pastille de verre du menu + ses traits : sous l'en-tête persistant (retirés en quittant la page)
  ent.sous.append(pNav, svgNav); vie.noeud(pNav); vie.noeud(svgNav);
  ent.ctaA.classList.add('encre-cta');
  vie.aFaire(() => { ent.ctaA.classList.remove('encre-cta'); ent.fl.style.removeProperty('--c0'); ent.fl.style.removeProperty('--c1'); ent.nav.style.width = ''; });
  ent.fl.style.setProperty('--c0', 'inset(0 100% 0 0 round 20px)'); ent.fl.style.setProperty('--c1', 'inset(0 0 0 0 round 20px)');
  const indic = el('span', { 'aria-hidden': 'true' });
  ent.nav.append(indic); vie.noeud(indic);
  const fonduComete = (c) => (actif) => { c.style.transition = 'opacity .2s linear'; c.style.opacity = actif ? '0' : '1'; };
  const surfNav = creerSurligneur(vie, indic, {
    geo: (i) => { const m = mesures(); return { x: m.x[i], w: m.w[i] }; },
    couleur: (i) => COUL[Math.max(i, 0)],
    cy: () => ent.nav.offsetHeight + 6,
    origine: () => ({ x: ent.nav.offsetLeft, y: ent.nav.offsetTop }),
    comete: () => pp.nLoop, onActif: fonduComete(pp.nLoop)
  });
  const navLiens = Array.from(ent.nav.querySelectorAll('a'));
  navLiens.forEach((l, i) => {
    const sur = () => { S.navH = i; render(); }, hors = () => { S.navH = null; render(); };
    vie.ecouter(l, 'mouseenter', sur); vie.ecouter(l, 'focus', sur); vie.ecouter(l, 'mouseleave', hors); vie.ecouter(l, 'blur', hors);
  });

  const tete = el('span', { class: 'tete', 'aria-hidden': 'true', style: 'left:65px;width:10px;height:10px;border-radius:5px' });
  const heroEyeW = el('span', { class: 'w' });
  const heroEyeTrait = el('span', { 'aria-hidden': 'true', style: 'display:block;width:28px;height:1px;background:#D9783A' });
  const heroLignes = el('div', { style: 'display:contents' }), heroParas = el('div', { style: 'display:contents' });
  const hero = el('div', { 'aria-live': 'polite', style: 'position:absolute;left:80px;top:172px;width:520px' },
    el('p', { style: "margin:0;display:flex;align-items:center;gap:14px;font:500 11.5px 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:#4B4D52" }, heroEyeTrait, heroEyeW),
    heroLignes, heroParas);
  const galW = mot('Explorer la galerie'), galA = el('a', { href: 'galerie.html', class: 'btn', style: 'left:80px;top:488px;width:200px;height:48px' }, galW);
  const devW = mot('ou me contacter'), devA = el('a', { href: 'contact.html', class: 'lien', style: 'position:absolute;left:304px;top:502px;font:500 14px Inter,sans-serif;color:#0D0E10;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px' }, devW);
  const tcW = mot('SC. 01 · 00:00:24');
  const tcP = el('p', { style: "position:absolute;left:420px;top:574px;width:160px;margin:0;text-align:right;font:500 11px 'IBM Plex Mono',monospace;letter-spacing:.12em;color:#4B4D52" }, tcW);
  const svW = mot('Mes services');
  const svP = el('p', { style: "position:absolute;left:80px;top:608px;margin:0;font:500 12.5px 'IBM Plex Mono',monospace;letter-spacing:.04em;color:#4B4D52" }, svW);
  const svcNav = el('nav', { 'aria-label': 'Services', style: 'position:absolute;left:80px;right:80px;top:650px;display:flex;flex-wrap:nowrap;justify-content:space-between;column-gap:24px' });
  const footW = mot('Espace client · Instagram'), scrollW = mot('Faire défiler pour découvrir ↓');
  const footP = el('p', { style: "position:absolute;left:80px;top:812px;margin:0;font:500 12.5px 'IBM Plex Mono',monospace;letter-spacing:.02em;color:#4B4D52" }, footW);
  const scrollP = el('p', { style: "position:absolute;right:80px;top:812px;margin:0;font:500 12.5px 'IBM Plex Mono',monospace;letter-spacing:.02em;color:#4B4D52" }, scrollW);
  const hits = el('div', { style: 'display:contents' });
  const lbHote = el('div', { style: 'display:contents' });
  // surligneur des services : hors de la liste (liste() exige un parent dédié), positionné d'après la mesure réelle des liens
  const svcU = el('span', { 'aria-hidden': 'true' });
  const surfSvc = creerSurligneur(vie, svcU, {
    geo: (i) => { const a = svcNav.children[i]; return a && a.offsetWidth ? { x: 80 + a.offsetLeft, w: a.offsetWidth } : null; },
    couleur: () => '#3AA6B5',
    cy: () => { const a = svcNav.children[0]; return (a ? 650 + a.offsetTop + a.offsetHeight - 6 : 0) + 1; },
    origine: () => ({ x: 0, y: 0 }),
    comete: () => pp.sLoop, onActif: fonduComete(pp.sLoop)
  });
  const vag = monterVagabond(vie, hote);
  vie.ecouter(svcNav, 'mouseleave', () => surfSvc.aller(null));
  hote.append(tete, hero, galA, devA, tcP, svP, svcNav, svcU, footP, scrollP, hits, lbHote);
  if (seul) {
    rj = el('button', { type: 'button', class: 'rj', on: { click: () => replay() } }, 'Rejouer');
    hote.append(rj);
  }

  // ---------- mesures (largeur du menu, texte du héros) ----------
  const mesures = () => {
    if (navW) return navW;
    const c = document.createElement('canvas').getContext('2d');
    c.font = '500 14px Inter, sans-serif';
    const w = NAV_TXT.map((t) => Math.ceil(c.measureText(t).width)), x = []; let acc = 0;
    w.forEach((v) => { x.push(acc); acc += v + 36; });
    navW = { w, x, total: acc - 36 };
    return navW;
  };
  const mesure = (txt, font) => { if (!txt) return 0; if (!mctx) mctx = document.createElement('canvas').getContext('2d'); mctx.font = font.replace(/\/[\d.]+/, ''); return mctx.measureText(txt).width; };

  // ---------- actions ----------
  const choisir = (i) => {
    if (S.svc === i && !S.svcFade) return;
    surfSvc.aller(i);
    vie.clearTimeout(tm.svc); S.svcFade = true; render();
    tm.svc = vie.timeout(() => { S.svc = i; S.svcN += 1; S.svcFade = false; S.lbLast = null; render(); }, 300);
  };
  let rendreFocus = null;      // rend le focus à la photo cliquée quand la photo agrandie se ferme
  const ouvrir = (i) => {
    if (S.lbI !== null) return;
    rendreFocus = memoriserFocus();
    vie.clearTimeout(tm.lb); S.lbI = i; S.lbLast = null; S.lbSt = 'from'; S.lbN = 0; S.ph = 'out'; vag.masquer(true); render();
    tm.lb = vie.timeout(() => { S.lbSt = 'to'; render(); }, 40);
  };
  const fermer = () => {
    if (S.lbSt !== 'to') return;
    S.lbLast = S.lbI; S.lbSt = 'closing'; S.ph = 'in'; S.fast = true; render(); vie.clearTimeout(tm.lb);
    tm.lb = vie.timeout(() => { S.lbI = null; S.lbSt = 'from'; vag.masquer(false); render(); if (rendreFocus) rendreFocus(); rendreFocus = null; }, 820);
  };
  const aller = (d, n) => { if (S.lbSt !== 'to') return; S.lbI = (S.lbI + d + n) % n; S.lbN += 1; render(); };
  const replay = () => {
    if (tm.replay) return;
    S.ph = 'out'; S.fast = false; rejoue = true; render();
    tm.replay = vie.timeout(() => { tm.replay = null; S.ph = 'in'; render(); }, 1000);
  };

  // ---------- rendu ----------
  function render() {
    const on = S.ph === 'in', fast = S.fast, K = fast ? .2 : .62;
    const at = (dl) => (D + dl * K).toFixed(2);
    const Sx = (dl, d) => on ? `drawS ${d * K}s ${E} ${at(dl)}s both` : `undrawS .22s ${E} .1s both`;
    const F = (dl, d) => on ? `drawS ${d * K}s ${E} ${at(dl)}s both` : `undrawS .35s ${E} .3s both`;
    const TR = (dl, d) => on ? `trace ${d * K}s ${E} ${at(dl)}s both` : 'none';
    const T = (dl, d) => ({
      o: on ? `wIn ${d * K}s ${E} ${at(dl)}s both` : `wOut .2s ${E} .04s both`,
      f: on ? `wIn ${d * K}s ${E} ${at(dl + .25)}s both` : `wOut .2s ${E} 0s both`
    });
    const P = (dl, nb) => on ? (fast ? `${nb ? 'devFastNB' : 'devFast'} .5s ease ${at(dl)}s both` : `${nb ? 'devNB' : 'dev'} 3.2s ease-in-out ${at(dl)}s both`) : `devOut .25s ${E} 0s both`;
    const Rr = (dl, d) => on ? `rIn ${d * K}s ${E} ${at(dl)}s both` : `rOut .22s ${E} .05s both`;
    const a = {
      sep: F(0, .8), logo: T(.3, .8), sig: on ? `wIn ${.5 * K}s ${E} ${at(1.35)}s both` : `wOut .2s ${E} 0s both`,
      n0: T(.5, .45), n1: T(.6, .45), n2: T(.7, .45), n3: T(.8, .45),
      hFl: Rr(.9, .6), hCta: T(1.3, .45),
      eyeL: on ? `wIn ${.4 * K}s ${E} ${at(.6)}s both` : `wOut .2s ${E} 0s both`,
      lb1: Sx(.45, 1.1), lb2: Sx(1.75, 1.1), tc: T(2.3, .5),
      pill: Sx(1.95, .65), gal: T(2.3, .45), dev: T(2.4, .5), sv: T(1.8, .5),
      foot: T(2.6, .5), scroll: T(2.7, .7)
    };

    // -- collage selon le service --
    const dx = scene.dx;   // gain de largeur de la fenêtre (0 à 1440 x 900)
    const cur = SERVICES[S.svc].set.map((k) => PHOTOS[k]);
    const sn = S.svcN, alt2 = sn % 2 === 1, rects = rectsMosaique(cur.map((p) => p.r), dx);
    const mos = cur.map((p, i) => {
      const r = rects[i], nb = i % 2 === 1; let anim, tr;
      if (sn === 0) { anim = P(.6 + i * .15, nb); tr = TR(.4 + i * .15, 1.6); }
      else if (!on) { anim = P(.6, nb); tr = 'none'; }
      else if (S.svcFade) { anim = `devOut .26s ease-out ${(i * .03).toFixed(2)}s forwards`; tr = 'none'; }
      else {
        const dl = (.1 + i * .12).toFixed(2);
        anim = `${nb ? (alt2 ? 'devNB2' : 'devNB') : (alt2 ? 'dev2' : 'dev')} 2.8s ease-in-out ${dl}s both`;
        tr = `${alt2 ? 'trace2' : 'trace'} 2.6s ${E} ${dl}s both`;
      }
      // la photo qu'on vient de refermer rejoint sa place sans animation par-dessus : durée et délai à zéro, elle prend directement son état final
      if (S.lbLast === i && on && !S.svcFade) {
        const direct = (a) => a.replace(/^(\S+)\s+[\d.]+s\s+(\S+)\s+[\d.]+s/, '$1 0s $2 0s');
        anim = direct(anim); tr = direct(tr);
      }
      let t0 = null;
      if (on && sn === 0) t0 = D + (.6 + i * .15) * K + 3.4; else if (on && !S.svcFade) t0 = .1 + i * .12 + 3.0;
      const com = t0 === null ? 'eteint .01s linear 0s both' : `apparait 1.8s ease-in-out ${t0.toFixed(2)}s both, ${CDIR[i % 5]} ${CDUR[i % 5]}s linear ${t0.toFixed(2)}s infinite`;
      return { p, ...r, anim, tr, com, cc: COMC[i % 4], d: cadrePhoto(r.w, r.h) };
    });
    liste(mosaique, mos, (m, i) => i, (m) => {
      const cad = svg('svg', { class: 'cad', 'aria-hidden': 'true' }, cheminSvg(''), cheminSvg('', { class: 'comete' }));
      return el('div', { style: 'display:contents' }, emplacement(m.p, ''), cad);
    }, (n, m) => {
      const ph = n.children[0], cad = n.children[1];
      majEmplacement(ph, m.p, '');
      Object.assign(ph.style, { left: m.x + 'px', top: m.y + 'px', width: m.w + 'px', height: m.h + 'px' });
      animer(ph, m.anim);
      Object.assign(cad.style, { left: (m.x - 1) + 'px', top: (m.y - 1) + 'px', width: (m.w + 2) + 'px', height: (m.h + 2) + 'px' });
      const [p1, p2] = cad.children;
      p1.setAttribute('d', m.d); p2.setAttribute('d', m.d); p2.style.stroke = m.cc;
      animer(p1, m.tr); animer(p2, m.com);
    });
    const PH = cur.map((p, i) => ({ p, ...rects[i], cap: SERVICES[S.svc].t + ' · ' + CAPS[i % CAPS.length] }));
    liste(hits, PH, (h, i) => i, (h, i) => el('button', { type: 'button', class: 'phbtn', on: { click: () => ouvrir(i) } }),
      (b, h) => { b.setAttribute('aria-label', 'Agrandir : ' + h.p.alt); Object.assign(b.style, { left: h.x + 'px', top: h.y + 'px', width: h.w + 'px', height: h.h + 'px' }); });

    // -- surligneur du menu : rien au repos, comète -> boule -> ligne au survol --
    const m = mesures();
    ent.nav.style.width = m.total + 'px';
    surfNav.aller(S.navH); surfNav.peindre();

    // -- vie continue (après l'apparition) --
    const CB = fast ? 1.2 : 4.6, go = (D + CB).toFixed(2);
    const live = (base, extra) => on ? `${base}, ${extra}` : base;
    const com = (name, dur, dl) => on ? `apparait 1.8s ease-in-out ${(D + CB + dl).toFixed(2)}s both, ${name} ${dur}s linear ${(D + CB + dl).toFixed(2)}s infinite` : 'eteint .01s linear 0s both';
    const viv = {
      sep: live(a.sep, `rebatit 15s ${E} ${go}s infinite`),
      lb1: live(a.lb1, `rebatit 19s ${E} ${(D + 7.1).toFixed(2)}s infinite`),
      lb2: live(a.lb2, `rebatit 21s ${E} ${(D + 10.3).toFixed(2)}s infinite`),
      sig: live(a.sig, `souffle 6.5s ease-in-out ${go}s infinite`)
    };
    // En-tête persistant : arrivé d'une autre page, il ne rejoue pas son entrée (seule sa vie continue).
    const FG = { o: 'wIn 0s both', f: 'wIn 0s both' }, fige = dejaLa && !rejoue;
    majEntete(ent, fige
      ? { ...a, sep: live('drawS 0s both', `rebatit 15s ${E} ${go}s infinite`), sig: live('wIn 0s both', `souffle 6.5s ease-in-out ${go}s infinite`), logo: FG, n0: FG, n1: FG, n2: FG, n3: FG, hFl: 'rIn 0s both', hCta: FG, navU: 'none' }
      : { ...a, sep: viv.sep, sig: viv.sig, navU: 'none' });
    animer(lb1, viv.lb1); animer(lb2, viv.lb2); animer(pillT, a.pill); animer(pillB, a.pill);

    // -- pastilles et traits du menu / des services --
    const nx = 600 - 26 + dx / 2, nw = m.total + 52, ny = 30, r = 24, x2 = nx + nw;
    Object.assign(pNav.style, { left: nx + 'px', width: nw + 'px' });
    const fillN = on ? `habille ${fast ? .6 : 1.8}s ease-in-out ${at(1.0)}s both` : 'deshabille .25s ease 0s both';
    animer(pNav, fillN);
    // barre des services : pastille et traits étirés sur toute la largeur utile
    pSvc.style.width = (1312 + dx) + 'px';
    const xs = 1352 + dx, xe = 1376 + dx;
    pp.sTop.setAttribute('d', `M64 654 L64 620 A24 24 0 0 1 88 596 L${xs} 596 A24 24 0 0 1 ${xe} 620 L${xe} 654`);
    pp.sBot.setAttribute('d', `M64 654 L64 688 A24 24 0 0 0 88 712 L${xs} 712 A24 24 0 0 0 ${xe} 688 L${xe} 654`);
    pp.sLoop.setAttribute('d', `M64 654 L64 620 A24 24 0 0 1 88 596 L${xs} 596 A24 24 0 0 1 ${xe} 620 L${xe} 688 A24 24 0 0 1 ${xs} 712 L88 712 A24 24 0 0 1 64 688 Z`);
    animer(pSvc, on ? `habille ${fast ? .6 : 1.8}s ease-in-out ${at(2.5)}s both` : 'deshabille .25s ease 0s both');
    animer(pGal, on ? `habille ${fast ? .6 : 1.6}s ease-in-out ${at(2.6)}s both` : 'deshabille .25s ease 0s both');
    pp.nTop.setAttribute('d', `M${nx} ${ny + r} A${r} ${r} 0 0 1 ${nx + r} ${ny} L${x2 - r} ${ny} A${r} ${r} 0 0 1 ${x2} ${ny + r}`);
    pp.nBot.setAttribute('d', `M${nx} ${ny + r} A${r} ${r} 0 0 0 ${nx + r} ${ny + 2 * r} L${x2 - r} ${ny + 2 * r} A${r} ${r} 0 0 0 ${x2} ${ny + r}`);
    pp.nLoop.setAttribute('d', `M${nx} ${ny + r} A${r} ${r} 0 0 1 ${nx + r} ${ny} L${x2 - r} ${ny} A${r} ${r} 0 0 1 ${x2 - r} ${ny + 2 * r} L${nx + r} ${ny + 2 * r} A${r} ${r} 0 0 1 ${nx} ${ny + r} Z`);
    const nLine = Sx(.3, .7), sLine = Sx(1.6, .9);
    animer(pp.nTop, nLine); animer(pp.nBot, nLine); animer(pp.nLoop, com('comete', 9, .2));
    animer(pp.sTop, sLine); animer(pp.sBot, sLine); animer(pp.sLoop, com('cometeR', 22, .8));

    // -- accroche tournante (goutte d'encre) --
    const hs = HERO[S.heroI], first = S.heroN === 0, hout = S.heroOut;
    const HT = (dl, d, k) => {
      if (!on) return { o: `wOut .2s ${E} .04s both`, f: `wOut .2s ${E} 0s both` };
      if (hout) return { o: `wOut .3s ${E} ${(k * .04).toFixed(2)}s both`, f: `wOut .26s ${E} ${(k * .04).toFixed(2)}s both` };
      if (first) return T(dl, d);
      const t0 = (dl - .75) * .9 + .05;
      return { o: `wIn ${(d * .9).toFixed(2)}s ${E} ${t0.toFixed(2)}s both`, f: `wIn ${(d * .9).toFixed(2)}s ${E} ${(t0 + .18).toFixed(2)}s both` };
    };
    const Wt = Math.round(Math.max(...hs.lines.map((ln, i) => hs.ind[i] + mesure(ln[0], hs.font) + mesure(ln[1], hs.em))) + 4);
    const Ht = Math.round(hs.lh * hs.lines.length), DW = fast ? .7 : 1.7, DR = fast ? .45 : .9, w0 = first ? D + .9 * K : .1;
    const dot = !on || hout ? `resorbe ${DR}s ${E} 0s both` : `${S.heroN % 2 ? 'ecrit2' : 'ecrit'} ${DW}s ${E} ${w0.toFixed(2)}s both`;
    const lineAnim = () => {
      if (!on || hout) return { o: `wOut ${(DR * .73).toFixed(2)}s ${E} ${(DR * .12).toFixed(2)}s both`, f: `wOut ${(DR * .7).toFixed(2)}s ${E} ${(DR * .1).toFixed(2)}s both` };
      const st = w0 + DW * .15, du = DW * .7;
      return { o: `wIn ${du.toFixed(2)}s ${E} ${st.toFixed(2)}s both`, f: `wIn ${du.toFixed(2)}s ${E} ${(st + .16).toFixed(2)}s both` };
    };
    const dotTop = Math.round(207 + hs.lh / 2 - 5);
    tete.style.setProperty('--W', Wt + 'px'); tete.style.setProperty('--H', Ht + 'px'); tete.style.setProperty('--dt', dotTop + 'px');
    tete.style.top = dotTop + 'px'; animer(tete, dot);
    setMot(heroEyeW, hs.eye, HT(.75, .6, 0)); animer(heroEyeTrait, a.eyeL);
    liste(heroLignes, hs.lines, (l, i) => i, () => el('p', { style: 'color:#0D0E10;filter:drop-shadow(0 7px 10px rgba(20,18,16,.22)) drop-shadow(0 2px 2px rgba(20,18,16,.14))' }, el('span', { class: 'w' })),
      (p, ln, i) => {
        Object.assign(p.style, { margin: `${i === 0 ? '18px' : '0'} 0 0 ${hs.ind[i]}px`, font: hs.font, letterSpacing: hs.ls });
        const w = p.firstElementChild, cle = ln[0] + '|' + (ln[1] || '') + '|' + hs.em;
        if (w._cle !== cle) {
          ecrire(w, () => FRAGMENT(document.createTextNode(ln[0]), el('i', { style: `font:${hs.em};letter-spacing:-.01em` }, ln[1] || '')));
          w._cle = cle;
        }
        animer(w, lineAnim());
      });
    liste(heroParas, hs.para, (l, i) => i, () => el('p', { style: 'font:400 15px/1.7 Inter,sans-serif;color:#4B4D52' }, el('span', { class: 'w' })),
      (p, t, i) => {
        p.style.margin = `${i === 0 ? '22px' : '0'} 0 0`;
        setMot(p.firstElementChild, t, on && !hout
          ? { o: `wIn .5s ${E} ${(w0 + DW * .8 + i * .15).toFixed(2)}s both`, f: `wIn .5s ${E} ${(w0 + DW * .8 + i * .15 + .16).toFixed(2)}s both` }
          : HT(0, .5, i));
      });

    animer(galW, a.gal); animer(devW, a.dev); animer(tcW, a.tc); animer(svW, a.sv); animer(footW, a.foot); animer(scrollW, a.scroll);

    // -- ligne des services --
    liste(svcNav, SERVICES, (x, i) => i, (x, i) => {
      const k = el('span', { class: 'k w' }), l = el('span', { class: 'l w' });
      ecrire(k, '0' + (i + 1)); ecrire(l, x.t);
      const lien = el('a', { href: 'services.html', class: 'svc' }, k, l);
      lien.addEventListener('mouseenter', () => choisir(i)); lien.addEventListener('focus', () => choisir(i));
      return lien;
    }, (lien, x, i) => {
      lien.className = i === S.svc ? 'svc on' : 'svc';
      animer(lien.children[0], T(2.2 + i * .1, .4)); animer(lien.children[1], T(2.3 + i * .1, .45));
    });

    surfSvc.peindre();

    renderLb(PH, dx);
  }


  // ---------- photo agrandie (module commun à toutes les pages) ----------
  const pa = creerPhotoAgrandie({ hote: lbHote, vie, fermer, aller: (d, n) => aller(d, n), classeFond: 'lb-fond' });
  function renderLb(PH, dx) {
    if (S.lbI === null || S.lbI === undefined) { pa.vider(); return; }
    const h = PH[S.lbI];
    pa.rendre({ p: h.p, cap: h.cap, i: S.lbI, total: PH.length, st: S.lbSt, rect: { x: h.x, y: h.y, w: h.w, h: h.h }, n: S.lbN, dx });
  }

  // ---------- cycles (menu, accroche) ----------
  tm.hero = vie.timeout(() => {
    tm.iHero = vie.interval(() => {
      if (S.lbI !== null || S.ph !== 'in') return;
      S.heroOut = true; render();
      tm.hero2 = vie.timeout(() => { S.heroI = (S.heroI + 1) % 5; S.heroN += 1; S.heroOut = false; render(); }, 1000);
    }, 8000);
  }, (D + 4) * 1000);
  vag.demarrer((D + 4.6) * 1000);
  vie.ecouter(window, 'scene:resize', () => render());
  vie.ecouter(document, 'keydown', (e) => { if (S.lbI !== null) pa.touche(e); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (vivant) { navW = null; render(); } });

  render();
  return {
    detruire(vider = true) {
      vivant = false; vie.nettoyer();
      if (vider) hote.replaceChildren();
    }
  };
}

// ---- page autonome (routeur) : accueil.html, planche PAccueil avec « Rejouer » ---------------------------------
let page = null;
export function init(racine) { page = monterAccueil(racine, { seul: true }); }
export function destroy() { if (page) { const p = page; page = null; p.detruire(false); } }
