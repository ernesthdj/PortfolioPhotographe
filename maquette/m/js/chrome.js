// Éléments qui restent en place d'un écran à l'autre : bannière du haut et dock du bas
// (navigation principale, bouton devis, sous-navigation propre à certains écrans), plus la notification courte.
import { el, svg } from '../../js/lib/dom.js';
import { creerVie } from '../../js/lib/vie.js';
import { ecrit } from './lib/ecriture.js';
import { inclinaison } from './lib/inclinaison.js';

const icone = (...formes) => svg('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, ...formes.map(([t, a]) => svg(t, a)));

const ONGLETS = [
  ['accueil', 'Accueil', () => icone(['path', { d: 'M4 11l8-7 8 7v9H4z' }], ['path', { d: 'M10 20v-6h4v6' }])],
  ['galerie', 'Galerie', () => icone(['rect', { x: 3.5, y: 3.5, width: 7, height: 9 }], ['rect', { x: 13.5, y: 3.5, width: 7, height: 5 }], ['rect', { x: 13.5, y: 11.5, width: 7, height: 9 }], ['rect', { x: 3.5, y: 15.5, width: 7, height: 5 }])],
  ['services', 'Services', () => icone(['path', { d: 'M4 6h16M4 12h16M4 18h10' }])],
  ['contact', 'Contact', () => icone(['rect', { x: 3.5, y: 5.5, width: 17, height: 13 }], ['path', { d: 'M4 7l8 6 8-6' }])]
];
const LARGEUR_CHIP = 104;

export function creerChrome(ctx) {
  const vie = creerVie();

  // ---- bannière du haut : « Ernest H. » + lien discret vers À propos ----
  const banniere = el('header', { class: 'banniere' },
    el('div', { class: 'bg', 'aria-hidden': 'true' }),
    el('a', { class: 'logo', href: '#/accueil', 'aria-label': 'Ernest H., accueil' }, ecrit('Ernest H.', { d: 0.25, u: 0.55 })),
    el('span', { class: 'sig', 'aria-hidden': 'true' }),
    el('a', { class: 'ap mono', href: '#/apropos', 'aria-label': 'À propos du photographe' }, ecrit('Photographe', { d: 0.5, u: 0.6 })));

  // ---- dock du bas ----
  const liens = ONGLETS.map(([cle, libelle, ico], i) => {
    const i0 = ico();
    i0.style.setProperty('--d', 0.7 + i * 0.1 + 's');
    return el('a', { class: 'nv', href: '#/' + cle }, i0, ecrit(libelle, { d: 0.8 + i * 0.1, u: 0.45 }));
  });
  const glowOnglet = el('span', { class: 'glow-onglet', 'aria-hidden': 'true' });
  const cta = el('a', { class: 'cta', href: '#/simulateur' });
  cta.style.setProperty('--d', '1.75s');
  const ctaBoite = el('div', { class: 'btnw nv-cta' }, cta);
  let ctaLibelle = '';
  const principal = el('div', { class: 'principal' }, glowOnglet, ...liens, ctaBoite);

  const glowChip = el('span', { class: 'glow-chip', 'aria-hidden': 'true' });
  const rail = el('div', { class: 'sous-rail' }, glowChip);
  const sous = el('div', { class: 'sous', role: 'tablist', 'aria-label': 'Sous-navigation' }, rail);
  const sousFilet = el('span', { class: 'sous-filet', 'aria-hidden': 'true' });

  const trait = (classe) => svg('rect', { class: classe, x: 0, y: 0, width: '100%', height: 66, rx: 33, ry: 33, pathLength: 100 });
  const incl = el('div', { class: 'incl' },
    el('div', { class: 'verre dock-verre' }),
    svg('svg', { class: 'dock-trait', 'aria-hidden': 'true' }, trait('trace'), trait('comete')),
    el('div', { class: 'bord' }), el('div', { class: 'spec', 'aria-hidden': 'true' }),
    sous, sousFilet, principal);
  const dock = el('nav', { class: 'dock', 'aria-label': 'Menu principal' }, incl);

  const toast = el('div', { class: 'toast verre mono', role: 'status', 'aria-live': 'polite' });
  ctx.racineChrome.append(banniere, dock, toast);
  inclinaison(dock, vie);

  // ---- sous-navigation : la bande défile en douceur pour centrer la puce choisie ----
  let cleSous = '', puces = [], rafSlide = 0;
  const reduit = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const glisser = (puce) => {
    if (!puce) return;
    const max = Math.max(0, sous.scrollWidth - sous.clientWidth);
    const cible = Math.max(0, Math.min(max, puce.offsetLeft + puce.offsetWidth / 2 - sous.clientWidth / 2));
    const depart = sous.scrollLeft, dist = cible - depart;
    cancelAnimationFrame(rafSlide);
    if (Math.abs(dist) < 1) return;
    if (reduit()) { sous.scrollLeft = cible; return; }
    const t0 = performance.now(), D = 600;
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const pas = (now) => { const k = Math.min(1, (now - t0) / D); sous.scrollLeft = depart + dist * ease(k); if (k < 1) rafSlide = requestAnimationFrame(pas); };
    rafSlide = requestAnimationFrame(pas);
  };
  vie.aFaire(() => cancelAnimationFrame(rafSlide));

  function majSous(def) {
    if (!def) return;                                   // la bande se referme (clip) sans changer de contenu
    if (cleSous !== def.cle) {
      cleSous = def.cle;
      puces.forEach((p) => p.remove());
      puces = def.liste.map(([k, libelle]) => el('button', { type: 'button', class: 'chip', role: 'tab', on: { click: () => def.choisir(k) } }, libelle));
      rail.style.width = def.liste.length * LARGEUR_CHIP + 'px';
      rail.append(...puces);
    }
    const idx = Math.max(0, def.liste.findIndex(([k]) => k === def.courant));
    puces.forEach((p, i) => p.setAttribute('aria-selected', String(i === idx)));
    glowChip.style.left = idx * LARGEUR_CHIP + 6 + 'px';
    glisser(puces[idx]);
  }

  function majOnglet() {
    const idx = ONGLETS.findIndex(([k]) => k === ctx.etat.ecran);
    liens.forEach((a, i) => (i === idx ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    glowOnglet.style.opacity = idx < 0 ? '0' : '1';
    if (idx >= 0) { glowOnglet.style.left = liens[idx].offsetLeft + 'px'; glowOnglet.style.width = liens[idx].offsetWidth + 'px'; }
  }

  vie.ecouter(window, 'resize', majOnglet);

  return {
    /** Appelée à chaque changement d'écran ou d'état (connexion, sous-navigation). */
    maj() {
      const ec = ctx.ecranCourant();
      const def = ec && ec.sousNav ? ec.sousNav() : null;
      majOnglet();
      dock.classList.toggle('avec-sous', !!def);
      majSous(def);
      const libelle = ctx.etat.connecte ? 'Mon dossier' : 'Mon devis';
      cta.setAttribute('href', ctx.etat.connecte ? '#/mes-dossiers' : '#/simulateur');
      if (libelle !== ctaLibelle) { ctaLibelle = libelle; cta.replaceChildren(ecrit(libelle, { d: 1.75 + 0.35, u: 0.45 })); }
      const cache = !!(ec && ec.masqueChrome && ec.masqueChrome());
      dock.classList.toggle('cache', cache);
      banniere.classList.toggle('cache', cache);
    },
    /** Premier affichage : la bannière et le dock se dessinent. */
    montrer() {
      [banniere, dock].forEach((n) => { n.style.setProperty('--b', '0s'); n.classList.add('rv'); });
    },
    toast(message) {
      toast.textContent = message;
      toast.classList.add('on');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.remove('on'), 2200);
    }
  };
}
