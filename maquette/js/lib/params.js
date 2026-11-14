// Paramètres d'URL : options de planche du canvas (etat, panneau, ombre, tva, comparaison…).
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Renvoie la valeur autorisée correspondant au paramètre (insensible aux accents et à la casse), sinon `defaut`. */
export function param(nom, valides, defaut) {
  const v = new URLSearchParams(window.location.search).get(nom);
  if (v == null) return defaut;
  const trouve = valides.find((x) => norm(x) === norm(v));
  return trouve === undefined ? defaut : trouve;
}

const OMBRES = ['Alternance', 'Diagonale', 'Studio · latérale', 'Studio · spot', 'Studio · cyclo', 'Studio · strip', 'Sans'];
export const ombreParam = () => param('ombre', OMBRES, 'Alternance');
