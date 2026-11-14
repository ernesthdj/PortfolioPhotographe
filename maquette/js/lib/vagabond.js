// Trait vagabond d'arrière-plan (port du canvas DA Morphic, PAccueil / Dashboard).
// Un seul trait, angles droits uniquement (axe X ou Y) : il part d'un point, se dessine en ligne droite,
// se résorbe vers son extrémité jusqu'à n'être plus qu'un point, puis ce point glisse (ou disparaît et réapparaît)
// ailleurs sur le fond ; le cycle reprend avec une autre couleur, le plus souvent sur l'autre axe. Tout est aléatoire.
// Discret : opacité 0,4, derrière les photos et le texte.
//
//   const vag = monterVagabond(vie, hote);  // insère le calque en premier enfant de hote
//   vag.demarrer(4600);                     // lance le trait après ce délai (ms)
//   vag.masquer(true | false);              // fondu (zoom photo)
import { svg } from './dom.js';

const COULEURS = ['#3AA6B5', '#D9783A', '#7A1F33'];
const OPACITE = 0.4;
const E = 'cubic-bezier(.45,0,.2,1)';
const alea = (a, b) => a + Math.random() * (b - a);
const borne = (v, a, b) => Math.min(b, Math.max(a, v));

export function monterVagabond(vie, hote) {
  const trait = svg('path', { pathLength: '100', d: 'M0 0 L0 0' });
  const calque = svg('svg', { class: 'wd', 'aria-hidden': 'true' }, trait);
  hote.prepend(calque);
  let actif = false, couleur = null, axe = Math.random() < 0.5 ? 'x' : 'y', pos = null, tPas = null;
  vie.noeud(calque);
  vie.aFaire(() => { actif = false; trait.getAnimations().forEach((a) => a.cancel()); });

  const largeur = () => (window.__scene ? window.__scene.W : 1440);
  const hasard = () => ({ x: alea(70, largeur() - 70), y: alea(60, 840) });
  const plus = (ms, fn) => { tPas = vie.timeout(() => { if (actif) fn(); }, ms); };

  function cycle() {
    do { couleur = COULEURS[Math.floor(Math.random() * COULEURS.length)]; } while (couleur === trait._c);
    trait._c = couleur;
    const len = alea(180, 480);
    let sens = Math.random() < 0.5 ? -1 : 1, x1 = pos.x, y1 = pos.y;
    const fin = (s) => (axe === 'x' ? borne(pos.x + s * len, 50, largeur() - 50) : borne(pos.y + s * len, 50, 850));
    let v = fin(sens);
    if (Math.abs(v - (axe === 'x' ? pos.x : pos.y)) < 120) { sens = -sens; v = fin(sens); }
    if (axe === 'x') x1 = v; else y1 = v;
    trait.getAnimations().forEach((a) => a.cancel());
    trait.style.transform = 'none';
    trait.style.stroke = couleur;
    trait.setAttribute('d', `M${pos.x.toFixed(1)} ${pos.y.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`);
    const dessin = trait.animate([{ strokeDasharray: '0 101', strokeOpacity: OPACITE }, { strokeDasharray: '100 1', strokeOpacity: OPACITE }],
      { duration: alea(1100, 1900), easing: E, fill: 'forwards' });
    dessin.finished.then(() => {
      if (!actif) return;
      plus(alea(150, 500), () => {
        const resorbe = trait.animate([
          { strokeDasharray: '100 101', strokeDashoffset: 0, strokeOpacity: OPACITE },
          { strokeDasharray: '100 101', strokeDashoffset: -99.8, strokeOpacity: OPACITE }
        ], { duration: alea(1000, 1600), easing: E, fill: 'forwards' });
        resorbe.finished.then(() => {
          if (!actif) return;
          const bout = { x: x1, y: y1 }, suite = hasard();
          axe = Math.random() < 0.7 ? (axe === 'x' ? 'y' : 'x') : axe;
          plus(alea(200, 600), () => {
            if (Math.random() < 0.55) {
              const dist = Math.hypot(suite.x - bout.x, suite.y - bout.y);
              const glisse = trait.animate([{ transform: 'translate(0px, 0px)' },
                { transform: `translate(${(suite.x - bout.x).toFixed(1)}px, ${(suite.y - bout.y).toFixed(1)}px)` }],
              { duration: 600 + dist * 0.55, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
              glisse.finished.then(() => { pos = suite; plus(alea(100, 400), cycle); }).catch(() => {});
            } else {
              const efface = trait.animate([{ strokeOpacity: OPACITE }, { strokeOpacity: 0 }], { duration: 320, fill: 'forwards' });
              efface.finished.then(() => { pos = suite; plus(alea(500, 1300), cycle); }).catch(() => {});
            }
          });
        }).catch(() => {});
      });
    }).catch(() => {});
  }

  return {
    demarrer(ms) {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      vie.timeout(() => { if (actif) return; actif = true; pos = hasard(); cycle(); }, ms);
    },
    masquer(oui) { calque.style.opacity = oui ? '0' : '1'; }
  };
}
