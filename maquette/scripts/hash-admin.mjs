// Calcule le haché du mot de passe administrateur (à enregistrer dans la variable ADMIN_PASSWORD_HASH).
// Usage : ADMIN_PW='votre mot de passe' node scripts/hash-admin.mjs
// Seul le haché est affiché ; le mot de passe n'est ni écrit ni conservé.
import { hashPassword } from "../api/_lib/auth.ts";

const pw = process.env.ADMIN_PW ?? "";
if (pw.length < 12) {
  console.error("Mot de passe trop court (12 caractères minimum) ou ADMIN_PW absente.");
  process.exit(1);
}
console.log(hashPassword(pw));
