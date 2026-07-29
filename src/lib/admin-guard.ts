import "server-only";
import { createClient } from "@/lib/supabase/server";

// Vérifie que l'utilisateur connecté est bien l'admin (présent dans admin_users).
// Défense en profondeur : les policies RLS bloquent déjà les écritures non-admin,
// mais chaque Server Action admin passe aussi par ce guard explicite.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return adminRow ? { user, supabase } : null;
}
