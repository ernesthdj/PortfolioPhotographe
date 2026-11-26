// Briques d'écriture communes aux écrans mobiles. Tout texte passe par textContent / createTextNode.
import { el, svg } from '../../../js/lib/dom.js';

/** Marque un bloc comme « à révéler » quand il entre dans la fenêtre (voir revelateur.js). */
export const rv = (n) => { n.setAttribute('data-rv', ''); return n; };

/**
 * Texte « écrit » : contour puis remplissage. contenu : chaîne ou fonction qui renvoie un nœud neuf.
 * d = délai (s), u = durée (s), bloc = paragraphe qui peut passer à la ligne, tete = goutte d'encre (titres).
 */
export function ecrit(contenu, { d = 0, u = 0.6, bloc = false, tete = false, classe = '' } = {}) {
  const w = el('span', { class: ['w', bloc && 'bloc', classe].filter(Boolean).join(' ') });
  w.style.setProperty('--d', d + 's');
  w.style.setProperty('--u', u + 's');
  const faire = () => (typeof contenu === 'function' ? contenu() : document.createTextNode(String(contenu)));
  if (tete) w.append(el('span', { class: 'tete', 'aria-hidden': 'true' }));
  w.append(el('span', { class: 'o' }, faire()), el('span', { class: 'f', 'aria-hidden': 'true' }, faire()));
  return w;
}

/** Ligne d'ouverture : filet orange + mention en capitales. */
export function eyebrow(texte, d = 0.15) {
  return rv(el('div', { class: 'eyebrow' }, el('span', { class: 'regle', 'aria-hidden': 'true' }), el('span', { class: 'mono' }, ecrit(texte, { d, u: 0.6 }))));
}

/** Titre h1 sur deux lignes : la seconde en italique serif. */
export function titre(l1, l2) {
  const ligne = (contenu, d) => rv(el('span', { class: 'ligne' }, ecrit(contenu, { d, u: 0.8, tete: true })));
  return el('h1', { class: 'titre' }, ligne(l1, 0.1), l2 ? ligne(() => el('span', { class: 'ser' }, l2), 0.45) : null);
}

/** Paragraphe : une ou plusieurs phrases, chacune s'écrit à son tour. */
export function texte(phrases, { d = 0.1, classe = 'texte', pas = 0.2 } = {}) {
  const liste = Array.isArray(phrases) ? phrases : [phrases];
  return rv(el('div', { class: classe }, ...liste.map((t, i) => el('div', null, ecrit(t, { d: d + i * pas, u: 0.7, bloc: true })))));
}

/** Filet horizontal qui se dessine. */
export function filet(d = 0.1, u = 0.9) {
  const f = el('span', { class: 'filet', 'aria-hidden': 'true' });
  f.style.setProperty('--d', d + 's');
  f.style.setProperty('--u', u + 's');
  return f;
}

/** Bouton noir plein largeur. `onClick` ou `href` (lien interne). */
export function bouton(libelle, { onClick, href, d = 0.1, hauteur = 52, type = 'button' } = {}) {
  const b = href ? el('a', { class: 'cta', href }) : el('button', { type, class: 'cta' });
  if (onClick) b.addEventListener('click', onClick);
  b.style.setProperty('--d', d + 's');
  b.append(ecrit(libelle, { d: d + 0.35, u: 0.5 }));
  const w = el('div', { class: 'btnw' }, b);
  w.style.height = hauteur + 'px';
  return w;
}

/** Lien-bouton avec petite flèche tracée et lueur cyan. */
export function lienFleche(libelle, { onClick, href, d = 0.5, aria } = {}) {
  const b = href ? el('a', { class: 'plus', href }) : el('button', { type: 'button', class: 'plus' });
  if (aria) b.setAttribute('aria-label', aria);
  if (onClick) b.addEventListener('click', onClick);
  const glow = el('span', { class: 'glow', 'aria-hidden': 'true' });
  glow.style.setProperty('--d', d + 0.2 + 's');
  const fleche = svg('svg', { class: 'fleche', width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': 'true' }, svg('path', { pathLength: 100, d: 'M5 12h14M13 6l6 6-6 6' }));
  fleche.style.setProperty('--d', d + 0.3 + 's');
  b.append(el('span', { style: { position: 'relative', display: 'inline-block' } }, glow, ecrit(libelle, { d, u: 0.5 })), fleche);
  return b;
}

/** Contour arrondi qui se dessine autour d'une carte (le parent doit être position: relative). */
export function contour(rayon = 24, d = 0.1) {
  const s = svg('svg', { class: 'contour', 'aria-hidden': 'true' }, svg('rect', { x: 0, y: 0, width: '100%', height: '100%', rx: rayon, ry: rayon, pathLength: 100 }));
  s.style.setProperty('--d', d + 's');
  return s;
}

/** Photo (emplacement dégradé tant qu'il n'y a pas de vrais clichés) : cadre tracé, développement noir et blanc -> couleur. */
export function photo({ ton = 1, nb = false, libelle, alt, d = 0.2, src }) {
  const img = el('div', { class: 'img' + (src ? ' reel' : '') }, el('span', null, libelle));
  if (src) img.style.setProperty('--img', 'url("' + src + '")');
  const p = el('div', { class: `photo ton-${ton}${nb ? ' nb' : ''}`, role: 'img', 'aria-label': alt || libelle }, img,
    svg('svg', { class: 'cadre', 'aria-hidden': 'true' }, svg('rect', { x: 0, y: 0, width: '100%', height: '100%', pathLength: 100 })));
  p.style.setProperty('--d', d + 's');
  return p;
}
