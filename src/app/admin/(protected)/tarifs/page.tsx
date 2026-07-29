import { createClient } from "@/lib/supabase/server";
import { TarifsManager } from "@/components/admin/TarifsManager";

export default async function AdminTarifsPage() {
  const supabase = await createClient();

  const [{ data: formules }, { data: parametres }] = await Promise.all([
    supabase
      .from("formules")
      .select("id, nom, prix_base, description, actif")
      .order("ordre_affichage"),
    supabase
      .from("parametres_tarifs")
      .select("adresse_base, rayon_gratuit_km, tarif_par_km")
      .limit(1)
      .single(),
  ]);

  return (
    <TarifsManager
      formules={formules ?? []}
      parametres={parametres ?? { adresse_base: "", rayon_gratuit_km: 0, tarif_par_km: 0 }}
    />
  );
}
