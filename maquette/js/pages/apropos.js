// Site · À propos (retenue A : portrait et récit). Traduit PApropos.dc.html.
import { rythme, E } from '../lib/anim.js';
import { monterEntete, animationsEntete } from '../lib/entete.js';
import { $, el, svg, mot, ecrire, animer, liste } from '../lib/dom.js';
import { creerVie } from '../lib/vie.js';
import { mesures } from '../lib/scene.js';

let vie = null;

export function init() {
  vie = creerVie();
  const R = rythme(.62), { K, T } = R;
  monterEntete($('#fond'), { actif: 'apropos', a: animationsEntete(R) });

  const a = {
    ph: `habille 1.8s ease-in-out ${2.0 * K}s both`, phT: T(2.6, .7), phL: `trace 2.6s ${E} ${(1.2 * K).toFixed(2)}s both`,
    phC: 'apparait 1.8s ease-in-out 5.6s both, comete 20s linear 5.6s infinite', cap: T(2.9, .7),
    eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .6), h1: T(.9, .9), h2: T(1.15, 1.1),
    kitL: `wIn ${.4 * K}s ${E} ${4.0 * K}s both`, kit: T(4.1, .9),
    cFl: `habille 1.2s ease ${4.2 * K}s both`, cta: T(4.5, .45), dev: T(4.7, .5)
  };

  // ---- textes fixes
  ecrire($('#portrait-t'), '[Portrait d’Ernest]');
  ecrire($('#cap'), 'Ernest H. · photographe & développeur · [Lieu]');
  ecrire($('#eye'), 'À propos');
  ecrire($('#h1'), 'Un regard');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 52px/1 'Instrument Serif',serif" }, 'qui ne dérange pas.'));
  ecrire($('#kit'), 'Sony A7 IV · 24-70 mm GM · Lightroom Classic · et un éditeur de code');
  ecrire($('#cta'), 'Me contacter');
  ecrire($('#dev'), 'ou simuler un devis');
  animer($('#portrait'), a.ph); animer($('#portrait-t'), a.phT); animer($('#ph-l'), a.phL); animer($('#ph-c'), a.phC); animer($('#cap'), a.cap);
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#kit-trait'), a.kitL); animer($('#kit'), a.kit);
  animer($('#c-fl'), a.cFl); animer($('#cta'), a.cta); animer($('#dev'), a.dev);

  // ---- récit : 5 lignes ; les deux dernières, plus discrètes, parlent du développement du site
  const RECIT = [
    ['Photographe autodidacte basé en Belgique, je raconte vos journées', 0],
    ['comme elles se vivent : sans mise en scène, au plus près des gens,', 0],
    ['avec la lumière qui est là.', 0],
    ['Le reste du temps, je suis développeur : ce site, son simulateur de devis', 1],
    ['et chaque trait qui s’y dessine sont sortis de mon clavier.', 2]
  ].map((r, i) => ({ t: r[0], mt: r[1] === 1 ? '14px' : '0', c: r[1] ? '#4B4D52' : '#0D0E10', a: T(1.5 + i * .16, .9) }));
  liste($('#recit'), RECIT, (l) => l.t, (l) => el('p', { style: `margin:${l.mt} 0 0;font:400 15px/1.75 Inter,sans-serif;color:${l.c}` }, mot(l.t, l.a)));

  // ---- trois piliers sur filets tracés
  const PIL = [
    ['Lumière naturelle', ['Je travaille avec la lumière du lieu,', 'sans l’écraser au flash.']],
    ['L’instant vrai', ['Je me fais oublier pour saisir', 'ce qui se passe vraiment.']],
    ['Retouche discrète', ['Des couleurs fidèles,', 'une peau qui reste une peau.']]
  ].map((p, i) => {
    const x = 580 + i * 240, d0 = 2.6 + i * .2;
    return { i, x, k: String(i + 1).padStart(2, '0'), t: p[0], d: `M${x} 470 L${x + 220} 470`, l: `drawS ${.8 * K}s ${E} ${(d0 * K).toFixed(2)}s both`,
      ak: T(d0 + .1, .3), at: T(d0 + .2, .6), lignes: p[1].map((t, j) => ({ t, mt: j ? '2px' : '8px', a: T(d0 + .4 + j * .12, .7) })) };
  });
  const traits = PIL.map((p) => $('#piliers-traits').appendChild(animer(svg('path', { pathLength: '100', d: p.d, style: 'stroke-width:1px' }), p.l)));
  // Répartition selon la largeur : portrait et bloc de texte gagnent la moitié du gain central (g2), les trois piliers
  // se répartissent sur toute la largeur restante (pas --p), les traits suivent.
  const contenu = $('#contenu');
  const geometrie = () => {
    const dx = mesures.dx, gx = mesures.gx, g2 = gx / 2, p = 240 + (dx - g2) / 2;
    contenu.style.setProperty('--g2', g2 + 'px'); contenu.style.setProperty('--p', p + 'px');
    traits.forEach((tr, i) => { const x = 580 + g2 + i * p; tr.setAttribute('d', `M${x} 470 L${x + 220} 470`); });
    ['#ph-l', '#ph-c'].forEach((s) => $(s).setAttribute('d', `M1 1 L${421 + g2} 1 L${421 + g2} 621 L1 621 Z`));
  };
  geometrie();
  vie.ecouter(window, 'scene:resize', geometrie);
  liste($('#piliers'), PIL, (p) => p.k, (p) => el('div', { class: 'pil', style: `left:calc(580px + var(--g2) + ${p.i} * var(--p))` },
    el('span', { class: 'k' }, mot(p.k, p.ak)),
    el('span', { class: 't' }, mot(p.t, p.at)),
    ...p.lignes.map((d) => el('span', { class: 'd', style: `margin-top:${d.mt}` }, mot(d.t, d.a)))));

}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
