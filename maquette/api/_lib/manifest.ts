import { get, put } from "@vercel/blob";

/**
 * Manifeste du mini CMS : une seule source de vérité (cms/manifest.json dans le store Blob).
 * Les photos elles-mêmes sont des fichiers Blob (cms/photos/…) ; le manifeste dit lesquelles sont
 * publiées et où elles s'affichent. Les photos non publiées ne sortent jamais de l'API publique.
 */

export interface Photo {
  id: string;
  /** Chemin dans le store (ex. « cms/photos/ab12cd.jpg »). */
  file: string;
  w: number;
  h: number;
  alt: string;
  published: boolean;
  /** Point focal du recadrage, de 0 à 1 (0,5 = centre). */
  fx: number;
  fy: number;
}

export interface EventGroup {
  id: string;
  /** Service (0 à 5, voir SERVICES côté site). */
  svc: number;
  tag: string;
  txt: string;
  photos: string[];
}

export interface Manifest {
  version: 1;
  /** Incrémenté à chaque sauvegarde : refuse une sauvegarde faite sur une version périmée. */
  rev: number;
  photos: Photo[];
  /** Emplacements nommés : « intro » (5), « accueil:0 »…« accueil:5 » (6), « service:0 »…« service:5 » (1). */
  slots: Record<string, string[]>;
  events: EventGroup[];
}

/** Manifeste vide : état de départ tant que rien n'a été enregistré. */
export function emptyManifest(): Manifest {
  return { version: 1, rev: 0, photos: [], slots: {}, events: [] };
}

export const SLOT_LIMITS: Readonly<Record<string, number>> = Object.fromEntries([
  ["intro", 5],
  ...[0, 1, 2, 3, 4, 5].flatMap((s) => [
    [`accueil:${s}`, 6],
    [`service:${s}`, 1],
  ]),
]);

const MANIFEST_PATH = "cms/manifest.json";
const ID_RE = /^[a-z0-9_-]{4,40}$/;
const FILE_RE = /^cms\/photos\/[a-z0-9._-]{4,80}$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.length <= max ? v : null;
const unit = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null;
const dim = (v: unknown): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 20000 ? v : null;

/** Valide une entrée inconnue (corps de requête ou fichier lu) ; renvoie null si invalide. */
export function parseManifest(input: unknown): Manifest | null {
  if (!isRecord(input) || input.version !== 1) return null;
  const rev = input.rev;
  if (typeof rev !== "number" || !Number.isInteger(rev) || rev < 0) return null;
  if (!Array.isArray(input.photos) || input.photos.length > MAX_PHOTOS) return null;

  const photos: Photo[] = [];
  const ids = new Set<string>();
  for (const raw of input.photos) {
    if (!isRecord(raw)) return null;
    const { id, file, alt, published } = raw;
    const w = dim(raw.w), h = dim(raw.h), fx = unit(raw.fx), fy = unit(raw.fy);
    const altOk = text(alt, 200);
    if (typeof id !== "string" || !ID_RE.test(id) || ids.has(id)) return null;
    if (typeof file !== "string" || !FILE_RE.test(file)) return null;
    if (w === null || h === null || fx === null || fy === null || altOk === null) return null;
    if (typeof published !== "boolean") return null;
    ids.add(id);
    photos.push({ id, file, w, h, alt: altOk, published, fx, fy });
  }

  const slots: Record<string, string[]> = {};
  if (!isRecord(input.slots)) return null;
  for (const [key, list] of Object.entries(input.slots)) {
    const limit = SLOT_LIMITS[key];
    if (limit === undefined || !Array.isArray(list) || list.length > limit) return null;
    if (!list.every((id): id is string => typeof id === "string" && ids.has(id))) return null;
    slots[key] = list;
  }

  if (!Array.isArray(input.events) || input.events.length > 20) return null;
  const events: EventGroup[] = [];
  const eventIds = new Set<string>();
  for (const raw of input.events) {
    if (!isRecord(raw)) return null;
    const { id, svc } = raw;
    const tag = text(raw.tag, 160), txt = text(raw.txt, 240);
    if (typeof id !== "string" || !ID_RE.test(id) || eventIds.has(id)) return null;
    if (typeof svc !== "number" || !Number.isInteger(svc) || svc < 0 || svc > 5) return null;
    if (tag === null || txt === null) return null;
    if (!Array.isArray(raw.photos) || raw.photos.length > 200) return null;
    if (!raw.photos.every((p): p is string => typeof p === "string" && ids.has(p))) return null;
    eventIds.add(id);
    events.push({ id, svc, tag, txt, photos: raw.photos });
  }

  return { version: 1, rev, photos, slots, events };
}

export const MAX_PHOTOS = 600;

/** Ajoute une photo (non publiée, dans aucun emplacement) ; ne touche ni à `rev` ni à l'original. */
export function addPhoto(m: Manifest, photo: Photo): Manifest {
  return { ...m, photos: [...m.photos, photo] };
}

/** Retire une photo du manifeste ET de tous les emplacements et séries qui la citent. */
export function removePhoto(m: Manifest, id: string): Manifest {
  const sans = (ids: string[]): string[] => ids.filter((x) => x !== id);
  return {
    ...m,
    photos: m.photos.filter((p) => p.id !== id),
    slots: Object.fromEntries(Object.entries(m.slots).map(([k, v]) => [k, sans(v)])),
    events: m.events.map((e) => ({ ...e, photos: sans(e.photos) })),
  };
}

export async function readManifest(): Promise<Manifest | null> {
  const res = await get(MANIFEST_PATH, { access: "public", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  try {
    return parseManifest(JSON.parse(await new Response(res.stream).text()));
  } catch {
    return null;
  }
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  await put(MANIFEST_PATH, JSON.stringify(manifest), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

/** Vue publique : seulement les photos publiées, et les emplacements nettoyés de ce qui ne l'est pas. */
export function toPublic(m: Manifest): Manifest {
  const live = new Set(m.photos.filter((p) => p.published).map((p) => p.id));
  const keep = (ids: string[]): string[] => ids.filter((id) => live.has(id));
  return {
    version: 1,
    rev: m.rev,
    photos: m.photos.filter((p) => p.published),
    slots: Object.fromEntries(Object.entries(m.slots).map(([k, v]) => [k, keep(v)])),
    events: m.events.map((e) => ({ ...e, photos: keep(e.photos) })).filter((e) => e.photos.length > 0),
  };
}

export interface PublicConfig {
  /** Faux = parcours devis masqué (vitrine seule). Vrai sur les aperçus, faux en production sauf DEVIS_ENABLED=1. */
  devis: boolean;
  contact: { email: string; phone: string };
}

export function publicConfig(): PublicConfig {
  const prod = process.env.VERCEL_ENV === "production";
  return {
    devis: prod ? process.env.DEVIS_ENABLED === "1" : true,
    contact: { email: process.env.CONTACT_EMAIL ?? "", phone: process.env.CONTACT_PHONE ?? "" },
  };
}
