import { createClient } from "@/lib/supabase/server";
import { LeadsManager } from "@/components/admin/LeadsManager";

export default async function AdminLeadsPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: notes }, { data: formules }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, nom, email, telephone, date_mariage, ville_zone, distance_km, nombre_invites, formule_id, prix_estime, message, statut, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("lead_notes").select("id, lead_id, contenu, created_at").order("created_at"),
    supabase.from("formules").select("id, nom"),
  ]);

  return (
    <LeadsManager
      leads={leads ?? []}
      notes={notes ?? []}
      formules={formules ?? []}
    />
  );
}
