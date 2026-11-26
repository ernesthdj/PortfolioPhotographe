import { fail, json, sameOrigin, sessionCookie } from "../_lib/auth.js";

/** Déconnexion : efface le cookie de session. */
export function POST(request: Request): Response {
  if (!sameOrigin(request)) return fail(403, "Requête refusée.");
  return json(200, { ok: true }, { "Set-Cookie": sessionCookie(null) });
}
