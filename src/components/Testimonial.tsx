import { getContenus } from "@/lib/site-content";
import { Reveal } from "./Reveal";

export async function Testimonial() {
  const contenus = await getContenus();
  const citation =
    contenus.temoignage_citation ||
    "Il a su capturer des moments qu'on n'aurait même pas remarqués nous-mêmes.";
  const auteur = contenus.temoignage_auteur || "Clémence & Antoine";

  return (
    <section className="flex flex-col items-center px-6 py-14 text-center md:py-16">
      <Reveal>
        <p className="max-w-lg font-serif text-lg italic leading-[1.5] text-ink md:text-[21px]">
          « {citation} »
        </p>
        <div className="mt-3.5 text-xs tracking-[0.05em] text-ink/55">
          {auteur.toUpperCase()}
        </div>
      </Reveal>
    </section>
  );
}
