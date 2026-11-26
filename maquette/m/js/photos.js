// Photothèque de la version mobile : photos de test (mariage Marie & Bryan) hébergées sur Vercel Blob, liste dans ../data/photos-blob.js.
// L'ancienne version à emplacements neutres est dans photos.placeholder.js.
// `r` = largeur / hauteur réelles ; `ton` = teinte du dégradé de repli ; `nb` = la photo reste en noir et blanc après développement.
import { BLOB, REELLES } from '../../data/photos-blob.js';

const reelle = (i) => { const [f, w, h] = REELLES[i]; return { src: BLOB + f, r: w / h }; };
// Les 5 premiers gardent leur rôle (identifiants et sens de cadrage) : portrait, panorama, panorama, portrait, portrait.
const TETE = [
  { id: 'chateau', libelle: 'Mariés · château', alt: 'Les mariés devant le château, la mariée sourit', ton: 1, ...reelle(0) },
  { id: 'champ', libelle: 'Couple · champ', alt: 'Couple enlacé dans un champ', ton: 6, nb: true, ...reelle(1) },
  { id: 'grand-champ', libelle: 'Couple · grand champ', alt: 'Couple debout dans un grand champ', ton: 3, ...reelle(4) },
  { id: 'bouquet', libelle: 'Mariés · bouquet', alt: 'Les mariés enlacés, bouquet au premier plan', ton: 4, nb: true, ...reelle(2) },
  { id: 'baiser', libelle: 'Baiser · joue', alt: 'Baiser sur la joue', ton: 5, ...reelle(3) }
];
const SUITE = REELLES.slice(5).map((_, k) => {
  const n = String(k + 6).padStart(3, '0');
  return { id: 'p' + n, libelle: 'Marie & Bryan · ' + n, alt: 'Photo de mariage ' + n, ton: (k % 6) + 1, ...reelle(k + 5) };
});
export const PHOTOS = [...TETE, ...SUITE];
