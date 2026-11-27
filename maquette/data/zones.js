// REGISTRE DES EMPLACEMENTS PHOTO : source unique de ce qui peut recevoir des photos sur le site (cartographie : docs/modules/CMS-emplacements.md).
// Lu par le serveur (validation du manifeste, api/_lib/manifest.ts), par l'administration (js/admin/placement.js) et, plus tard, par les pages.
// Pas de DOM, pas de réseau : ce fichier peut être importé partout. Ajouter un emplacement = ajouter une ligne ici.

/** Services proposés (indice = numéro de service dans tout le site). */
export const SERVICES = ['Mariages', 'Engagement', 'Famille lifestyle', 'Anniversaires', 'Événementiel', 'Culinaire & studio'];

/**
 * @typedef {object} Zone
 * @property {string} cle            identifiant dans le manifeste (« intro », « accueil:2 »…)
 * @property {string} groupe         regroupement affiché dans l'administration
 * @property {string} libelle        nom lisible
 * @property {number} max            nombre maximum de photos
 * @property {'adaptatif'|'cadres'} mode  adaptatif = la mise en page s'ajuste au nombre de photos ; cadres = cadres de forme fixe
 * @property {boolean} formatLibre   le « format du cadre » (portrait, paysage…) a un effet ici (faux quand l'animation impose la forme)
 */

/** @type {Zone[]} */
export const ZONES = [
  { cle: 'intro', groupe: 'Intro', libelle: 'Intro', max: 5, mode: 'cadres', formatLibre: false },
  ...SERVICES.map((s, i) => ({ cle: 'accueil:' + i, groupe: 'Accueil', libelle: 'Accueil · ' + s, max: 6, mode: /** @type {const} */ ('adaptatif'), formatLibre: true })),
  ...SERVICES.map((s, i) => ({ cle: 'service:' + i, groupe: 'Services', libelle: 'Services · ' + s, max: 1, mode: /** @type {const} */ ('cadres'), formatLibre: true })),
  { cle: 'apropos:portrait', groupe: 'À propos', libelle: 'À propos · Portrait', max: 1, mode: 'cadres', formatLibre: true },
  { cle: 'contact:mariage', groupe: 'Contact', libelle: 'Contact · Mariage', max: 1, mode: 'cadres', formatLibre: true },
  { cle: 'contact:portrait', groupe: 'Contact', libelle: 'Contact · Portrait', max: 1, mode: 'cadres', formatLibre: true },
];

export const CLES = ZONES.map((z) => z.cle);

/** @param {string} cle */
export const zone = (cle) => ZONES.find((z) => z.cle === cle);
/** Nombre maximum de photos d'un emplacement (0 si l'emplacement n'existe pas). @param {string} cle */
export const limite = (cle) => zone(cle)?.max ?? 0;
/** @param {string} cle */
export const nomZone = (cle) => zone(cle)?.libelle ?? cle;

/** Séries de la galerie : elles se créent librement, seules les limites sont fixes. */
export const SERIES = { max: 20, maxPhotos: 200 };

/** Habillage d'une photo posée dans un emplacement. */
export const FORMATS = ['auto', 'portrait', 'paysage', 'carre'];
export const MAX_LEGENDE = 160;
