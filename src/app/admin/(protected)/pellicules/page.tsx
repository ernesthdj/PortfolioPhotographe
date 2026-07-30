import { createClient } from "@/lib/supabase/server";
import { PelliculesManager } from "@/components/admin/PelliculesManager";

export default async function AdminPelliculesPage() {
  const supabase = await createClient();
  const { data: pellicules } = await supabase
    .from("pellicules")
    .select("id, slug, noms_maries, lieu, date_mariage, actif, ordre_affichage, pellicule_photos(count)")
    .order("ordre_affichage");

  const rows = (pellicules ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    noms_maries: p.noms_maries,
    lieu: p.lieu,
    date_mariage: p.date_mariage,
    actif: p.actif,
    ordre_affichage: p.ordre_affichage,
    photo_count: p.pellicule_photos[0]?.count ?? 0,
  }));

  return <PelliculesManager pellicules={rows} />;
}
