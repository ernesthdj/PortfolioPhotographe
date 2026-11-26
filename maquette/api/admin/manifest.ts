import { fail, guard, json } from "../_lib/auth.js";
import { emptyManifest, parseManifest, readManifest, writeManifest } from "../_lib/manifest.js";

const MAX_BODY = 1024 * 1024;

/** Manifeste complet, photos non publiées comprises (réservé à l'administrateur). */
export async function GET(request: Request): Promise<Response> {
  const refus = guard(request, false);
  if (refus) return refus;
  try {
    return json(200, (await readManifest()) ?? emptyManifest());
  } catch {
    return fail(502, "Stockage injoignable.");
  }
}

/** Enregistre le manifeste. Le corps porte la version lue (`rev`) : si elle est périmée, rien n'est écrit (409). */
export async function PUT(request: Request): Promise<Response> {
  const refus = guard(request, true);
  if (refus) return refus;

  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, "Manifeste trop volumineux.");
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return fail(400, "JSON invalide.");
  }
  const next = parseManifest(input);
  if (!next) return fail(400, "Manifeste invalide.");

  try {
    const current = (await readManifest()) ?? emptyManifest();
    if (next.rev !== current.rev) return json(409, { error: "Version périmée : rechargez avant d'enregistrer.", rev: current.rev });
    const saved = { ...next, rev: current.rev + 1 };
    await writeManifest(saved);
    return json(200, saved);
  } catch {
    return fail(502, "Stockage injoignable.");
  }
}
