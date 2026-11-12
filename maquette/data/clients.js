// Clients et prospects d'exemple (données factices). Les dossiers viennent de dossiers.js :
// le nombre de dossiers et l'étape affichés dans l'atelier se calculent à partir d'eux (resumeDossiers).
import { DOSSIERS, ETAPES } from './dossiers.js';

export const ORIGINES = ['Instagram', 'Bouche-à-oreille', 'Google', 'Salon du mariage', 'Site'];
export const ETIQUETTES = ['Mariage 2027', 'VIP', 'Entreprise', 'À relancer'];

// nom, e-mail, type, origine, étiquettes, dernière activité (texte), simulations envoyées (prospects)
const BRUT = [
  ['Camille D.', 'camille.d@example.com', 'client', 'Instagram', ['Mariage 2027'], '10 nov.'],
  ['Studio Lemaire', 'contact@studio-lemaire.example', 'client', 'Google', ['Entreprise', 'VIP'], 'aujourd’hui'],
  ['Inès & Tom', 'ines.tom@example.com', 'client', 'Salon du mariage', ['Mariage 2027'], '5 nov.'],
  ['Famille R.', 'famille.r@example.com', 'client', 'Bouche-à-oreille', [], '8 nov.'],
  ['Liège Events', 'hello@liege-events.example', 'client', 'Google', ['Entreprise'], '3 nov.'],
  ['Nora B.', 'nora.b@example.com', 'client', 'Instagram', [], '29 oct.'],
  ['Café Lumen', 'bonjour@cafe-lumen.example', 'client', 'Site', ['Entreprise'], '27 oct.'],
  ['Hugo M.', 'hugo.m@example.com', 'client', 'Bouche-à-oreille', [], '9 nov.'],
  ['Léa & Max', 'lea.max@example.com', 'client', 'Salon du mariage', ['Mariage 2027'], '2 nov.'],
  ['Sara K.', 'sara.k@example.com', 'client', 'Instagram', [], '6 nov.'],
  ['Ateliers V.', 'rh@ateliers-v.example', 'client', 'Google', ['Entreprise'], '30 oct.'],
  ['Maison Ota', 'cuisine@maison-ota.example', 'client', 'Bouche-à-oreille', [], '28 oct.'],
  ['Thomas & Léa', 'thomas.lea@example.com', 'client', 'Salon du mariage', [], '22 sept.'],
  ['Julien P.', 'julien.p@example.com', 'client', 'Google', [], '19 oct.'],
  ['Ateliers Nord', 'contact@ateliers-nord.example', 'client', 'Site', ['Entreprise'], '3 nov.'],
  ['Chloé & Sam', 'chloe.sam@example.com', 'client', 'Instagram', [], '2 nov.'],
  ['Famille M.', 'famille.m@example.com', 'client', 'Bouche-à-oreille', [], '9 nov.'],
  ['Famille L.', 'famille.l@example.com', 'client', 'Bouche-à-oreille', [], '7 nov.'],
  ['Anaïs & Paul', 'anais.paul@example.com', 'client', 'Salon du mariage', [], '4 nov.'],
  ['Amandine V.', 'amandine.v@example.com', 'client', 'Google', [], '2 oct.'],
  ['Brasserie Nord', 'contact@brasserie-nord.example', 'client', 'Site', [], '20 sept.'],
  ['Élise V.', 'elise.v@example.com', 'prospect', 'Instagram', ['À relancer'], '7 nov.', 2],
  ['Marc T.', 'marc.t@example.com', 'prospect', 'Google', [], '3 nov.', 1],
  ['Salomé & Jo', 'salome.jo@example.com', 'prospect', 'Salon du mariage', ['Mariage 2027', 'À relancer'], '1 nov.', 3]
];

export const CLIENTS = BRUT.map((r) => ({ nom: r[0], mail: r[1], ty: r[2], org: r[3], tags: r[4], act: r[5], simulations: r[6] || 0 }));
export const client = (nom) => CLIENTS.find((c) => c.nom === nom);

/** « 2 dossiers · accepté » ou « 3 simulations envoyées », calculé depuis les dossiers. */
export function resumeDossiers(c) {
  if (c.ty === 'prospect') return c.simulations + ' simulation' + (c.simulations > 1 ? 's' : '') + ' envoyée' + (c.simulations > 1 ? 's' : '');
  const ds = DOSSIERS.filter((d) => d.cli === c.nom);
  const ordre = ['soumis', 'accepte', 'confirme', 'realise', 'refuse', 'annule'];
  const premier = ds.map((d) => d.et).sort((x, y) => ordre.indexOf(x) - ordre.indexOf(y))[0];
  return ds.length + ' dossier' + (ds.length > 1 ? 's' : '') + (premier ? ' · ' + ETAPES[premier].t.toLowerCase() : '');
}
