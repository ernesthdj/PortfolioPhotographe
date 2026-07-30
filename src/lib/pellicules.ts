import { createClient } from "@/lib/supabase/server";

// Lecture publique des Pellicules (module Galerie) — voir docs/modules/GALERIE.md.
// RLS filtre déjà sur `actif = true`, mais on le garde explicite ici pour la lisibilité
// et la cohérence avec les autres fonctions de site-content.ts.

export type PelliculePhoto = {
  id: string;
  url: string;
  titre: string | null;
};

export type Pellicule = {
  id: string;
  slug: string;
  nomsMaries: string;
  lieu: string | null;
  dateMariage: string | null;
  formule: string | null;
  temoignageCitation: string | null;
  temoignageAuteur: string | null;
  photos: PelliculePhoto[];
};

function mapPellicule(row: {
  id: string;
  slug: string;
  noms_maries: string;
  lieu: string | null;
  date_mariage: string | null;
  formule: string | null;
  temoignage_citation: string | null;
  temoignage_auteur: string | null;
  pellicule_photos: { id: string; url_cloudinary: string; titre: string | null; ordre_affichage: number }[];
}): Pellicule {
  return {
    id: row.id,
    slug: row.slug,
    nomsMaries: row.noms_maries,
    lieu: row.lieu,
    dateMariage: row.date_mariage,
    formule: row.formule,
    temoignageCitation: row.temoignage_citation,
    temoignageAuteur: row.temoignage_auteur,
    photos: [...row.pellicule_photos]
      .sort((a, b) => a.ordre_affichage - b.ordre_affichage)
      .map((p) => ({ id: p.id, url: p.url_cloudinary, titre: p.titre })),
  };
}

const SELECT_PELLICULE =
  "id, slug, noms_maries, lieu, date_mariage, formule, temoignage_citation, temoignage_auteur, pellicule_photos(id, url_cloudinary, titre, ordre_affichage)";

// Toutes les Pellicules publiées, ordonnées pour le sélecteur — n'inclut que les
// pellicules ayant au moins une photo (UC-V1 cas #1/#2, GALERIE.md §4.3).
export async function getPellicules(): Promise<Pellicule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pellicules")
    .select(SELECT_PELLICULE)
    .eq("actif", true)
    .order("ordre_affichage");

  return (data ?? [])
    .map(mapPellicule)
    .filter((p) => p.photos.length > 0);
}

export async function getPelliculeBySlug(slug: string): Promise<Pellicule | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pellicules")
    .select(SELECT_PELLICULE)
    .eq("actif", true)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  const pellicule = mapPellicule(data);
  return pellicule.photos.length > 0 ? pellicule : null;
}
