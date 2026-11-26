import { randomBytes } from "node:crypto";
import { del, put } from "@vercel/blob";
import { fail, guard, json } from "../_lib/auth.js";
import { detectImage } from "../_lib/image.js";
import { MAX_PHOTOS, addPhoto, emptyManifest, readManifest, removePhoto, writeManifest } from "../_lib/manifest.js";

/** Limite d'une requête sur Vercel : 4,5 Mo. La page réduit la photo avant l'envoi (2400 px, JPEG). */
const MAX_BYTES = 4_000_000;
const dim = (v: string | null): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 20000 ? n : null;
};

/** Envoie une photo (corps = octets de l'image, `?w=&h=` = dimensions) : écrit le fichier puis l'ajoute au manifeste, non publiée. */
export async function POST(request: Request): Promise<Response> {
  const refus = guard(request, true);
  if (refus) return refus;

  const url = new URL(request.url);
  const w = dim(url.searchParams.get("w")), h = dim(url.searchParams.get("h"));
  if (w === null || h === null) return fail(400, "Dimensions invalides.");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (!declared || declared > MAX_BYTES) return fail(413, "Photo trop lourde (4 Mo maximum après réduction).");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return fail(413, "Photo trop lourde (4 Mo maximum après réduction).");
  const kind = detectImage(bytes);
  if (!kind) return fail(415, "Format non pris en charge (JPEG, PNG ou WebP).");

  let file = "";
  try {
    const current = (await readManifest()) ?? emptyManifest();
    if (current.photos.length >= MAX_PHOTOS) return fail(409, "Bibliothèque pleine.");
    const id = randomBytes(8).toString("hex");
    file = `cms/photos/${id}.${kind.ext}`;
    await put(file, Buffer.from(bytes), { access: "public", contentType: kind.type, addRandomSuffix: false, allowOverwrite: false });
    const saved = { ...addPhoto(current, { id, file, w, h, alt: "", published: false, fx: 0.5, fy: 0.5 }), rev: current.rev + 1 };
    await writeManifest(saved);
    return json(201, saved);
  } catch {
    if (file) await del(file).catch(() => undefined);   // pas de fichier orphelin si l'enregistrement a échoué
    return fail(502, "Stockage injoignable.");
  }
}

/** Supprime une photo (`?id=`) : retirée du manifeste et de tous les emplacements, puis fichier effacé. */
export async function DELETE(request: Request): Promise<Response> {
  const refus = guard(request, true);
  if (refus) return refus;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  try {
    const current = (await readManifest()) ?? emptyManifest();
    const photo = current.photos.find((p) => p.id === id);
    if (!photo) return fail(404, "Photo introuvable.");
    const saved = { ...removePhoto(current, id), rev: current.rev + 1 };
    await writeManifest(saved);
    await del(photo.file).catch(() => undefined);
    return json(200, saved);
  } catch {
    return fail(502, "Stockage injoignable.");
  }
}
