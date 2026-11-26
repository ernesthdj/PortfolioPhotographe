// Photos du site public (accueil, galerie) : photos de test (mariage Marie & Bryan) hébergées sur Vercel Blob.
// La liste vient de photos-blob.js (générée). L'ancienne version à emplacements neutres est dans photos-site.placeholder.js.
// `r` = largeur / hauteur réelles ; `ton` reste le dégradé de repli affiché pendant le chargement.
import { BLOB, REELLES } from './photos-blob.js';

export const PHOTOS = REELLES.map(([f, w, h], i) => {
  const n = String(i + 1).padStart(3, '0');
  return { alt: 'Photo de mariage ' + n, altG: 'Photo de mariage ' + n, label: 'Marie & Bryan · ' + n, r: w / h, ton: (i % 8) + 1, src: BLOB + f };
});

/** Pose la vraie photo (si elle existe) sur un emplacement `.ph` : à appeler après chaque changement de className. */
export function habillePhoto(n, p) {
  n.classList.toggle('reel', !!p.src);
  if (p.src) n.style.setProperty('--img', 'url("' + p.src + '")');
  else n.style.removeProperty('--img');
}
