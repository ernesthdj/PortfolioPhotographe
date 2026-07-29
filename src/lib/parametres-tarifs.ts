import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocode } from "@/lib/geo";

export type ParametresTarifs = {
  id: string;
  adresse_base: string;
  lat: number | null;
  lon: number | null;
  rayon_gratuit_km: number;
  tarif_par_km: number;
};

// Lit les paramètres tarifaires (adresse de base + rayon/tarif km). Si l'adresse de
// base n'a jamais été géocodée (ex: avant la mise en place du CMS), la géocode une
// fois et persiste le résultat — voir docs/modules/DEVIS.md §6 ("géocodée une seule
// fois, à la sauvegarde CMS").
export async function getParametresTarifs(): Promise<ParametresTarifs | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("parametres_tarifs").select("*").limit(1).single();

  if (!data) return null;

  if (data.lat === null || data.lon === null) {
    const coords = await geocode(data.adresse_base);
    if (coords) {
      await supabase
        .from("parametres_tarifs")
        .update({ lat: coords.lat, lon: coords.lon })
        .eq("id", data.id);
      return { ...data, lat: coords.lat, lon: coords.lon };
    }
  }

  return data;
}
