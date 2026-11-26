/** Formats d'image acceptés par le CMS, reconnus à leurs premiers octets (le type annoncé par le navigateur n'est jamais cru). */
export interface ImageKind {
  ext: "jpg" | "png" | "webp";
  type: "image/jpeg" | "image/png" | "image/webp";
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ascii = (b: Uint8Array, from: number, to: number): string => String.fromCharCode(...b.slice(from, to));

export function detectImage(b: Uint8Array): ImageKind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b.length >= PNG.length && PNG.every((v, i) => b[i] === v)) return { ext: "png", type: "image/png" };
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}
