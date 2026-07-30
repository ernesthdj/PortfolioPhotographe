import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PelliculeEditor } from "@/components/admin/PelliculeEditor";

export default async function AdminPelliculeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pellicule } = await supabase
    .from("pellicules")
    .select(
      "id, slug, noms_maries, lieu, date_mariage, formule, temoignage_citation, temoignage_auteur, actif"
    )
    .eq("id", id)
    .maybeSingle();

  if (!pellicule) notFound();

  const { data: photos } = await supabase
    .from("pellicule_photos")
    .select("id, url_cloudinary, public_id_cloudinary, ordre_affichage")
    .eq("pellicule_id", id)
    .order("ordre_affichage");

  return <PelliculeEditor pellicule={pellicule} photos={photos ?? []} />;
}
