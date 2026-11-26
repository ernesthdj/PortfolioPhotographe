import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Authentification du CMS : un seul compte administrateur, sans base de données.
 * - Le mot de passe n'est jamais stocké : seul son haché scrypt est dans ADMIN_PASSWORD_HASH.
 * - La session est un cookie signé (HMAC-SHA256) avec SESSION_SECRET, HttpOnly, Secure, SameSite=Strict.
 * - Toute écriture exige l'origine du site ET l'en-tête X-Admin-Request (protection CSRF).
 * Aucun secret n'est écrit dans le code ni dans les journaux.
 */

export const COOKIE_NAME = "__Host-admin";
export const SESSION_TTL_S = 12 * 60 * 60;
export const CSRF_HEADER = "x-admin-request";

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 } as const;
const MAX_MEM = 64 * 1024 * 1024;
const MIN_SECRET_LENGTH = 32;

const b64u = (b: Buffer): string => b.toString("base64url");
const safeEqual = (a: Buffer, b: Buffer): boolean => a.length === b.length && timingSafeEqual(a, b);
const mac = (secret: string, data: string): string => createHmac("sha256", secret).update(data).digest("base64url");
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

// ---- mot de passe ------------------------------------------------------------------------------------------

/** Haché au format « scrypt$N$r$p$sel$clé » (sel aléatoire de 16 octets). */
export function hashPassword(password: string, salt: Buffer = randomBytes(16)): string {
  const key = scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: MAX_MEM });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, b64u(salt), b64u(key)].join("$");
}

/** Vrai seulement si le mot de passe correspond ; un haché mal formé donne toujours faux. */
export function verifyPassword(password: string, stored: string): boolean {
  const [algo, n, r, p, saltB64, keyB64, extra] = stored.split("$");
  if (algo !== "scrypt" || extra !== undefined || !n || !r || !p || !saltB64 || !keyB64) return false;
  const N = Number(n), R = Number(r), P = Number(p);
  const ok = (v: number, min: number, max: number): boolean => Number.isInteger(v) && v >= min && v <= max;
  if (!ok(N, 1024, 131072) || (N & (N - 1)) !== 0 || !ok(R, 1, 16) || !ok(P, 1, 4)) return false;
  const salt = Buffer.from(saltB64, "base64url"), expected = Buffer.from(keyB64, "base64url");
  if (salt.length < 8 || expected.length < 16) return false;
  try {
    return safeEqual(scryptSync(password, salt, expected.length, { N, r: R, p: P, maxmem: MAX_MEM }), expected);
  } catch {
    return false;
  }
}

// ---- session -----------------------------------------------------------------------------------------------

export function signSession(secret: string, nowMs: number = Date.now()): string {
  const payload = b64u(Buffer.from(JSON.stringify({ exp: Math.floor(nowMs / 1000) + SESSION_TTL_S })));
  return `${payload}.${mac(secret, payload)}`;
}

export function verifySession(secret: string, token: string, nowMs: number = Date.now()): boolean {
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return false;
  if (!safeEqual(Buffer.from(sig), Buffer.from(mac(secret, payload)))) return false;
  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return isRecord(data) && typeof data.exp === "number" && data.exp * 1000 > nowMs;
  } catch {
    return false;
  }
}

/** En-tête Set-Cookie : jeton = ouvre la session, null = la ferme. */
export function sessionCookie(token: string | null): string {
  const base = `${COOKIE_NAME}=${token ?? ""}; Path=/; HttpOnly; Secure; SameSite=Strict`;
  return `${base}; Max-Age=${token === null ? 0 : SESSION_TTL_S}`;
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

// ---- configuration -----------------------------------------------------------------------------------------

export interface AdminConfig {
  hash: string;
  secret: string;
}

/** Null tant que les deux variables ne sont pas définies (et la clé assez longue) : la connexion reste fermée. */
export function adminConfig(env: Record<string, string | undefined> = process.env): AdminConfig | null {
  const hash = env.ADMIN_PASSWORD_HASH, secret = env.SESSION_SECRET;
  if (!hash || !secret || secret.length < MIN_SECRET_LENGTH) return null;
  return { hash, secret };
}

// ---- réponses et garde -------------------------------------------------------------------------------------

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
export const fail = (status: number, error: string, headers: Record<string, string> = {}): Response => json(status, { error }, headers);

/** Vrai si l'en-tête Origin désigne le site lui-même. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** Renvoie la réponse de refus, ou null si la requête est autorisée. `write` = exige aussi l'origine et l'en-tête CSRF. */
export function guard(request: Request, write: boolean, env: Record<string, string | undefined> = process.env, nowMs: number = Date.now()): Response | null {
  const cfg = adminConfig(env);
  if (!cfg) return fail(503, "Connexion administrateur non configurée.");
  const token = readCookie(request, COOKIE_NAME);
  if (!token || !verifySession(cfg.secret, token, nowMs)) return fail(401, "Connexion requise.");
  if (write && (!sameOrigin(request) || request.headers.get(CSRF_HEADER) !== "1")) return fail(403, "Requête refusée.");
  return null;
}

// ---- freinage des essais (au mieux : la mémoire d'une fonction n'est pas partagée entre instances) ------------

const MAX_FAILS = 5;
const LOCK_S = 15 * 60;
const fails = new Map<string, { n: number; until: number }>();

export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "inconnu";
}
/** Secondes à attendre avant un nouvel essai (0 = autorisé). */
export function lockedFor(ip: string, nowMs: number = Date.now()): number {
  const f = fails.get(ip);
  return f && f.until > nowMs ? Math.ceil((f.until - nowMs) / 1000) : 0;
}
export function noteFailure(ip: string, nowMs: number = Date.now()): void {
  const f = fails.get(ip) ?? { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= MAX_FAILS) { f.n = 0; f.until = nowMs + LOCK_S * 1000; }
  fails.set(ip, f);
}
export function clearFailures(ip: string): void {
  fails.delete(ip);
}
