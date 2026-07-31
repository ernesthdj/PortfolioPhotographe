"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import type { Pellicule } from "@/lib/pellicules";
import { cloudinaryUrl } from "@/lib/cloudinary-url";
import { Reveal } from "./Reveal";

// Largeur d'une tranche inactive et espacement entre tranches (doit rester
// synchro avec la classe `gap-1` du conteneur ci-dessous et la classe CSS
// `.gallery-slice` dans globals.css).
const SLICE_INACTIVE_WIDTH = 56;
const SLICE_GAP = 4;

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export function GalerieViewer({
  pellicules,
  currentSlug,
}: {
  pellicules: Pellicule[];
  currentSlug: string;
}) {
  const router = useRouter();
  const [photoIndex, setPhotoIndex] = useState(0);

  // Reset de la photo affichee quand on change de pellicule — pattern "ajuster l'etat
  // pendant le rendu" plutot qu'un useEffect (evite un rendu en cascade superflu).
  const [trackedSlug, setTrackedSlug] = useState(currentSlug);
  if (trackedSlug !== currentSlug) {
    setTrackedSlug(currentSlug);
    setPhotoIndex(0);
  }

  // Dimensions du conteneur des tranches — mesurees pour donner a chaque photo
  // une taille fixe et reelle (jamais recalculee au clic, voir plus bas : seul
  // le cadre qui la recadre change de taille, jamais la photo elle-meme).
  const sliceRowRef = useRef<HTMLDivElement>(null);
  const [rowSize, setRowSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = sliceRowRef.current;
    if (!el) return;
    setRowSize({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setRowSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ratio naturel (largeur/hauteur) de chaque photo, mesure une fois l'image
  // chargee — permet au volet de ne s'ouvrir que jusqu'a la largeur reelle de
  // la photo a la hauteur de la rangee, sans espace vide inutile de part et
  // d'autre quand la photo est plus etroite que l'espace disponible.
  const [photoRatios, setPhotoRatios] = useState<Record<string, number>>({});

  const currentIndex = Math.max(
    0,
    pellicules.findIndex((p) => p.slug === currentSlug)
  );
  const current = pellicules[currentIndex] as Pellicule | undefined;

  if (!current) {
    return (
      <section className="px-6 py-28 text-center">
        <p className="text-[14px] text-ink/55">Bientôt de nouvelles pellicules.</p>
      </section>
    );
  }

  function selectPellicule(slug: string) {
    router.push(`/galerie/${slug}`);
  }

  function prevPellicule() {
    const i = (currentIndex - 1 + pellicules.length) % pellicules.length;
    selectPellicule(pellicules[i].slug);
  }

  function nextPellicule() {
    const i = (currentIndex + 1) % pellicules.length;
    selectPellicule(pellicules[i].slug);
  }

  const photos = current.photos;

  function prevPhoto() {
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  function nextPhoto() {
    setPhotoIndex((i) => (i + 1) % photos.length);
  }

  const meta = [current.lieu, current.dateMariage ? formatDate(current.dateMariage) : null, current.formule]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="px-6 pb-20 pt-14 md:pb-24 md:pt-20">
      <Reveal className="flex flex-col items-center text-center">
        <div className="font-mono text-[9px] tracking-[0.15em] text-bronze">
          Nº006 · GALERIE PAR COUPLE
        </div>
        <h1 className="mt-3 font-serif text-3xl font-medium text-ink md:text-[38px]">
          Une bobine, une histoire.
        </h1>
        <p className="mt-3.5 max-w-md text-[13.5px] leading-[1.6] text-ink/65">
          Chaque mariage a son propre rouleau — parcourez leurs images, lisez leurs mots.
        </p>
      </Reveal>

      {pellicules.length > 0 && (
        <div className="mt-9 flex items-center justify-center gap-2.5">
          <button
            onClick={prevPellicule}
            disabled={pellicules.length < 2}
            aria-label="Pellicule précédente"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-ink/30 text-[13px] text-ink disabled:opacity-30"
          >
            ‹
          </button>
          <div className="flex gap-2.5">
            {pellicules.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPellicule(p.slug)}
                aria-label={p.nomsMaries}
                title={p.nomsMaries}
                className={`h-[30px] w-[30px] overflow-hidden rounded-full border transition-opacity ${
                  p.slug === currentSlug
                    ? "border-2 border-bronze opacity-100"
                    : "border-ink/25 opacity-50 hover:opacity-80"
                }`}
              >
                {p.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element -- vignette ronde, taille fixe
                  <img
                    src={cloudinaryUrl(p.photos[0].url, 100)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={nextPellicule}
            disabled={pellicules.length < 2}
            aria-label="Pellicule suivante"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-ink/30 text-[13px] text-ink disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      <div className="mt-9 flex flex-col items-center text-center">
        <div className="font-serif text-xl italic text-ink md:text-[22px]">{current.nomsMaries}</div>
        {meta && (
          <div className="mt-1.5 font-mono text-[9.5px] tracking-[0.1em] text-ink/45">
            {meta.toUpperCase()}
          </div>
        )}
      </div>

      <div className="mt-9 flex items-center gap-3 md:gap-5">
        <button
          onClick={prevPhoto}
          disabled={photos.length < 2}
          aria-label="Photo précédente"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-ink/30 text-[16px] text-ink disabled:opacity-30"
        >
          ‹
        </button>

        {photos.length > 0 ? (
          (() => {
            // Largeur max disponible pour la tranche ouverte (espace de la
            // rangee moins les autres tranches fermees).
            const maxAvailable = Math.max(
              rowSize.width - (photos.length - 1) * (SLICE_INACTIVE_WIDTH + SLICE_GAP),
              SLICE_INACTIVE_WIDTH
            );
            // Largeur reelle d'une photo a la hauteur de la rangee — le volet ne
            // s'ouvre pas plus loin que ca, pour eviter du vide inutile de part et
            // d'autre d'une photo plus etroite que l'espace disponible. Tant que le
            // ratio n'est pas encore mesure (image pas chargee), repli sur maxAvailable.
            const getOpenWidth = (photoId: string) => {
              const ratio = photoRatios[photoId];
              return ratio && rowSize.height
                ? Math.min(maxAvailable, Math.round(ratio * rowSize.height))
                : maxAvailable;
            };
            const activeOpenWidth = getOpenWidth(photos[photoIndex].id);
            // Decalage de la piste pour que le CENTRE de la photo active tombe
            // toujours au centre de la rangee (donc de la page, symetrique de
            // part et d'autre) — les tranches fermees avant elle ont toutes la
            // meme largeur, d'ou ce calcul simple.
            const offsetBeforeActive = photoIndex * (SLICE_INACTIVE_WIDTH + SLICE_GAP);
            const trackOffset = rowSize.width / 2 - (offsetBeforeActive + activeOpenWidth / 2);

            return (
              <div ref={sliceRowRef} className="relative h-[340px] flex-1 overflow-hidden md:h-[560px]">
                <div
                  className="gallery-track flex h-full items-stretch gap-1"
                  style={{ transform: `translateX(${trackOffset}px)` }}
                >
                  {photos.map((photo, i) => {
                    const isActive = i === photoIndex;
                    const openWidth = getOpenWidth(photo.id);
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setPhotoIndex(i)}
                        aria-label={photo.titre ?? `Photo ${i + 1}`}
                        aria-current={isActive}
                        style={{ flexShrink: 0, width: isActive ? openWidth : SLICE_INACTIVE_WIDTH }}
                        className="gallery-slice relative h-full overflow-hidden rounded-xl bg-ink/5"
                      >
                        {/* La photo a une taille FIXE (toujours `openWidth`, jamais animee ni
                            recalculee) et n'est jamais deplacee ni transformee — seul le cadre
                            ci-dessus (overflow-hidden) change de largeur et la recadre, comme
                            un volet qui s'ouvre/se ferme par-dessus une image immobile. Centree
                            via `left-1/2 -translate-x-1/2`, un positionnement fixe (pas anime),
                            pour que la tranche inactive revele toujours le centre de la photo. */}
                        {/* eslint-disable-next-line @next/next/no-img-element -- taille fixe pilotee par openWidth, pas par next/image */}
                        <img
                          ref={(el) => {
                            // `onLoad` ne se declenche pas de facon fiable si l'image est
                            // deja en cache navigateur (l'evenement peut avoir eu lieu
                            // avant que React n'attache le listener) — on verifie donc
                            // `complete` directement des le montage, en plus du fallback.
                            if (!el) return;
                            const measure = () => {
                              if (photoRatios[photo.id] || !el.naturalWidth || !el.naturalHeight) return;
                              const nextRatio = el.naturalWidth / el.naturalHeight;
                              setPhotoRatios((prev) => ({ ...prev, [photo.id]: nextRatio }));
                            };
                            if (el.complete) measure();
                            else el.addEventListener("load", measure, { once: true });
                          }}
                          src={cloudinaryUrl(photo.url, 1000)}
                          alt={photo.titre ?? current.nomsMaries}
                          style={{ width: openWidth }}
                          className="absolute left-1/2 top-0 h-full max-w-none -translate-x-1/2 object-contain"
                        />
                        {isActive && photo.titre && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-4 pb-3 pt-8 text-left">
                            <p className="font-serif text-[15px] text-cream-light">{photo.titre}</p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex h-[340px] flex-1 items-center justify-center bg-ink/5 text-[12px] text-ink/40 md:h-[560px]">
            Aucune photo
          </div>
        )}

        <button
          onClick={nextPhoto}
          disabled={photos.length < 2}
          aria-label="Photo suivante"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-ink/30 text-[16px] text-ink disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {current.temoignageCitation && (
        <Reveal className="mt-11 flex flex-col items-center text-center">
          <div className="mb-5 h-9 w-px bg-ink/25" />
          <p className="max-w-xl font-serif text-lg italic leading-[1.55] text-ink md:text-[21px]">
            « {current.temoignageCitation} »
          </p>
          {current.temoignageAuteur && (
            <div className="mt-3 text-[11.5px] tracking-[0.05em] text-ink/55">
              {current.temoignageAuteur.toUpperCase()}
            </div>
          )}
        </Reveal>
      )}

      <div className="-mx-6 mt-16 flex flex-col items-center bg-ink px-6 py-16 text-center md:-mx-10 md:px-10">
        <div className="font-mono text-[9px] tracking-[0.15em] text-gold">VOTRE HISTOIRE ?</div>
        <h2 className="mt-3.5 max-w-md font-serif text-2xl font-medium text-cream-light md:text-[27px]">
          Ajoutez votre bobine à la collection.
        </h2>
        <Link
          href="/#devis"
          className="mt-6 bg-cream-light px-7 py-3 text-[12.5px] tracking-[0.05em] text-ink transition-opacity hover:opacity-90"
        >
          Demander un devis
        </Link>
      </div>
    </section>
  );
}
