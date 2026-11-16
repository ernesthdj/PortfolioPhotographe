// Photothèque de la version mobile : emplacements neutres (dégradé + libellé) en attendant les vrais clichés.
// `r` = largeur / hauteur ; `ton` = teinte du dégradé ; `nb` = la photo reste en noir et blanc après développement.
export const PHOTOS = [
  { id: 'chateau', libelle: 'Mariés · château', alt: 'Les mariés devant le château, la mariée sourit', r: 2 / 3, ton: 1 },
  { id: 'champ', libelle: 'Couple · champ', alt: 'Couple enlacé dans un champ', r: 1400 / 600, ton: 6, nb: true },
  { id: 'grand-champ', libelle: 'Couple · grand champ', alt: 'Couple debout dans un grand champ', r: 1400 / 600, ton: 3 },
  { id: 'bouquet', libelle: 'Mariés · bouquet', alt: 'Les mariés enlacés, bouquet au premier plan', r: 2 / 3, ton: 4, nb: true },
  { id: 'baiser', libelle: 'Baiser · joue', alt: 'Baiser sur la joue', r: 2 / 3, ton: 5 }
];
