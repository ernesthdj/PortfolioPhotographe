import { createClient } from "@/lib/supabase/server";

// Lecture publique du contenu piloté par le CMS (contenus_site, photos actives) —
// voir docs/modules/CMS.md §4 et §3. Fallback sur les valeurs par défaut si le CMS
// n'a rien encore renseigné (dégradation propre, jamais de crash).

export async function getContenus(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("contenus_site").select("cle, valeur");
  return Object.fromEntries((data ?? []).map((c) => [c.cle, c.valeur ?? ""]));
}

export type PhotoRef = { url: string; titre: string | null };

export async function getPhotoByCategorie(categorie: string): Promise<PhotoRef | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .select("url_cloudinary, titre")
    .eq("categorie", categorie)
    .eq("actif", true)
    .limit(1)
    .maybeSingle();

  return data ? { url: data.url_cloudinary, titre: data.titre } : null;
}

export async function getGaleriePhotos(): Promise<PhotoRef[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .select("url_cloudinary, titre")
    .eq("categorie", "galerie")
    .eq("actif", true)
    .order("ordre_affichage");

  return (data ?? []).map((p) => ({ url: p.url_cloudinary, titre: p.titre }));
}

// URL Cloudinary avec transformation responsive (redimensionnement + format auto).
export function cloudinaryUrl(url: string, width: number) {
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}
