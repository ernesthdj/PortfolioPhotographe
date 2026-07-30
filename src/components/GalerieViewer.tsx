"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Pellicule } from "@/lib/pellicules";
import { cloudinaryUrl } from "@/lib/cloudinary-url";
import { Reveal } from "./Reveal";

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
  const mainPhoto = photos[Math.min(photoIndex, Math.max(0, photos.length - 1))];

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

      <div className="mt-9 grid grid-cols-[44px_1fr_44px] items-center gap-4 md:gap-6">
        <button
          onClick={prevPhoto}
          disabled={photos.length < 2}
          aria-label="Photo précédente"
          className="flex h-11 w-11 items-center justify-center justify-self-end rounded-full border border-ink/30 text-[16px] text-ink disabled:opacity-30"
        >
          ‹
        </button>
        <div className="relative mx-auto flex w-full justify-center">
          <div className="pointer-events-none absolute inset-[6%] rounded-full border border-dashed border-ink/10" />
          {mainPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- taille responsive fixe (max-w)
            <img
              src={cloudinaryUrl(mainPhoto.url, 1000)}
              alt={mainPhoto.titre ?? current.nomsMaries}
              className="h-[300px] w-full max-w-[640px] object-cover md:h-[440px]"
            />
          ) : (
            <div className="flex h-[300px] w-full max-w-[640px] items-center justify-center bg-ink/5 text-[12px] text-ink/40 md:h-[440px]">
              Aucune photo
            </div>
          )}
        </div>
        <button
          onClick={nextPhoto}
          disabled={photos.length < 2}
          aria-label="Photo suivante"
          className="flex h-11 w-11 items-center justify-center justify-self-start rounded-full border border-ink/30 text-[16px] text-ink disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {photos.length > 1 && (
        <div className="mt-5 flex justify-center gap-3 overflow-x-auto px-2 pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setPhotoIndex(i)}
              aria-label={`Photo ${i + 1}`}
              className={`h-[62px] w-[88px] flex-none overflow-hidden border transition-opacity ${
                i === photoIndex ? "border-2 border-bronze" : "border-ink/15 opacity-55 hover:opacity-80"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- vignette filmstrip, taille fixe */}
              <img src={cloudinaryUrl(photo.url, 200)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

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
