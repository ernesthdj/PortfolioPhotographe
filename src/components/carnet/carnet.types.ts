import type { PhotoRef } from "@/lib/site-content";

export type CarnetFormule = {
  id: string;
  nom: string;
  prix_base: number;
  description: string | null;
};

export type CarnetMoment = {
  time: string;
  label: string;
  photo: PhotoRef | null;
};

export type CarnetGalerie = {
  titre: string;
  href: string;
  photos: PhotoRef[];
};

export type CarnetData = {
  heroTitre: string;
  heroSoustitre: string;
  heroPhoto: PhotoRef | null;
  moments: CarnetMoment[];
  galerie: CarnetGalerie;
  formules: CarnetFormule[];
  temoignage: { citation: string; auteur: string };
};

export const formatEuros = (value: number, decimales = 0) =>
  new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: decimales,
  }).format(value);
