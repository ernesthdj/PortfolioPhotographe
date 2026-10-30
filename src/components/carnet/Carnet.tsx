"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { devisSchema, type DevisFormValues } from "@/lib/validation/devis-schema";
import { carnetFontVariables } from "./carnet-fonts";
import { ContactPage, QuotePage } from "./CarnetForms";
import { CoverPage, DayPage, GalleryPage } from "./CarnetPages";
import type { CarnetData } from "./carnet.types";
import "./carnet.css";

const TABS = ["Accueil", "Journée", "Galerie", "Devis", "Contact"];
const RINGS = 11;
// Ancres encore utilisées par les autres pages du site (Header, liens externes).
const HASH_PAGES: Record<string, number> = { "#galerie": 2, "#devis": 3, "#contact": 4 };

const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Le site entier est un calepin relié par le haut : une page du carnet = une page du
// site, et le défilement (aimanté page par page) tourne les pages. Voir
// docs/front/premier-impact-design.md. Le défilement vit dans un conteneur dédié pour
// que la barre du navigateur mobile ne change pas la hauteur des pages en cours de geste.
export function Carnet({ heroTitre, heroSoustitre, heroPhoto, moments, galerie, formules, temoignage }: CarnetData) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<(HTMLElement | null)[]>([]);
  const [current, setCurrent] = useState(0);

  const form = useForm<DevisFormValues>({
    resolver: zodResolver(devisSchema),
    defaultValues: { formuleId: formules[1]?.id ?? formules[0]?.id ?? "", honeypot: "", villeZone: "", message: "" },
  });

  const goTo = useCallback((page: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ top: page * scroller.clientHeight, behavior: reduced ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const pages = pagesRef.current.filter((page): page is HTMLElement => page !== null);
    let shown = -1;
    let raf = 0;

    function update() {
      raf = 0;
      if (!scroller) return;
      const progress = clamp(scroller.scrollTop / Math.max(1, scroller.clientHeight), 0, pages.length - 1);
      const active = Math.round(progress);

      pages.forEach((page, i) => {
        const flip = clamp(progress - i);
        const angle = reducedMotion.matches ? (flip >= 0.5 ? 180 : 0) : ease(flip) * 180;
        const lift = Math.sin((angle * Math.PI) / 180);
        const previous = i > 0 ? clamp(progress - (i - 1)) : 0;
        page.hidden = i < Math.floor(progress) - 1 || i > Math.floor(progress) + 2;
        page.style.transform = `rotateX(${angle.toFixed(2)}deg)`;
        page.style.zIndex = String(flip > 0 && flip < 1 ? 100 : flip >= 1 ? 10 + i : 50 - i);
        page.querySelectorAll<HTMLElement>(".shade").forEach((shade) => {
          shade.style.opacity = (lift * 0.9).toFixed(3);
        });
        const cast = page.querySelector<HTMLElement>(".cast");
        if (cast) cast.style.opacity = (Math.sin(previous * Math.PI) * 0.8).toFixed(3);
      });

      if (active !== shown) {
        shown = active;
        pages.forEach((page, i) => {
          page.inert = i !== active;
        });
        setCurrent(active);
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    const start = HASH_PAGES[window.location.hash];
    if (start) scroller.scrollTo({ top: start * scroller.clientHeight });

    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const contents = [
    <CoverPage key="accueil" titre={heroTitre} soustitre={heroSoustitre} photo={heroPhoto} onOpen={() => goTo(1)} />,
    <DayPage key="journee" moments={moments} />,
    <GalleryPage key="galerie" galerie={galerie} />,
    <QuotePage key="devis" formules={formules} form={form} onAsk={() => goTo(4)} />,
    <ContactPage key="contact" form={form} temoignage={temoignage} onChooseFormule={() => goTo(3)} />,
  ];

  return (
    <div className={`carnet ${carnetFontVariables}`}>
      <i className="halo a" />
      <i className="halo b" />
      <div className="scroller" ref={scrollerRef}>
        <div className="track">
          <div className="snaps" aria-hidden="true">
            {TABS.map((tab) => (
              <div className="snap" key={tab} />
            ))}
          </div>
          <main className="stage">
            <div className="phone">
              <div className="rings" aria-hidden="true">
                {Array.from({ length: RINGS }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <div className="book">
                {contents.map((content, i) => (
                  <section
                    className="page"
                    key={TABS[i]}
                    aria-label={TABS[i]}
                    ref={(node) => {
                      pagesRef.current[i] = node;
                    }}
                  >
                    <div className={`face front ${i === 0 ? "cover" : ""}`}>
                      {content}
                      <i className="shade" />
                      <i className="cast" />
                    </div>
                    <div className="face back">
                      <i className="shade" />
                    </div>
                  </section>
                ))}
              </div>
              <nav className="tabs" aria-label="Pages du carnet">
                {TABS.map((tab, i) => (
                  <button type="button" className="tab" key={tab} aria-current={i === current} onClick={() => goTo(i)}>
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
