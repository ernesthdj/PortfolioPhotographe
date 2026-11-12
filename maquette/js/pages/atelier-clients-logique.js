// Atelier · logique commune aux pages Clients (E25 + E26.a) et Client (E26).
// Traduit la logique « clients-logic » des planches ErpClients / ErpClient : filtres, validation du panneau
// « Nouveau client », journal des échanges, puces. Aucune écriture dans le DOM sauf majPuces().
import { CLIENTS } from '../../data/clients.js';
import { SERVICES, OPTIONS, TVA, calculer } from '../../data/tarifs.js';
import { liste, el, texte } from '../lib/dom.js';

export const PAGE = 9;                    // clients par page
export const NUM_NOUVEAU = '2027-022';    // numéro du dossier créé depuis le panneau (libre dans data/dossiers.js)
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Catalogue proposé dans le panneau : SERVICES et OPTIONS de data/tarifs.js (référence unique des prix du simulateur).
// Chaque service est pris dans sa configuration par défaut du simulateur (durée incluse, ou 10 plats) ;
// le transport reste « à préciser » : il est calculé comme dans le simulateur quand le lieu est connu.
// ht : prix HTVA en centimes.
const cfgDefaut = (s) => (s.mode === 'P3'
  ? { sid: s.id, dur: s.incl, opts: [], lieux: [{ c: -1, h: 14 }] }
  : { sid: s.id, qty: 10, opts: [], lieux: [] });
export const CATALOGUE_DEVIS = [
  ...SERVICES.map((s) => { const l = calculer(cfgDefaut(s)).lignes[0]; return { k: s.id, t: s.t, s: l.sub, ht: Math.round(l.ht * 100) }; }),
  ...Object.entries(OPTIONS).map(([k, [t, px]]) => ({ k, t, s: 'Option', ht: Math.round(px * 100) }))
];
/** Prix TVAC (centimes) d'une ligne HTVA. */
export const ttc = (ht) => ht + Math.round(ht * TVA);
/** Total TVAC d'un devis composé (centimes) : TVA 21 % sur le total HTVA, comme totalCentimes() du simulateur. */
export const totalDevis = (htLignes) => ttc(htLignes.reduce((s, x) => s + x, 0));

/** Filtre de la liste (type, étiquette, origine, recherche nom/e-mail). `vide` simule l'état « Vide ». */
export function filtrerClients({ ty, tag, org, q }, vide) {
  if (vide) return [];
  const n = q.toLowerCase();
  return CLIENTS.filter((c) => (ty === 'tous' || c.ty === ty) && (!tag || c.tags.includes(tag)) && (!org || c.org === org)
    && (!n || c.nom.toLowerCase().includes(n) || c.mail.includes(n)));
}

/** Validation du panneau « Nouveau client » (UC08) : renvoie les trois messages d'erreur (chaîne vide = valide). */
export function validerNouveauClient(mail, nom, nbLignes) {
  return {
    errE: EMAIL_RE.test(mail) ? '' : 'Cette adresse email n’est pas valide.',
    errN: nom ? '' : 'Le nom du client est obligatoire.',
    errL: nbLignes ? '' : 'Ajoutez au moins une prestation au devis.'
  };
}

/** Résultat de la création : e-mail déjà connu -> dossier créé sur son compte, sinon e-mail d'activation. */
export function resultatCreation(mail) {
  const ex = CLIENTS.find((c) => c.mail.toLowerCase() === mail.toLowerCase());
  return ex
    ? { ex: true, t: 'Ce client existe déjà.', s: 'Le dossier n° ' + NUM_NOUVEAU + ' est créé sur le compte de ' + ex.nom + ', à l’étape « soumis ».' }
    : { ex: false, t: 'Dossier n° ' + NUM_NOUVEAU + ' créé.', s: 'À l’étape « soumis ». Un email « Activez votre compte » part vers ' + mail + '.' };
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
/** « 2026-11-11 » -> « 11 nov. 2026 » ; format invalide -> date du jour de la maquette. */
export function dateJournal(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? Number(m[3]) + ' ' + MOIS[Number(m[2]) - 1] + ' ' + m[1] : '11 nov. 2026';
}

/**
 * Met à jour un groupe de puces sans relancer leurs animations.
 * items : [{ t, on, go, nb? }] ; role : 'pressed' (aria-pressed) ou 'radio' (role radio + aria-checked).
 * style : style additionnel des boutons (ex. petites puces du canal).
 */
export function majPuces(parent, items, role = 'pressed', style = null) {
  liste(parent, items, (p) => p.t, (p) => {
    const b = el('button', { type: 'button', style, role: role === 'radio' ? 'radio' : null });
    b.addEventListener('click', () => b._go());
    return b;
  }, (b, p) => {
    b._go = p.go;
    b.className = 'puce' + (p.on ? ' on' : '');
    b.setAttribute(role === 'radio' ? 'aria-checked' : 'aria-pressed', p.on ? 'true' : 'false');
    texte(b, p.t);
  });
}

/** Message d'erreur sous un champ : point bordeaux + texte (textContent), vide si pas d'erreur. */
export function poserErreur(p, message, champ) {
  p.replaceChildren();
  if (message) p.append(el('i', { 'aria-hidden': 'true' }), document.createTextNode(message));
  if (champ) champ.setAttribute('aria-invalid', message ? 'true' : 'false');
}
