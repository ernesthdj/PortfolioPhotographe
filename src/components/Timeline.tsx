import { getPhotoByCategorie } from "@/lib/site-content";
import { Reveal } from "./Reveal";
import { SitePhoto } from "./SitePhoto";

const STEPS = [
  { time: "05H", label: "Préparatifs", height: "h-[150px]", categorie: "timeline-05h" },
  { time: "14H", label: "Cérémonie", height: "h-[196px]", categorie: "timeline-14h" },
  { time: "19H", label: "Golden hour", height: "h-[196px]", categorie: "timeline-19h" },
  { time: "23H", label: "Fête", height: "h-[150px]", categorie: "timeline-23h" },
];

export async function Timeline() {
  const photos = await Promise.all(STEPS.map((step) => getPhotoByCategorie(step.categorie)));

  return (
    <section
      className="relative py-16 md:py-[80px]"
      style={{
        background:
          "linear-gradient(90deg, #8A5A2F 0%, #C9A46B 22%, #B7A385 50%, #C9A46B 78%, #8A5A2F 100%)",
      }}
    >
      <Reveal className="mb-10 text-center md:mb-[50px]">
        <div className="mb-2 font-mono text-[9px] tracking-[0.15em] text-cream-light/70">
          Nº003 · LE FIL D&apos;UNE JOURNÉE
        </div>
        <h2 className="font-serif text-2xl font-medium text-cream-light md:text-[26px]">
          05H → 23H
        </h2>
      </Reveal>

      <div className="mx-auto grid max-w-5xl grid-cols-2 items-end gap-4 px-6 md:grid-cols-4 md:gap-[18px] md:px-14">
        {STEPS.map((step, i) => (
          <Reveal key={step.time} delay={i * 0.1} className="flex flex-col items-center gap-3.5">
            <SitePhoto
              photo={photos[i]}
              label={`${step.time} — ${step.label}`}
              className={`w-full ${step.height}`}
            />
            <div className="text-center">
              <div className="text-[11px] font-semibold tracking-[0.1em] text-cream-light">
                {step.time}
              </div>
              <div className="text-[11.5px] text-cream-light/85">{step.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
