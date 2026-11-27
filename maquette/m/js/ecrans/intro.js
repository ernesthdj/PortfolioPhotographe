// Intro (6,9 s) : un collage défile, les cadres se tracent (cyan → orange → bordeaux), les photos se développent,
// puis la goutte d'encre revient avaler le texte. Débouche sur l'accueil ; « Passer l'intro » la résorbe en 0,5 s.
import { el, svg } from '../../../js/lib/dom.js';
import { creerVie } from '../../../js/lib/vie.js';

export const titreDoc = 'Ernest H. · Photographe';
export const dureeSortie = 0;              // l'intro se résorbe elle-même : pas d'attente supplémentaire

import { PHOTOS as THEQUE } from '../photos.js';
import { choixCms } from '../../../data/photos-site.js';
const E = 'cubic-bezier(.45,0,.2,1)';
const FIN = 5.2;                            // instant où tout se résorbe (s)
// emplacements dans un plan de 390 × 1120 ; c = la photo finit en couleur
const PHOTOS = [
  { id: 'bouquet', x: 30, y: 150, w: 180, h: 270, ton: 4, dl: 0.95, tr: 0.5, c: false, alt: 'Les mariés enlacés, bouquet au premier plan' },
  { id: 'baiser', x: 222, y: 190, w: 138, h: 207, ton: 5, dl: 1.35, tr: 0.9, c: true, alt: 'Baiser sur la joue' },
  { id: 'champ', x: 70, y: 450, w: 300, h: 129, ton: 6, dl: 2.15, tr: 1.7, c: false, alt: 'Couple enlacé dans un champ' },
  { id: 'grand-champ', x: 30, y: 600, w: 330, h: 141, ton: 3, dl: 2.85, tr: 2.4, c: false, alt: 'Couple debout dans un grand champ' },
  { id: 'chateau', x: 150, y: 770, w: 210, h: 315, ton: 1, dl: 3.55, tr: 3.1, c: true, alt: 'Les mariés devant le château' }
];
const TONS = {
  1: 'linear-gradient(150deg,#d9a98a,#8f5a4a)', 3: 'linear-gradient(150deg,#d8c6a0,#8c7448)', 4: 'linear-gradient(150deg,#aab4cf,#55608a)',
  5: 'linear-gradient(150deg,#c9a7b5,#7d4a63)', 6: 'linear-gradient(150deg,#b8c79c,#68784a)'
};

