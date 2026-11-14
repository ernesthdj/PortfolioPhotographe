// Réductions de l'atelier : SOURCE UNIQUE des exemples de la liste (E20) et du formulaire (E21).
// Rien n'est écrit ici en phrases : « Si … alors … sur … » est généré depuis ces données (js/pages/atelier-reductions-logique.js).
// Les prix viennent de data/tarifs.js ; ici on ne garde que des clés (id de service, clé d'option, indice de catégorie).
//
// Réduction : {
//   id, libelle,
//   conditions : [{ type: 'contient', items: [clés] } | { type: 'nbServices', n } | { type: 'categorie', ref: indice }
//                 | { type: 'montant', v: euros HTVA } | { type: 'dates', n } | { type: 'code', code } | { type: 'parrainage' }]   (toutes doivent être vraies)
//   effet  : { type: 'pourcentage' | 'montant', valeur } | { type: 'offert' }
//   cible  : { type: 'dossier' | 'transport' } | { type: 'service' | 'option', ref: clé } | { type: 'categorie', ref: indice }
//   limites: { max: utilisations maximum | null, du, au: 'AAAA-MM-JJ' | null, parClient: bool, plafond: remise maximale en euros | null }
//   usages : nombre d'utilisations déjà enregistrées
//   cumul  : 'general' (réglage général) | 'oui' | 'non'
//   suggeree : proposée au visiteur ; active : prise en compte par le moteur de prix
// }
export const REDUCTIONS = [
  { id: 'mariage-album', libelle: 'Mariage + album', conditions: [{ type: 'contient', items: ['mar', 'album'] }],
    effet: { type: 'pourcentage', valeur: 10 }, cible: { type: 'dossier' },
    limites: { max: 20, du: '2027-01-01', au: '2027-03-31', parClient: false, plafond: null }, usages: 8, cumul: 'general', suggeree: true, active: true },
  { id: 'hiver27', libelle: 'Code HIVER27', conditions: [{ type: 'code', code: 'HIVER27' }],
    effet: { type: 'montant', valeur: 50 }, cible: { type: 'dossier' },
    limites: { max: null, du: null, au: null, parClient: true, plafond: null }, usages: 3, cumul: 'general', suggeree: false, active: true },
  { id: 'transport-2-dates', libelle: 'Transport offert dès 2 dates', conditions: [{ type: 'dates', n: 2 }],
    effet: { type: 'pourcentage', valeur: 100 }, cible: { type: 'transport' },
    limites: { max: null, du: null, au: null, parClient: false, plafond: null }, usages: 0, cumul: 'general', suggeree: false, active: true },
  { id: 'bienvenue-filleul', libelle: 'Bienvenue filleul', conditions: [{ type: 'parrainage' }],
    effet: { type: 'pourcentage', valeur: 5 }, cible: { type: 'dossier' },
    limites: { max: null, du: null, au: null, parClient: false, plafond: null }, usages: 2, cumul: 'general', suggeree: false, active: false }
];

/** Noms courts des options dans les phrases (« Album » plutôt que « Album photo 30×30 ») ; les services gardent leur libellé de data/tarifs.js. */
export const NOMS_COURTS = { album: 'Album', tir: 'Tirages', sec: 'Second photographe' };

/**
 * Devis d'exemple de l'aperçu chiffré : calculé par `calculer()` de data/tarifs.js (même moteur que le simulateur).
 * `dates` : nombre de dates différentes du devis (le moteur de prix n'en tient pas compte, les conditions « dates » si).
 */
export const DEVIS_EXEMPLE = { cfg: { sid: 'mar', dur: 6, opts: ['album'], lieux: [{ c: 2, h: 9 }] }, dates: 1 };
