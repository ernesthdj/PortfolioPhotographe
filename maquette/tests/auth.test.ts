import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE_NAME, CSRF_HEADER, SESSION_TTL_S, adminConfig, clearFailures, guard, hashPassword, lockedFor, noteFailure, sameOrigin, sessionCookie, signSession, verifyPassword, verifySession } from "../api/_lib/auth.ts";

const SECRET = "s".repeat(48);
const HASH = hashPassword("mot de passe de test 123");
const ENV = { ADMIN_PASSWORD_HASH: HASH, SESSION_SECRET: SECRET };
const URL_SITE = "https://site.example/api/admin/manifest";

function requete(opts: { cookie?: string; origin?: string; csrf?: boolean; method?: string } = {}): Request {
  const headers = new Headers();
  if (opts.cookie) headers.set("cookie", opts.cookie);
  if (opts.origin) headers.set("origin", opts.origin);
  if (opts.csrf) headers.set(CSRF_HEADER, "1");
  return new Request(URL_SITE, { method: opts.method ?? "GET", headers });
}
const cookieValide = (): string => `${COOKIE_NAME}=${signSession(SECRET)}`;

test("should_accept_password_when_it_matches_the_hash", () => {
  assert.equal(verifyPassword("mot de passe de test 123", HASH), true);
});
test("should_reject_password_when_it_is_wrong", () => {
  assert.equal(verifyPassword("autre mot de passe 456", HASH), false);
});
test("should_reject_password_when_the_hash_is_malformed", () => {
  for (const bad of ["", "scrypt", "bcrypt$1$2$3$a$b", "scrypt$16384$8$1$AAAA", `${HASH}$extra`, "scrypt$999999999$8$1$AAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAA"]) {
    assert.equal(verifyPassword("mot de passe de test 123", bad), false, bad);
  }
});
test("should_produce_different_hashes_when_hashing_twice", () => {
  assert.notEqual(hashPassword("même mot de passe"), hashPassword("même mot de passe"));
});
test("should_never_contain_the_password_when_hashed", () => {
  assert.equal(HASH.includes("mot de passe"), false);
});

test("should_accept_session_when_signed_and_not_expired", () => {
  assert.equal(verifySession(SECRET, signSession(SECRET)), true);
});
test("should_reject_session_when_expired", () => {
  const token = signSession(SECRET, 1_000_000);
  assert.equal(verifySession(SECRET, token, 1_000_000 + (SESSION_TTL_S + 1) * 1000), false);
});
test("should_reject_session_when_signed_with_another_secret", () => {
  assert.equal(verifySession(SECRET, signSession("x".repeat(48))), false);
});
test("should_reject_session_when_payload_is_tampered", () => {
  const [payload, sig] = signSession(SECRET).split(".");
  const forged = Buffer.from(JSON.stringify({ exp: 9_999_999_999 })).toString("base64url");
  assert.notEqual(forged, payload);
  assert.equal(verifySession(SECRET, `${forged}.${sig}`), false);
});
test("should_reject_session_when_token_is_garbage", () => {
  for (const bad of ["", "abc", "a.b.c", "."]) assert.equal(verifySession(SECRET, bad), false, bad);
});

test("should_close_login_when_configuration_is_missing_or_secret_too_short", () => {
  assert.equal(adminConfig({}), null);
  assert.equal(adminConfig({ ADMIN_PASSWORD_HASH: HASH }), null);
  assert.equal(adminConfig({ ADMIN_PASSWORD_HASH: HASH, SESSION_SECRET: "court" }), null);
  assert.notEqual(adminConfig(ENV), null);
});
test("should_set_a_hardened_cookie_when_opening_a_session", () => {
  const c = sessionCookie("jeton");
  for (const part of ["__Host-admin=jeton", "Path=/", "HttpOnly", "Secure", "SameSite=Strict", `Max-Age=${SESSION_TTL_S}`]) assert.ok(c.includes(part), part);
  assert.ok(sessionCookie(null).includes("Max-Age=0"));
});

test("should_answer_503_when_admin_is_not_configured", () => {
  assert.equal(guard(requete({ cookie: cookieValide() }), false, {})?.status, 503);
});
test("should_answer_401_when_there_is_no_session_cookie", () => {
  assert.equal(guard(requete(), false, ENV)?.status, 401);
});
test("should_answer_401_when_the_session_cookie_is_invalid", () => {
  assert.equal(guard(requete({ cookie: `${COOKIE_NAME}=n-importe-quoi` }), false, ENV)?.status, 401);
});
test("should_allow_a_read_when_the_session_is_valid", () => {
  assert.equal(guard(requete({ cookie: cookieValide() }), false, ENV), null);
});
test("should_refuse_a_write_when_the_origin_is_missing_or_foreign", () => {
  assert.equal(guard(requete({ cookie: cookieValide(), csrf: true, method: "PUT" }), true, ENV)?.status, 403);
  assert.equal(guard(requete({ cookie: cookieValide(), csrf: true, origin: "https://pirate.example", method: "PUT" }), true, ENV)?.status, 403);
});
test("should_refuse_a_write_when_the_csrf_header_is_missing", () => {
  assert.equal(guard(requete({ cookie: cookieValide(), origin: "https://site.example", method: "PUT" }), true, ENV)?.status, 403);
});
test("should_allow_a_write_when_session_origin_and_header_are_right", () => {
  assert.equal(guard(requete({ cookie: cookieValide(), origin: "https://site.example", csrf: true, method: "PUT" }), true, ENV), null);
});
test("should_compare_origin_by_host_when_checking_same_origin", () => {
  assert.equal(sameOrigin(requete({ origin: "https://site.example" })), true);
  assert.equal(sameOrigin(requete({ origin: "https://site.example.pirate.com" })), false);
  assert.equal(sameOrigin(requete({ origin: "pas une adresse" })), false);
  assert.equal(sameOrigin(requete()), false);
});

test("should_lock_an_address_when_five_attempts_failed_then_unlock_after_the_delay", () => {
  const ip = "203.0.113.9", t0 = 5_000_000;
  clearFailures(ip);
  for (let i = 0; i < 4; i++) noteFailure(ip, t0);
  assert.equal(lockedFor(ip, t0), 0);
  noteFailure(ip, t0);
  assert.ok(lockedFor(ip, t0) > 0);
  assert.equal(lockedFor(ip, t0 + 16 * 60 * 1000), 0);
  clearFailures(ip);
});
