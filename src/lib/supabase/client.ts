import { createBrowserClient } from "@supabase/ssr";

// Client Supabase pour Client Components ('use client') — session gérée via cookies
// navigateur, soumis aux policies RLS comme le client serveur.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
