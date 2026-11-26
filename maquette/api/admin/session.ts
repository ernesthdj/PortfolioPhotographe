import { guard, json } from "../_lib/auth.js";

/** Dit si la session est valide (la page d'administration choisit ainsi entre connexion et contenu). */
export function GET(request: Request): Response {
  return guard(request, false) ?? json(200, { ok: true });
}
