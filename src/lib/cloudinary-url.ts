// Transformations d'URL Cloudinary — pures, sans dépendance serveur (importable
// depuis un composant client, contrairement à site-content.ts qui dépend de
// next/headers via le client Supabase serveur).

export type PhotoCrop = { x: number; y: number; width: number; height: number };

// URL Cloudinary avec transformation responsive (redimensionnement + format auto).
// Si un cadrage manuel existe (voir plan "Recadrage" du 2026-07-30), il est appliqué
// avant le redimensionnement via un c_crop chaîné — sinon comportement inchangé
// (object-cover centré côté CSS, comme avant cette fonctionnalité).
export function cloudinaryUrl(url: string, width: number, crop?: PhotoCrop | null) {
  const cropSegment = crop
    ? `c_crop,x_${crop.x},y_${crop.y},w_${crop.width},h_${crop.height}/`
    : "";
  return url.replace("/upload/", `/upload/${cropSegment}w_${width},q_auto,f_auto/`);
}

// Image OpenGraph 1200×630 (aperçu de lien Messenger/Instagram/WhatsApp) — voir
// docs/modules/GALERIE.md §6.
export function cloudinaryOgImage(url: string) {
  return url.replace("/upload/", "/upload/c_fill,w_1200,h_630,q_auto,f_auto/");
}
