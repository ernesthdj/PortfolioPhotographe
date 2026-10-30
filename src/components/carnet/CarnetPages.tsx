"use client";

import Link from "next/link";
import { useState } from "react";
import { CarnetPhoto } from "./CarnetPhoto";
import type { CarnetGalerie, CarnetMoment } from "./carnet.types";

export function PageHead({ kicker, numero }: { kicker: string; numero: string }) {
  return (
    <div className="pg-head">
      <span className="label">{kicker}</span>
      <span className="pg-no">{numero}/04</span>
    </div>
  );
}

// Le mot « lumière » porte l'accent du titre, s'il est présent dans le texte du CMS.
function TitreAccentue({ texte }: { texte: string }) {
  const [avant, apres] = texte.replace(/\s*\n\s*/g, " ").split(/lumière/i);
  if (apres === undefined) return <>{texte}</>;
  return (
    <>
      {avant}
      <b>lumière</b>
      {apres}
    </>
  );
}

export function CoverPage({
  titre,
  soustitre,
  photo,
  onOpen,
}: {
  titre: string;
  soustitre: string;
  photo: Parameters<typeof CarnetPhoto>[0]["photo"];
  onOpen: () => void;
}) {
  return (
    <div className="in">
      <i className="band" />
      <div className="brand">ERNEST H.</div>
      <div className="k">PHOTOGRAPHE DE MARIAGE</div>
      <div className="window">
        <CarnetPhoto photo={photo} label="Photo signature" width={900} eager />
      </div>
      <h2>
        <TitreAccentue texte={titre} />
      </h2>
      <p>{soustitre}</p>
      <button type="button" className="open-btn" onClick={onOpen}>
        Ouvrir le carnet
      </button>
      <div className="foot">
        <span>Nº014 · CARNET 2026</span>
        <span>GLISSER ↑ POUR OUVRIR</span>
      </div>
    </div>
  );
}

export function DayPage({ moments }: { moments: CarnetMoment[] }) {
  return (
    <div className="pg">
      <PageHead kicker="Nº001 · Le fil d'une journée" numero="01" />
      <h2>
        De 05H à <b>23H</b>.
      </h2>
      <p className="lede">Quatre moments, une seule lumière qui change.</p>
      <div className="day">
        {moments.map((moment) => (
          <div className="mo" key={moment.time}>
            <div className="t">
              <b>{moment.time}</b>
              <span>{moment.label.toUpperCase()}</span>
            </div>
            <div className="pic">
              <i className="tape" />
              <CarnetPhoto photo={moment.photo} label={`${moment.time} — ${moment.label}`} width={700} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GalleryPage({ galerie }: { galerie: CarnetGalerie }) {
  const [selection, setSelection] = useState(0);
  const tirage = galerie.photos[selection] ?? null;

  return (
    <div className="pg">
      <PageHead kicker={`Nº002 · ${galerie.titre}`} numero="02" />
      <h2>
        Une vue choisie par <b>rangée</b>.
      </h2>
      <figure className="print">
        <CarnetPhoto photo={tirage} label="Tirage" width={1200} />
        <figcaption>TIRAGE · {(tirage?.titre ?? "Pellicule").toUpperCase()}</figcaption>
      </figure>
      <div
        className="sheet"
        role="group"
        aria-label="Planche contact"
        style={{ gridTemplateRows: `repeat(${Math.ceil(galerie.photos.length / 3) || 1}, minmax(0, 1fr))` }}
      >
        {galerie.photos.map((photo, i) => (
          <button
            type="button"
            className="thumb"
            key={photo.url}
            aria-pressed={i === selection}
            aria-label={`Voir ${photo.titre ?? `la photo ${i + 1}`}`}
            onClick={() => setSelection(i)}
          >
            <CarnetPhoto photo={photo} label="" width={400} />
          </button>
        ))}
      </div>
      <Link className="more" href={galerie.href}>
        Voir toute la galerie →
      </Link>
    </div>
  );
}
