// Brouillon du devis, gardé dans sessionStorage (jamais de mot de passe, rien n'est envoyé).
//  - CLE_PUBLIC : composition du simulateur public (sans compte) : zone seule, lieux sans adresse (c = -3)
//  - CLE_PRECIS : composition précisée dans l'espace client (« Préciser ma journée ») : adresses exactes, privées
import { OPTIONS, COMMUNES, service } from '../../data/tarifs.js';

export const CLE_PUBLIC = 'maquette.simulateur.public';
export const CLE_PRECIS = 'maquette.preciser.lignes';

const lire = (cle) => { try { return sessionStorage.getItem(cle); } catch (e) { return null; } };
const ecrire = (cle, v) => { try { sessionStorage.setItem(cle, v); } catch (e) { /* stockage indisponible : sans effet */ } };
const borner = (v, a, b) => Math.max(a, Math.min(b, v));

/** Lignes valides d'un JSON stocké ; `lieu` normalise un lieu (valeurs hors plage rejetées ou ramenées). */
function lignesValides(brut, lieu) {
  let v;
  try { v = JSON.parse(brut || '[]'); } catch (e) { return []; }
  if (!Array.isArray(v)) return [];
  return v.filter((c) => c && service(c.sid) && Array.isArray(c.opts) && c.opts.every((k) => OPTIONS[k]) && Array.isArray(c.lieux)
    && (service(c.sid).mode === 'P3' ? Number.isFinite(c.dur) && c.lieux.length > 0 : Number.isFinite(c.qty)))
    .map((c) => ({ sid: c.sid, dur: c.dur === undefined ? undefined : borner(c.dur, 2, 14), qty: c.qty, opts: c.opts,
      lieux: c.lieux.map(lieu),
      date: typeof c.date === 'string' ? c.date.slice(0, 10) : '', zone: Number.isInteger(c.zone) && c.zone >= -1 && c.zone < COMMUNES.length ? c.zone : -1 }));
}

/** Composition du simulateur public (lieux sans adresse, c = -3). */
export function lireBrouillonPublic() {
  return lignesValides(lire(CLE_PUBLIC), (z) => ({ c: -3, h: Number.isFinite(z.h) ? z.h : 14, adr: '' }));
}
export function sauverBrouillonPublic(lignes) { ecrire(CLE_PUBLIC, JSON.stringify(lignes)); }

/** Exemple de la planche « Préciser ma journée » quand aucun brouillon n'existe. */
const EXEMPLE = () => [{ sid: 'mar', dur: 8, opts: ['album'], lieux: [{ c: -1, h: 13, adr: '' }], date: '2027-06-12', zone: 1 }];

/**
 * Lignes affichées sur « Préciser ma journée » : la composition déjà précisée si elle existe, sinon le brouillon
 * du simulateur public (les lieux passent de « zone » à « adresse à indiquer »), sinon l'exemple de la planche.
 */
export function lirePrecision() {
  const propre = lire(CLE_PRECIS);
  if (propre !== null) {
    return lignesValides(propre, (z) => ({
      c: Number.isInteger(z.c) && z.c >= -2 && z.c < COMMUNES.length ? z.c : -1, h: Number.isFinite(z.h) ? borner(z.h, 6, 23.5) : 14,
      adr: typeof z.adr === 'string' ? z.adr.slice(0, 200) : ''
    }));
  }
  const pub = lireBrouillonPublic();
  return pub.length ? pub.map((c) => ({ ...c, lieux: c.lieux.map((z) => ({ c: -1, h: borner(z.h, 6, 23.5), adr: '' })) })) : EXEMPLE();
}
export function sauverPrecision(lignes) { ecrire(CLE_PRECIS, JSON.stringify(lignes)); }

/** Repart du brouillon public (création de compte) ou efface tout (dossier soumis). */
export function viderPrecision() { try { sessionStorage.removeItem(CLE_PRECIS); } catch (e) { /* sans effet */ } }
export function viderBrouillons() { viderPrecision(); try { sessionStorage.removeItem(CLE_PUBLIC); } catch (e) { /* sans effet */ } }
