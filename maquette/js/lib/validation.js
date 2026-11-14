// Règles de validation de saisie partagées (maquette : rien n'est envoyé, mais les libellés doivent dire vrai).
// Le vrai back-end (PID) devra refaire ces contrôles côté serveur : ce fichier ne remplace pas la validation serveur.

/** Forme d'une adresse e-mail (pas de vérification d'existence). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const emailValide = (s) => EMAIL_RE.test(s);

/** Longueur minimale d'un mot de passe à la création d'un compte (annoncée dans le champ : « 8 caractères minimum »). */
export const MDP_MIN = 8;

/** Message d'erreur d'un mot de passe, ou '' s'il est accepté. À la connexion on ne contrôle que la présence. */
export function erreurMdp(mdp, creation) {
  if (!mdp) return creation ? 'Choisissez un mot de passe.' : 'Indiquez votre mot de passe.';
  if (creation && mdp.length < MDP_MIN) return `Au moins ${MDP_MIN} caractères.`;
  return '';
}
