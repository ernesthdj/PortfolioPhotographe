import { getPhotoByCategorie } from "@/lib/site-content";
import { Reveal } from "./Reveal";
import { SitePhoto } from "./SitePhoto";

const STEPS = [
  { time: "05H", label: "Préparatifs", height: "h-[150px]", heightPx: 150, categorie: "timeline-05h" },
  { time: "14H", label: "Cérémonie", height: "h-[196px]", heightPx: 196, categorie: "timeline-14h" },
  { time: "19H", label: "Golden hour", height: "h-[196px]", heightPx: 196, categorie: "timeline-19h" },
  { time: "23H", label: "Fête", height: "h-[150px]", heightPx: 150, categorie: "timeline-23h" },
];

// Longueur d'epingle constante au-dessus du plus haut polaroid — les items
// plus courts recoivent une epingle plus longue pour que tous s'accrochent
// au meme fil horizontal (voir MAX_HEIGHT plus bas).
const MAX_HEIGHT = Math.max(...STEPS.map((s) => s.heightPx));
const BASE_PIN = 18;
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

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

      <div className="relative mx-auto max-w-5xl px-6 md:px-14">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-cream-light/40 md:inset-x-14" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-[18px]">
          {STEPS.map((step, i) => {
            const pinHeight = MAX_HEIGHT - step.heightPx + BASE_PIN;
            return (
              <Reveal key={step.time} delay={i * 0.1} className="flex flex-col items-center">
                <div className="w-px bg-cream-light/40" style={{ height: pinHeight }} />
                <div
                  className={`polaroid-card w-full bg-cream-light p-2 pb-4 shadow-[0_10px_20px_rgba(28,23,18,0.3)] ${TILTS[i % TILTS.length]}`}
                >
                  <SitePhoto
                    photo={photos[i]}
                    label={`${step.time} — ${step.label}`}
                    className={`w-full ${step.height}`}
                  />
                  <div className="mt-2 text-center">
                    <div className="text-[11px] font-semibold tracking-[0.1em] text-ink/75">
                      {step.time}
                    </div>
                    <div className="text-[11px] text-ink/60">{step.label}</div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
