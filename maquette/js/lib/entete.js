// En-tête du site public / espace client : logo + trait cyan, menu, « Mes dossiers », bouton noir.
// Traduit le bloc commun des planches P*.dc.html.
// L'en-tête est PERSISTANT (routeur AJAX) : monté au premier appel, puis seulement mis à jour
// (entrée active, texte du bouton, présence de « Mes dossiers ») aux appels suivants ; la table
// d'animations `a` n'est appliquée qu'au premier appel (pas de rejeu à chaque page).
// Une page qui anime l'en-tête (photo agrandie…) appelle majEntete(refs, a) ; le routeur le fige
// ensuite avec figerEntete() quand on quitte la page.
import { el, svg, mot, animer, majMot } from './dom.js';

const MENU = [
  ['galerie', 'Galerie', 'galerie.html', 'n0'], ['services', 'Services', 'services.html', 'n1'],
  ['apropos', 'À propos', 'apropos.html', 'n2'], ['contact', 'Contact', 'contact.html', 'n3']
];

let refs = null;

/**
 * @param {Element} _parent  ignoré (compatibilité) : l'en-tête s'insère toujours dans #fond, avant #contenu
 * @param {{actif?: string|null, cta?: string, a: object, avecDossiers?: boolean}} opt
 *   actif : 'galerie' | 'services' | 'apropos' | 'contact' | 'dossiers' | null ;
 *   cta : 'Créer mon devis' (défaut) ou 'Simuler un devis' ; avecDossiers : affiche « Mes dossiers » (espace client).
 */
export function monterEntete(_parent, { actif = null, cta = 'Créer mon devis', a, avecDossiers = false }) {
  const parent = document.getElementById('fond') || _parent;   // hôte persistant (#fond), quel que soit le parent passé
  if (refs && refs.parent.isConnected) { mettreAJour(actif, cta, avecDossiers); return refs; }

  const soulignement = () => el('span', { 'aria-hidden': 'true', class: 'nav-u', hidden: true, style: 'position:absolute;left:0;right:0;bottom:-7px;height:2px;border-radius:1px;background:#3AA6B5' });
  const sous = el('div', { id: 'sous-entete', style: 'position:absolute;left:0;top:0;width:var(--W);height:900px;pointer-events:none' });
  const traits = svg('svg', { class: 'ln', 'aria-hidden': 'true', style: 'left:0;top:0;width:var(--W);height:900px' },
    svg('path', { pathLength: '100', d: 'M720 100 L80 100' }), svg('path', { pathLength: '100', d: 'M720 100 L1360 100' }));
  const logo = mot('Ernest H.');
  const logoA = el('a', { href: 'accueil.html', class: 'lien', style: 'position:absolute;left:80px;top:38px;font:600 22px Inter,sans-serif;letter-spacing:-.01em' }, logo);
  const sig = el('span', { 'aria-hidden': 'true', style: 'position:absolute;left:80px;top:70px;width:28px;height:2px;border-radius:1px;background:#3AA6B5' });
  const mots = {}, soul = {}, liens = {};
  const items = MENU.map(([k, t, href, n]) => {
    const w = mot(t); mots[n] = w;
    const u = soulignement(); soul[k] = u;
    const l = el('a', { href, style: 'position:relative' }, w, u); liens[k] = l;
    return l;
  });
  const nav = el('nav', { class: 'nav', 'aria-label': 'Menu principal', style: 'position:absolute;left:calc(600px + var(--dx) / 2);top:46px;display:flex;gap:36px;font:500 14px Inter,sans-serif' }, ...items);
  const w4 = mot('Mes dossiers'); mots.n4 = w4;
  const u4 = soulignement(); soul.dossiers = u4;
  const dossiers = el('a', { href: 'mes-dossiers.html', class: 'lien', hidden: true, style: 'position:absolute;left:calc(1052px + var(--dx));top:46px;font:500 14px Inter,sans-serif' }, w4, u4);
  const fl = el('span', { class: 'encre', 'aria-hidden': 'true', style: 'position:absolute;left:calc(1184px + var(--dx));top:34px;width:176px;height:40px;border-radius:20px' });
  const ctaMot = mot(cta);
  const ctaA = el('a', { href: 'simulateur.html', class: 'btn', style: 'left:calc(1184px + var(--dx));top:34px;width:176px;height:40px' }, ctaMot);

  const contenu = parent.querySelector(':scope > #contenu');
  const noeuds = [sous, traits, logoA, sig, nav, dossiers, fl, ctaA];
  noeuds.forEach((n) => (contenu ? parent.insertBefore(n, contenu) : parent.append(n)));

  const filets = () => { const W = window.__scene ? window.__scene.W : 1440; traits.querySelectorAll('path')[0].setAttribute('d', `M${W / 2} 100 L80 100`); traits.querySelectorAll('path')[1].setAttribute('d', `M${W / 2} 100 L${W - 80} 100`); };
  filets(); window.addEventListener('scene:resize', filets);
  refs = { parent, sous, traits: traits.querySelectorAll('path'), logo, sig, mots, soul, liens, fl, ctaMot, ctaA, nav, dossiers, ctaTexte: cta };
  mettreAJour(actif, cta, avecDossiers);
  majEntete(refs, a);
  return refs;
}

