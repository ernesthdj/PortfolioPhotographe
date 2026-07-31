import { getContenus, getPhotoByCategorie } from "@/lib/site-content";
import { Reveal } from "./Reveal";
import { SitePhoto } from "./SitePhoto";

export async function Hero() {
  const [contenus, heroPhoto] = await Promise.all([
    getContenus(),
    getPhotoByCategorie("hero"),
  ]);

  const titre = contenus.hero_titre || "Je photographie la lumière\nqui ne repasse pas.";
  const soustitre =
    contenus.hero_soustitre ||
    "De l'aube des préparatifs à la dernière danse — un fil du temps, pas une liste de poses.";

  return (
    <section className="flex flex-col items-center px-6 pb-20 pt-14 md:pb-24 md:pt-20">
      <Reveal>
        <div className="relative mb-5 h-[280px] w-[280px] md:h-[400px] md:w-[400px]">
          <div className="absolute inset-0 rounded-full border border-ink/22" />
          <div className="absolute inset-3 rounded-full border border-dashed border-ink/15" />
          <div className="hero-glass-bezel absolute inset-3 rounded-full" aria-hidden="true" />
          <div className="hero-iris absolute inset-7 overflow-hidden rounded-full">
            <SitePhoto photo={heroPhoto} label="Photo signature" className="h-full w-full" />
          </div>
          <div
            className="absolute inset-0 rounded-full mix-blend-multiply"
            style={{
              background:
                "conic-gradient(from 210deg, rgba(138,90,47,.22) 0deg, rgba(201,164,107,.3) 30deg, rgba(43,37,33,0) 60deg, rgba(43,37,33,0) 300deg, rgba(138,90,47,.22) 330deg, rgba(138,90,47,.22) 360deg)",
            }}
          />
          <div className="hero-orbit pointer-events-none absolute inset-3 rounded-full" aria-hidden="true">
            <div className="absolute left-1/2 top-0 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_7px_2px_rgba(201,164,107,0.55)]" />
          </div>
          <div
            className="absolute left-1/2 top-1/2 h-3.5 w-px bg-ink"
            style={{ transform: "translate(-50%, -50%) rotate(0deg)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-3.5 w-px bg-ink"
            style={{ transform: "translate(-50%, -50%) rotate(90deg)" }}
          />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink" />
          <span className="absolute left-1/2 top-1.5 -translate-x-1/2 font-mono text-[10px] tracking-[0.1em] text-ink/50">
            00H
          </span>
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.1em] text-ink/50">
            12H
          </span>
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.1em] text-ink/50">
            06H
          </span>
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.1em] text-ink/50">
            18H
          </span>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap border border-ink/25 bg-cream px-2.5 py-0.5 font-mono text-[9px] tracking-[0.08em] text-bronze">
            Nº014 · 18H32 · 1/125 ƒ2.0
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-9 flex flex-col items-center">
        <h1 className="max-w-2xl text-center font-serif text-3xl font-medium leading-[1.15] text-ink md:text-[46px]">
          {titre}
        </h1>
        <p className="mt-5 max-w-md text-center text-[14.5px] leading-[1.75] text-ink/70">
          {soustitre}
        </p>
      </Reveal>

      <Reveal delay={0.3} className="mt-8 flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#devis"
            className="w-[200px] bg-ink px-6 py-3.5 text-center text-[12.5px] tracking-[0.05em] text-cream-light transition-opacity hover:opacity-90"
          >
            Demander un devis
          </a>
          <a
            href="#galerie"
            className="w-[200px] border border-ink/30 px-6 py-3.5 text-center text-[12.5px] tracking-[0.05em] text-ink transition-colors hover:bg-ink/5"
          >
            Voir la galerie
          </a>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="h-2.5 w-2.5 rounded-full border border-ink/40" />
          <div className="relative h-px w-[120px] bg-ink/25">
            <span className="absolute -top-[9px] left-0 font-mono text-[9px] text-ink/40">
              ƒ1.4
            </span>
            <span className="absolute -top-[9px] left-[36%] font-mono text-[9px] text-ink/40">
              ƒ2.8
            </span>
            <span className="absolute -top-[9px] left-[72%] font-mono text-[9px] text-ink/40">
              ƒ5.6
            </span>
          </div>
          <div className="h-2.5 w-2.5 rounded-full border border-ink/40" />
        </div>
      </Reveal>
    </section>
  );
}