export function creer(ctx) {
  const vie = creerVie();
  const racine = el('section', { class: 'ecran intro', 'aria-label': 'Introduction', 'aria-hidden': 'true' });
  const reduit = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  let observateur = null;

  const ajuster = () => {
    const k = Math.min(racine.clientWidth / 390, racine.clientHeight / 844) || 1;
    racine.style.setProperty('--k', k.toFixed(4));
  };

  // mot « écrit » de l'intro : contour, remplissage, goutte d'encre qui revient à la fin
  const mot = (texte, dl, d, k) => {
    const tete = el('span', { class: 'mi-tete', 'aria-hidden': 'true' }), o = el('span', { class: 'o' }, texte), f = el('span', { class: 'f', 'aria-hidden': 'true' }, texte);
    tete.style.animation = `mi-resorbe .5s ${E} ${(FIN + 0.1 + k * 0.1).toFixed(2)}s both, mi-melt .3s ${E} ${(FIN + 0.6 + k * 0.1).toFixed(2)}s forwards`;
    o.style.animation = `mi-wIn ${d}s ${E} ${dl}s both, mi-wOut .5s ${E} ${(FIN + 0.1 + k * 0.1).toFixed(2)}s forwards`;
    f.style.animation = `mi-wIn ${d}s ${E} ${dl + 0.16}s both, mi-wOut .5s ${E} ${(FIN + 0.06 + k * 0.1).toFixed(2)}s forwards`;
    return el('span', { class: 'mi-w' }, tete, o, f);
  };

  function construire() {
    const couche = el('div', { class: 'intro-couche' });
    const vg = el('div', { class: 'mi-vg', 'aria-hidden': 'true' });
    vg.style.animation = `mi-habille 1.2s ease-in-out 0s both, mi-deshabille .9s ease-in-out ${(FIN + 0.3).toFixed(2)}s forwards`;

    const plan = el('div', { class: 'mi-plan' });
    plan.style.animation = 'mi-pan 6.4s linear 0s both';
    const lignes = svg('svg', { class: 'mi-lines', 'aria-hidden': 'true' });
    const choix = choixCms('intro');   // photos choisies dans le CMS (sinon les photos de test)
    PHOTOS.forEach((p, i) => {
      const cms = choix[i] !== undefined ? THEQUE[choix[i]] : null;
      const im = el('div', { class: 'mi-img', role: 'img', 'aria-label': cms ? cms.alt : p.alt });
      Object.assign(im.style, { left: p.x + 'px', top: p.y + 'px', width: p.w + 'px', height: p.h + 'px' });
      im.style.setProperty('background', 'url("' + (cms || THEQUE.find((q) => q.id === p.id)).src + '") center/cover no-repeat, ' + TONS[p.ton]);
      im.style.animation = `mi-rIn .8s ${E} ${p.dl}s both, ${p.c ? 'mi-dev' : 'mi-devNB'} 2.6s ease-in-out ${p.dl}s both, mi-fOut .8s ease-in-out ${(FIN + 0.4 + i * 0.1).toFixed(2)}s forwards`;
      plan.append(im);
      const tr = svg('path', { pathLength: 100, d: `M${p.x - 1} ${p.y - 1} L${p.x + p.w + 1} ${p.y - 1} L${p.x + p.w + 1} ${p.y + p.h + 1} L${p.x - 1} ${p.y + p.h + 1} Z` });
      tr.style.animation = `mi-trace 1.5s ${E} ${p.tr}s both, mi-teinte 1.5s linear ${p.tr}s both`;
      lignes.append(tr);
    });
    const point = el('span', { class: 'mi-pt', 'aria-hidden': 'true' });
    point.style.left = '24px'; point.style.top = '144px';
    point.style.animation = `mi-born .45s ${E} 0s both, mi-melt .3s ${E} .45s forwards`;
    plan.append(lignes, point);

    const texte = el('div', { class: 'mi-texte' },
      el('div', null, mot('Un regard,', 1.2, 0.6, 0)), el('div', null, mot('un instant,', 2.6, 0.6, 1)), el('div', null, mot('une histoire.', 4.0, 0.7, 2)));
    const signe = el('div', { class: 'mi-signe' }, mot('Ernest H. · Photographe', 4.5, 0.7, 3));
    const passer = el('button', { type: 'button', class: 'mi-passer', on: { click: passerIntro } }, 'Passer l’intro');

    couche.append(vg, el('div', { class: 'mi-mask' }, plan), texte, signe);
    racine.replaceChildren(el('div', { class: 'intro-scene' }, couche), passer);
    return couche;
  }

  let couche = null, passe = false;
  function passerIntro() {
    if (passe) return;
    passe = true;
    vie.clearTimeout(vie._fin);
    couche.style.animation = 'mi-deshabille .5s ease-in-out 0s both';
    vie.timeout(fin, 560);
  }
  const fin = () => ctx.aller('accueil');

  return {
    racine, dureeSortie: 0,
    masqueChrome: () => true,
    activer() {
      racine.classList.add('actif'); racine.removeAttribute('aria-hidden');
      if (reduit()) { fin(); return; }                     // mouvement réduit : pas d'intro
      passe = false;
      couche = construire();
      ajuster();
      observateur = new ResizeObserver(ajuster); observateur.observe(racine);
      vie._fin = vie.timeout(fin, 6900);
    },
    desactiver() {
      vie.nettoyer();
      if (observateur) { observateur.disconnect(); observateur = null; }
      racine.classList.remove('actif'); racine.setAttribute('aria-hidden', 'true');
      racine.replaceChildren();
    },
    sortie() {},
    focus() {}
  };
}
