import { getContenus, getPhotoByCategorie } from "@/lib/site-content";
import { Reveal } from "./Reveal";
import { SitePhoto } from "./SitePhoto";

export async function About() {
  const [contenus, portraitPhoto, travailPhoto] = await Promise.all([
    getContenus(),
    getPhotoByCategorie("about-portrait"),
    getPhotoByCategorie("about-travail"),
  ]);

  const titre = contenus.about_titre || "Chaque mariage a son propre grain de lumière.";
  const texte =
    contenus.about_texte ||
    "Je m'adapte à votre journée plutôt que de l'imposer dans un style unique — parfois cinématique, parfois épuré et doux — toujours documentaire, toujours discret.";

  return (
    <section id="a-propos" className="px-6 pb-20 md:pb-24">
      <Reveal className="flex flex-col items-center">
        <div className="mb-2.5 font-mono text-[9px] tracking-[0.15em] text-bronze">
          Nº002 · À PROPOS
        </div>
        <h2 className="max-w-lg text-center font-serif text-2xl font-medium text-ink md:text-[32px]">
          {titre}
        </h2>
        <p className="mt-4 max-w-xl text-center text-[14.5px] leading-[1.75] text-ink/70">
          {texte}
        </p>
        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-7 md:grid-cols-2">
          <SitePhoto photo={portraitPhoto} label="Portrait du photographe" className="h-[300px] w-full" />
          <SitePhoto photo={travailPhoto} label="En plein travail — argentique" className="h-[300px] w-full" />
        </div>
      </Reveal>
    </section>
  );
}
