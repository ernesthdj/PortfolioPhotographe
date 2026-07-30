import Link from "next/link";
import { getGaleriePhotos } from "@/lib/site-content";
import { Reveal } from "./Reveal";
import { SitePhoto } from "./SitePhoto";

const SLOT_HEIGHTS = ["h-[160px] md:h-[250px]", "h-[210px] md:h-[330px]", "h-[160px] md:h-[250px]"];
const SLOT_LABELS = ["Préparatifs — N&B", "Chevaux & mariés", "Détail — bouquet"];

export async function Gallery() {
  const photos = await getGaleriePhotos();

  return (
    <section id="galerie" className="px-6 py-20 text-center md:py-[90px]">
      <Reveal>
        <div className="mb-2.5 font-mono text-[9px] tracking-[0.15em] text-bronze">
          Nº004 · GALERIE
        </div>
        <h2 className="mb-10 font-serif text-2xl font-medium text-ink md:text-[26px]">
          Planche-contact — extrait
        </h2>
        <div className="mx-auto grid max-w-3xl grid-cols-3 items-center gap-3 md:gap-5">
          {SLOT_HEIGHTS.map((height, i) => (
            <SitePhoto
              key={i}
              photo={photos[i] ?? null}
              label={SLOT_LABELS[i]}
              className={`w-full ${height}`}
            />
          ))}
        </div>
        <Link href="/galerie" className="mt-7 inline-block text-[13px]">
          Voir toute la galerie →
        </Link>
      </Reveal>
    </section>
  );
}
