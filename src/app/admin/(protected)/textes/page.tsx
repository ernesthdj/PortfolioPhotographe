import { createClient } from "@/lib/supabase/server";
import { TextesManager } from "@/components/admin/TextesManager";

// Libellés humains masquant les clés techniques (CMS.md §4).
const CHAMPS_TEXTES = [
  { cle: "hero_titre", label: "Titre principal (hero)", multiline: false },
  { cle: "hero_soustitre", label: "Sous-titre (hero)", multiline: true },
  { cle: "about_titre", label: "Titre section À propos", multiline: false },
  { cle: "about_texte", label: "Texte À propos", multiline: true },
  { cle: "temoignage_citation", label: "Citation témoignage", multiline: true },
  { cle: "temoignage_auteur", label: "Auteur témoignage", multiline: false },
];

export default async function AdminTextesPage() {
  const supabase = await createClient();
  const { data: contenus } = await supabase.from("contenus_site").select("cle, valeur");

  const valeurs = Object.fromEntries((contenus ?? []).map((c) => [c.cle, c.valeur ?? ""]));

  return <TextesManager champs={CHAMPS_TEXTES} valeurs={valeurs} />;
}
