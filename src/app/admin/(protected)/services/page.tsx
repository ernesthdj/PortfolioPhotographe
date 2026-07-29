import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "@/components/admin/ServicesManager";

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services_carte")
    .select("id, nom, description, prix, categorie, actif, ordre_affichage")
    .order("ordre_affichage");

  return <ServicesManager services={services ?? []} />;
}
