// Photos du site public (accueil, galerie), version PC ET version mobile : photos de test (mariage Marie & Bryan) hébergées sur Vercel Blob.
// La liste vient de photos-blob.js (générée). L'ancienne version à emplacements neutres est dans photos-site.placeholder.js.
// `r` = largeur / hauteur réelles ; `ton` reste le dégradé de repli affiché pendant le chargement.
// SOURCE UNIQUE : la version mobile (m/js/photos.js) et les événements de la galerie (galerie-evenements.js) en dérivent.
import { BLOB, REELLES } from './photos-blob.js';

export const PHOTOS = REELLES.map(([f, w, h], i) => {
  const n = String(i + 1).padStart(3, '0');
  return { alt: 'Photo de mariage ' + n, altG: 'Photo de mariage ' + n, label: 'Marie & Bryan · ' + n, r: w / h, ton: (i % 8) + 1, src: BLOB + f };
});

/** Largeurs servies par la redimensionneuse d'images de Vercel : elles DOIVENT figurer dans vercel.json > images.sizes. */
export const TAILLES = { vignette: 960, grand: 1600 };

/** Adresse d'une photo à une largeur donnée (WebP, 5 à 10 fois plus léger que l'original) ; hors Vercel (poste local), l'original. */
export function urlPhoto(src, w) {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  return !w || local ? src : '/_vercel/image?url=' + encodeURIComponent(src) + '&w=' + w + '&q=75';
}

/** Pose la vraie photo (si elle existe) sur un emplacement `.ph` : à appeler après chaque changement de className. `w` = largeur servie (vignette par défaut). */
export function habillePhoto(n, p, w = TAILLES.vignette) {
  n.classList.toggle('reel', !!p.src);
  if (p.src) n.style.setProperty('--img', 'url("' + urlPhoto(p.src, w) + '")');
  else n.style.removeProperty('--img');
}
