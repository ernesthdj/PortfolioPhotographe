// Utilitaires DOM sans moteur de gabarit. Tout texte passe par textContent / createTextNode.
const SVGNS = 'http://www.w3.org/2000/svg';

export const $ = (s, r = document) => r.querySelector(s);

function poser(n, attrs) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
    else n.setAttribute(k, v === true ? '' : String(v));
  }
}
function ajouter(n, enfants) {
  for (const c of enfants.flat()) {
    if (c == null || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}
export function el(tag, attrs, ...enfants) { const n = document.createElement(tag); poser(n, attrs); return ajouter(n, enfants); }
export function svg(tag, attrs, ...enfants) { const n = document.createElementNS(SVGNS, tag); poser(n, attrs); return ajouter(n, enfants); }

/** Met à jour un texte seulement s'il change. */
export function texte(n, s) { const v = String(s); if (n.textContent !== v) n.textContent = v; return n; }

/** Pose une animation CSS (chaîne) ; ne la relance que si la valeur change. */
export function animer(n, valeur) {
  if (!n) return n;
  const v = valeur == null ? '' : valeur;
  if (typeof v === 'object') {          // {o, f} : texte qui s'écrit
    const o = n.querySelector(':scope > .o'), f = n.querySelector(':scope > .f');
    if (o && (o._anim !== v.o || (v.o && !o.style.animation))) { o._anim = v.o; o.style.animation = v.o; }
    if (f && (f._anim !== v.f || (v.f && !f.style.animation))) { f._anim = v.f; f.style.animation = v.f; }
  } else if (n._anim !== v || (v && !n.style.animation)) { n._anim = v; n.style.animation = v; }
  return n;
}

/**
 * Texte « écrit » : <span class="w"><span class="o">…</span><span class="f" aria-hidden>…</span></span>
 * contenu : chaîne, ou fonction qui renvoie un nœud neuf à chaque appel (ex. mot en italique).
 */
export function mot(contenu, anim) {
  const w = el('span', { class: 'w' });
  ecrire(w, contenu);
  if (anim) animer(w, anim);
  return w;
}
export function ecrire(w, contenu) {
  const faire = () => (typeof contenu === 'function' ? contenu() : document.createTextNode(String(contenu)));
  const o = el('span', { class: 'o' }), f = el('span', { class: 'f', 'aria-hidden': 'true' });
  o.append(faire()); f.append(faire());
  w.replaceChildren(o, f);
  return w;
}
/** Change le texte d'un mot déjà écrit (chaîne simple) sans relancer son animation. */
export function majMot(w, s) {
  const v = String(s);
  w.querySelectorAll(':scope > .o, :scope > .f').forEach((n) => { if (n.textContent !== v) n.textContent = v; });
}

export function vider(n) { n.replaceChildren(); return n; }

/**
 * Liste à clés : crée les nœuds neufs, met à jour les existants (sans relancer leurs animations),
 * retire les absents et garde l'ordre. Le parent doit être dédié à la liste.
 * Pour plusieurs nœuds frères par entrée, `creer` renvoie un <div style="display:contents">.
 */
export function liste(parent, items, cle, creer, maj) {
  const reg = parent._reg || (parent._reg = new Map());
  const vus = new Set();
  items.forEach((it, i) => {
    const k = cle(it, i); vus.add(k);
    let n = reg.get(k);
    if (!n) { n = creer(it, i); reg.set(k, n); }
    if (maj) maj(n, it, i);
    if (parent.children[i] !== n) parent.insertBefore(n, parent.children[i] || null);
  });
  for (const [k, n] of reg) if (!vus.has(k)) { n.remove(); reg.delete(k); }
}

/** Montre / cache (équivalent d'un sc-if) : le retour de `hidden` relance les animations de l'élément. */
export function voir(n, oui) { if (n) n.hidden = !oui; return n; }

/** Chemin SVG « tracé » : pathLength 100, pour les animations de trait (stroke-dashoffset). */
export const cheminSvg = (d, extra) => svg('path', { pathLength: '100', d, ...(extra || {}) });

/** Tracé du cadre d'une photo de largeur w et de hauteur h (marge de 1 px pour le trait). */
export const cadrePhoto = (w, h) => `M1 1 L${w + 1} 1 L${w + 1} ${h + 1} L1 ${h + 1} Z`;

/** Met à jour un mot « écrit » (ecrire) seulement si son texte change, puis pose son animation. `fabrique(texte)` : contenu riche. */
export function setMot(w, texte, anim, fabrique) {
  const cle = texte + '|' + (fabrique ? 'f' : '');
  if (w._cle !== cle) { ecrire(w, fabrique ? () => fabrique(texte) : texte); w._cle = cle; }
  animer(w, anim);
}
