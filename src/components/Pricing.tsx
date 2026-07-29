import { createClient } from "@/lib/supabase/server";
import { DevisForm } from "./DevisForm";
import { Reveal } from "./Reveal";

export async function Pricing() {
  const supabase = await createClient();
  const { data: formules } = await supabase
    .from("formules")
    .select("id, nom, prix_base, description")
    .eq("actif", true)
    .order("ordre_affichage");

  return (
    <section id="devis" className="flex flex-col items-center bg-ink px-6 py-16 text-center md:py-[74px]">
      <Reveal className="flex flex-col items-center">
        <div className="mb-2.5 font-mono text-[9px] tracking-[0.15em] text-gold">
          Nº005 · DEVIS
        </div>
        <h2 className="mb-2 font-serif text-2xl font-medium text-cream-light md:text-[27px]">
          Trois formules, un devis clair
        </h2>
        <p className="mb-11 max-w-sm text-[13px] text-cream-light/60">
          Simulez le vôtre en quelques clics — frais de déplacement calculés
          automatiquement
        </p>
      </Reveal>

      <DevisForm formules={formules ?? []} />
    </section>
  );
}