function mettreAJour(actif, cta, avecDossiers) {
  const r = refs;
  for (const k of Object.keys(r.soul)) {
    const on = k === actif, u = r.soul[k];
    if (u.hidden === on) u.hidden = !on;
  }
  for (const k of Object.keys(r.liens)) {
    if (k === actif) r.liens[k].setAttribute('aria-current', 'page'); else r.liens[k].removeAttribute('aria-current');
  }
  if (actif === 'dossiers') r.dossiers.setAttribute('aria-current', 'page'); else r.dossiers.removeAttribute('aria-current');
  r.dossiers.hidden = !avecDossiers;
  if (r.ctaTexte !== cta) { majMot(r.ctaMot, cta); r.ctaTexte = cta; }
}

/** Applique (ou remplace) la table d'animations de l'en-tête. */
export function majEntete(r, a) {
  r.traits.forEach((p) => animer(p, a.sep));
  animer(r.logo, a.logo); animer(r.sig, a.sig);
  for (const k of Object.keys(r.mots)) animer(r.mots[k], a[k]);
  Object.values(r.soul).forEach((u) => animer(u, a.navU));
  animer(r.fl, a.hFl); animer(r.ctaMot, a.hCta);
}

/** État final immédiat (durée 0) : utilisé par le routeur pour ne pas rejouer l'entrée de l'en-tête. */
export function figerEntete() {
  if (!refs) return;
  const F = { o: 'wIn 0s both', f: 'wIn 0s both' };
  majEntete(refs, { sep: 'drawS 0s both', logo: F, sig: 'wIn 0s both', n0: F, n1: F, n2: F, n3: F, n4: F, navU: 'wIn 0s both', hFl: 'habille 0s both', hCta: F });
}

export function enteteMontee() { return !!(refs && refs.parent.isConnected); }

/** Table d'animations standard de l'en-tête pour un rythme R = rythme(K). */
export function animationsEntete(R) {
  const { T, H, DR, E, K } = R;
  return {
    sep: DR(0, .8), logo: T(.3, .8), sig: `wIn ${.5 * K}s ${E} ${1.35 * K}s both`,
    n0: T(.5, .45), n1: T(.6, .45), n2: T(.7, .45), n3: T(.8, .45), n4: T(.9, .45),
    navU: `wIn ${.5 * K}s ${E} ${1.2 * K}s both`, hFl: `habille 1s ease ${.9 * K}s both`, hCta: T(1.3, .45)
  };
}

/** Retire l'en-tête (intro rejouée : l'accueil est démonté puis remonté avec une entrée complète). */
export function demonterEntete() {
  if (!refs) return;
  [refs.sous, refs.traits[0].ownerSVGElement, refs.logo.closest('a'), refs.sig, refs.nav, refs.dossiers, refs.fl, refs.ctaA].forEach((n) => n && n.remove());
  refs = null;
}
