// Logique commune aux pages Catégories, Fiches techniques, Fiche et Modèles de production de l'atelier
// (E17, E18, E19, E29). Reprend les parties correspondantes du script « catalogue » des planches Erp*.dc.html.
import { el, svg, texte, voir } from '../lib/dom.js';
import { SRV, OPT } from '../../data/catalogue.js';
import { DOSSIERS } from '../../data/dossiers.js';

/** Nombre saisi (virgule ou point) : null si vide, NaN si invalide. */
export const n2 = (v) => {
  const s = String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.');
  if (s === '') return null;
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
};

/** Déplace l'élément de clé k de d crans (-1 : monter, +1 : descendre). Renvoie un nouveau tableau. */
export function deplacer(arr, k, d) {
  const a = arr.slice(), i = a.findIndex((x) => (x.k || x) === k), j = i + d;
  if (i < 0 || j < 0 || j >= a.length) return a;
  const t = a[i]; a[i] = a[j]; a[j] = t;
  return a;
}

// ---------------------------------------------------------------- données dérivées du catalogue
/** « 2 services actifs · 2 options » calculé depuis SRV / OPT (les archivés ne comptent pas). */
export function resumeCategorie(nom) {
  const sv = SRV.filter((s) => s.cats.includes(nom)), actifs = sv.filter((s) => !s.arch);
  const op = OPT.filter((o) => o.cats.includes(nom) && !o.arch);
  const p = [];
  p.push(actifs.length ? actifs.length + ' service' + (actifs.length > 1 ? 's' : '') + (sv.length > actifs.length ? (actifs.length > 1 ? ' actifs' : ' actif') : '') : 'aucun service pour l’instant');
  if (op.length) p.push(op.length + ' option' + (op.length > 1 ? 's' : ''));
  return p.join(' · ');
}
/** Noms des services actifs reliés à un type de fiche (« Fiche mariage »). */
export const servicesDuType = (nomType) => SRV.filter((s) => !s.arch && s.fiche === nomType).map((s) => s.t);
/** Dossiers qui utilisent un type de fiche : leur prestation est un des services reliés à ce type. */
export function dossiersDuType(nomType) {
  const ids = SRV.filter((s) => s.fiche === nomType).map((s) => s.k);
  return DOSSIERS.filter((d) => ids.includes(d.cfg.sid)).length;
}

// ---------------------------------------------------------------- éléments d'interface communs
/** Message de retour (point + texte) qui flotte à une position fixe, dans la racine de la page. `montrer(texte, erreur)` / `cacher()`. */
export function monterToast(parent, { left, top, width, droite = false }) {
  const trait = el('span', { 'aria-hidden': 'true', style: 'display:block;flex:none;width:20px;height:1px;margin-top:9px;background:#D9783A' });
  const t = el('span');
  const p = el('p', { hidden: true, role: 'status', style: `position:absolute;left:${typeof left === 'number' ? left + 'px' : left};top:${top}px;width:${typeof width === 'number' ? width + 'px' : width};margin:0;display:flex;align-items:flex-start;justify-content:${droite ? 'flex-end' : 'flex-start'};gap:10px;font:400 13.5px/1.45 Inter,sans-serif;text-align:${droite ? 'right' : 'left'};animation:habille .5s ease both` }, trait, t);
  parent.append(p);
  return {
    montrer(txt, erreur = false) {
      texte(t, txt); trait.style.background = erreur ? '#7A1F33' : '#D9783A';
      p.setAttribute('role', erreur ? 'alert' : 'status'); voir(p, true);
    },
    cacher() { voir(p, false); }
  };
}

/** Zone d'erreur « .err » : un point bordeaux + le message, ou vide. */
export function majErr(p, msg) {
  if (!msg) { p.replaceChildren(); return; }
  p.replaceChildren(el('i', { 'aria-hidden': 'true' }), document.createTextNode(msg));
}
export const invalide = (champ, oui) => champ.setAttribute('aria-invalid', oui ? 'true' : 'false');

/** Bouton d'enregistrement : encre + bouton, grisé « Enregistrement… » pendant l'attente. */
export function etatEnregistrer(encre, bouton, occupe, libelle, libelleOccupe) {
  bouton.className = occupe ? 'btn off' : 'btn';
  bouton.setAttribute('aria-disabled', occupe ? 'true' : 'false');
  encre.style.opacity = occupe ? '0' : '1';
  texte(bouton, occupe ? libelleOccupe : libelle);
}

const ICONES = {
  haut: 'M7 11 L12 6 L17 11 M12 6 L12 18',
  bas: 'M7 13 L12 18 L17 13 M12 18 L12 6',
  retirer: 'M7 7 L17 17 M17 7 L7 17'
};
/** Petit bouton rond à icône (monter, descendre, retirer). */
export function boutonIcone(type, label, left, top, onClick) {
  return el('button', { type: 'button', class: 'ico', 'aria-label': label, 'aria-disabled': 'false', style: `left:${typeof left === 'number' ? left + 'px' : left};top:${top}px`, on: { click: onClick } },
    svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, svg('path', { d: ICONES[type] })));
}
export const desactiver = (b, oui) => b.setAttribute('aria-disabled', oui ? 'true' : 'false');

/** Case à cocher « .case » (rôle checkbox) avec sa coche. */
export function caseACocher(libelle, { left, top, taille, relatif = false, onClick }) {
  const style = relatif ? 'position:relative' : `left:${typeof left === 'number' ? left + 'px' : left};top:${top}px${taille ? ';font-size:' + taille + 'px' : ''}`;
  const b = el('button', { type: 'button', class: 'case', role: 'checkbox', 'aria-checked': 'false', style, on: { click: onClick } },
    el('span', { class: 'bx', 'aria-hidden': 'true' }, svg('svg', { viewBox: '0 0 12 12' }, svg('path', { d: 'M2 6.5 L5 9 L10 3' }))), libelle);
  return b;
}
export const cocher = (b, oui) => b.setAttribute('aria-checked', oui ? 'true' : 'false');

