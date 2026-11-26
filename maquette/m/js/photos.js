// Photothèque de la version mobile. SOURCE UNIQUE avec la version PC : la liste, l'ordre et les photos viennent de ../../data/photos-site.js
// (mêmes indices : PHOTOS[i] ici = PHOTOS[i] sur PC). Les 5 premières reçoivent un identifiant et une description.
// `r` = largeur / hauteur réelles ; `ton` = teinte du dégradé de repli ; `nb` = la photo reste en noir et blanc après développement.
// `src` = vignette légère (WebP 960 px) pour les listes ; `srcGrand` = version 1600 px pour la photo agrandie.
import { PHOTOS as SITE, TAILLES, urlPhoto } from '../../data/photos-site.js';

const TETE = [
  { id: 'chateau', libelle: 'Mariés · château', alt: 'Les mariés devant le château, la mariée sourit', ton: 1 },
  { id: 'champ', libelle: 'Couple · champ', alt: 'Couple enlacé dans un champ', ton: 6, nb: true },
  { id: 'bouquet', libelle: 'Mariés · bouquet', alt: 'Les mariés enlacés, bouquet au premier plan', ton: 4, nb: true },
  { id: 'baiser', libelle: 'Baiser · joue', alt: 'Baiser sur la joue', ton: 5 },
  { id: 'grand-champ', libelle: 'Couple · grand champ', alt: 'Couple debout dans un grand champ', ton: 3 }
];

export const PHOTOS = SITE.map((s, i) => {
  const n = String(i + 1).padStart(3, '0');
  const base = TETE[i] || { id: 'p' + n, libelle: 'Marie & Bryan · ' + n, alt: 'Photo de mariage ' + n, ton: ((i - 5) % 6) + 1 };
  return { ...base, r: s.r, src: urlPhoto(s.src, TAILLES.vignette), srcGrand: urlPhoto(s.src, TAILLES.grand) };
});
