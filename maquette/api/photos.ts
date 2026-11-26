import { publicConfig, readManifest, toPublic } from "./_lib/manifest.js";

/** Lecture publique : configuration du site + photos publiées et leurs emplacements. */
export async function GET(): Promise<Response> {
  let manifest = null;
  try {
    const m = await readManifest();
    manifest = m ? toPublic(m) : null;
  } catch {
    // Store injoignable : le site retombe sur ses emplacements par défaut.
  }
  return Response.json(
    { config: publicConfig(), manifest },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } },
  );
}
