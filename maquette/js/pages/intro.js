// Intro : collage cinématique (≈ 6,5 s) qui débouche sur l'accueil. Traduit PIntro.dc.html.
import { E } from '../lib/anim.js';
import { monterScene } from '../lib/scene.js';
import { el, svg, mot, animer } from '../lib/dom.js';
import { PHOTOS, habillePhoto } from '../../data/photos-site.js';
import { monterAccueil } from './accueil.js';
import { demonterEntete } from '../lib/entete.js';

monterScene();

const END = 5.5;
// Photos du collage : position, couleur (true = prend la couleur) ou reste en noir et blanc, cadre tracé autour.
const COLLAGE = [
  { p: 2, x: 300, y: 170, w: 240, h: 360, dl: .45, tr: 0, nb: true },
  { p: 1, x: 580, y: 140, w: 420, h: 180, dl: 1.35, tr: .9, nb: false },
  { p: 3, x: 580, y: 350, w: 200, h: 300, dl: 2.15, tr: 1.7, nb: true },
  { p: 4, x: 820, y: 470, w: 400, h: 172, dl: 2.85, tr: 2.4, nb: true },
  { p: 0, x: 1040, y: 110, w: 220, h: 330, dl: 3.55, tr: 3.1, nb: false }
];
const MOTS = [['Un regard,', 1.2, .6], ['un instant,', 2.6, .6], ['une histoire.', 4.0, .7]];

const hote = document.getElementById('intro'), accueilHote = document.getElementById('accueil'), btnRejouer = document.getElementById('rejouer');
const S = { ph: 'in', fin: false };
let tFin, tIn, accueil = null;

// ---- décor de l'intro (construit une fois) ----
const plan = el('div', { class: 'plan', style: 'left:calc(var(--dx) / 2)' });
const phs = COLLAGE.map((c) => {
  const p = PHOTOS[c.p];
  const n = el('div', { class: 'ph ton-' + p.ton, role: 'img', 'aria-label': p.alt, style: { left: c.x + 'px', top: c.y + 'px', width: c.w + 'px', height: c.h + 'px', '--c0': 'inset(0 100% 0 0)', '--c1': 'inset(0 0 0 0)' } }, el('span', null, p.label));
  habillePhoto(n, p);
  return n;
});
const traits = COLLAGE.map((c) => svg('path', { pathLength: '100', d: `M${c.x - 1} ${c.y - 1} L${c.x + c.w + 1} ${c.y - 1} L${c.x + c.w + 1} ${c.y + c.h + 1} L${c.x - 1} ${c.y + c.h + 1} Z` }));
const lnSvg = svg('svg', { class: 'intro-ln', 'aria-hidden': 'true', style: 'stroke:#0D0E10' }, ...traits);
const pt = el('span', { class: 'pt', 'aria-hidden': 'true', style: 'left:294px;top:164px' });
plan.append(...phs, lnSvg, pt);
const mots = MOTS.map(([t]) => mot(t));
const pTexte = el('p', { style: 'position:absolute;left:calc(300px + var(--dx) / 2);top:728px;margin:0;font:500 20px Inter,sans-serif;letter-spacing:-.01em' }, mots[0], ' ', mots[1], ' ', mots[2]);
const tcMot = mot('Ernest H. · Photographe');
const pTc = el('p', { style: "position:absolute;left:calc(300px + var(--dx) / 2);top:766px;margin:0;font:500 12.5px 'IBM Plex Mono',monospace;letter-spacing:.04em;color:#4B4D52" }, tcMot);
const passer = el('button', { type: 'button', class: 'ctl', style: 'right:24px;top:24px', on: { click: () => { clearTimeout(tFin); S.fin = true; render(); } } }, 'Passer l’intro');
hote.append(plan, pTexte, pTc, passer);

function planifier() { clearTimeout(tFin); tFin = setTimeout(() => { S.fin = true; render(); }, 6400); }

function render() {
  const on = S.ph === 'in';
  const Tm = (dl, d) => ({
    o: on ? `wIn ${d}s ${E} ${dl}s both, wOut .25s ${E} ${END + .1}s forwards` : 'none',
    f: on ? `wIn ${d}s ${E} ${dl + .16}s both, wOut .25s ${E} ${END + .06}s forwards` : 'none'
  });
  const TR = (dl) => on ? `trace 1.5s ${E} ${dl}s both, teinte 1.5s linear ${dl}s both` : 'none';
  const PH = (dl, i, c) => on ? `rIn .8s ${E} ${dl}s both, ${c ? 'dev' : 'devNB'} 2.6s ease-in-out ${dl}s both, rOut .4s ${E} ${END + i * .08}s forwards` : 'none';
  animer(plan, on ? 'pan 6.4s linear 0s both' : 'none');
  animer(pt, on ? `melt .3s ${E} 0s both` : 'none');
  COLLAGE.forEach((c, i) => {
    animer(traits[i], TR(c.tr));
    animer(phs[i], PH(c.dl, i, !c.nb));
  });
  MOTS.forEach(([, dl, d], i) => animer(mots[i], Tm(dl, d)));
  animer(tcMot, Tm(4.5, .7));
  hote.hidden = S.fin;
  accueilHote.hidden = !S.fin;
  if (S.fin && !accueil) accueil = monterAccueil(accueilHote, { seul: false, retard: 0 });
  if (!S.fin && accueil) { accueil.detruire(); demonterEntete(); accueil = null; }
}

btnRejouer.addEventListener('click', () => {
  clearTimeout(tIn);
  S.ph = 'out'; S.fin = false; render();
  tIn = setTimeout(() => { S.ph = 'in'; render(); planifier(); }, 60);
});

render();
planifier();

// Parcours : depuis l'intro (pas de routeur ici), un lien interne fait d'abord s'effacer toute la page vers le blanc
// (développement photo à l'envers, 0,32 s), puis charge la page suivante, qui se dessine en morphing.
let sortie = false;
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#')) return;
  const u = new URL(a.href, window.location.href);
  if (u.origin !== window.location.origin) return;
  e.preventDefault();
  if (sortie) return;
  sortie = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { window.location.assign(u.href); return; }
  document.getElementById('scene').animate(
    [{ opacity: 1, filter: 'none' }, { opacity: 1, filter: 'grayscale(1) contrast(1.05)', offset: .4 }, { opacity: 0, filter: 'grayscale(1) brightness(1.6)' }],
    { duration: 320, easing: 'ease-in', fill: 'forwards' });
  setTimeout(() => window.location.assign(u.href), 340);
});
// retour arrière du navigateur (page restaurée depuis le cache) : la page ne doit pas rester effacée
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  sortie = false;
  document.getElementById('scene').getAnimations().forEach((an) => an.cancel());
});
