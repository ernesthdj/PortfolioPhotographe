import { createClient } from "@/lib/supabase/server";
import { PhotosManager } from "@/components/admin/PhotosManager";

export default async function AdminPhotosPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select(
      "id, url_cloudinary, public_id_cloudinary, titre, categorie, actif, ordre_affichage, created_at, image_width, image_height, crop_x, crop_y, crop_width, crop_height"
    )
    .order("created_at", { ascending: false });

  return <PhotosManager photos={photos ?? []} />;
}
