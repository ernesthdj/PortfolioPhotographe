import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client Supabase avec la clé service — contourne totalement les policies RLS.
// Réservé aux Server Actions qui doivent écrire sans session client (ex: insertion
// d'un lead anonyme depuis le devis rapide, rate limiting, lecture de
// parametres_tarifs pour le calcul de distance). Ne jamais importer depuis un
// composant client — le paquet "server-only" fait échouer le build si c'est le cas.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
