import { createClient } from "@/lib/supabase/server";
import { ChampsManager } from "@/components/admin/ChampsManager";

export default async function AdminChampsPage() {
  const supabase = await createClient();
  const { data: champs } = await supabase
    .from("dossier_champs")
    .select("id, libelle, cle, type, options_json, obligatoire, section, ordre_affichage, actif")
    .order("ordre_affichage");

  return <ChampsManager champs={champs ?? []} />;
}
