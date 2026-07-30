import { createClient } from "@/lib/supabase/server";

// Lecture publique du contenu piloté par le CMS (contenus_site, photos actives) —
// voir docs/modules/CMS.md §4 et §3. Fallback sur les valeurs par défaut si le CMS
// n'a rien encore renseigné (dégradation propre, jamais de crash).

export async function getContenus(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("contenus_site").select("cle, valeur");
  return Object.fromEntries((data ?? []).map((c) => [c.cle, c.valeur ?? ""]));
}

export type PhotoCrop = { x: number; y: number; width: number; height: number };

export type PhotoRef = { url: string; titre: string | null; crop: PhotoCrop | null };

const CROP_COLUMNS = "url_cloudinary, titre, crop_x, crop_y, crop_width, crop_height";

function toCrop(row: {
  crop_x: number | null;
  crop_y: number | null;
  crop_width: number | null;
  crop_height: number | null;
}): PhotoCrop | null {
  if (row.crop_x == null || row.crop_y == null || !row.crop_width || !row.crop_height) {
    return null;
  }
  return { x: row.crop_x, y: row.crop_y, width: row.crop_width, height: row.crop_height };
}

export async function getPhotoByCategorie(categorie: string): Promise<PhotoRef | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .select(CROP_COLUMNS)
    .eq("categorie", categorie)
    .eq("actif", true)
    .limit(1)
    .maybeSingle();

  return data ? { url: data.url_cloudinary, titre: data.titre, crop: toCrop(data) } : null;
}

export async function getGaleriePhotos(): Promise<PhotoRef[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .select(CROP_COLUMNS)
    .eq("categorie", "galerie")
    .eq("actif", true)
    .order("ordre_affichage");

  return (data ?? []).map((p) => ({ url: p.url_cloudinary, titre: p.titre, crop: toCrop(p) }));
}

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
