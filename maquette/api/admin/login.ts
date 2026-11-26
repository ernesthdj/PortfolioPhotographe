import { adminConfig, clearFailures, clientIp, fail, json, lockedFor, noteFailure, sameOrigin, sessionCookie, signSession, verifyPassword } from "../_lib/auth.js";

const MAX_BODY = 1024;
const pause = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Connexion : vérifie le mot de passe puis pose le cookie de session. Réponse identique pour tout échec d'identifiants. */
export async function POST(request: Request): Promise<Response> {
  const cfg = adminConfig();
  if (!cfg) return fail(503, "Connexion administrateur non configurée.");
  if (!sameOrigin(request)) return fail(403, "Requête refusée.");

  const ip = clientIp(request);
  const wait = lockedFor(ip);
  if (wait > 0) return fail(429, "Trop d'essais. Réessayez plus tard.", { "Retry-After": String(wait) });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, "Requête trop grande.");
  let password: string | null = null;
  try {
    const body: unknown = JSON.parse(raw);
    const p = typeof body === "object" && body !== null ? (body as Record<string, unknown>).password : undefined;
    password = typeof p === "string" && p.length > 0 && p.length <= 200 ? p : null;
  } catch {
    password = null;
  }
  if (password === null) return fail(400, "Requête invalide.");

  if (!verifyPassword(password, cfg.hash)) {
    noteFailure(ip);
    await pause(700);
    return fail(401, "Identifiants invalides.");
  }
  clearFailures(ip);
  return json(200, { ok: true }, { "Set-Cookie": sessionCookie(signSession(cfg.secret)) });
}
