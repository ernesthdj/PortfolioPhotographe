// RÉFÉRENCE UNIQUE DES PRIX : celle du simulateur de devis (planche PSimulateur).
// Le simulateur, le catalogue de l'atelier (services, options, catégories) et les montants des dossiers
// en dérivent. Montants en euros HTVA ici ; les dossiers (data/dossiers.js) les convertissent en centimes.
export const TVA = 0.21;

export const CATEGORIES = ['Mariages & couples', 'Familles & fêtes', 'Entreprises & studio'];

/** P3 = forfait + dépassement (demi-heure entamée facturée) ; P4 = quantité. */
export const SERVICES = [
  { id: 'mar', cat: 0, t: 'Mariage', mode: 'P3', base: 250, incl: 2, extra: 60, tech: true, opts: ['album', 'tir', 'sec'] },
  { id: 'eng', cat: 0, t: 'Séance engagement', mode: 'P3', base: 180, incl: 2, extra: 60, tech: true, opts: ['album', 'tir'] },
  { id: 'fam', cat: 1, t: 'Famille lifestyle', mode: 'P3', base: 220, incl: 2, extra: 60, tech: true, opts: ['album', 'tir'] },
  { id: 'ann', cat: 1, t: 'Anniversaire', mode: 'P3', base: 250, incl: 2, extra: 60, tech: true, opts: ['tir'] },
  { id: 'evt', cat: 2, t: 'Événementiel', mode: 'P3', base: 250, incl: 2, extra: 60, tech: true, opts: ['tir'] },
  { id: 'cul', cat: 2, t: 'Culinaire & studio', mode: 'P4', unit: 15, min: 5, max: 40, tech: false, opts: [] }
];
export const OPTIONS = { album: ['Album photo 30×30', 120], tir: ['10 tirages 20×30', 45], sec: ['Second photographe', 300] };

/** Distance depuis le photographe (km), jamais l'adresse de départ. */
export const KM = [44.8, 12.0, 61.3, 30.5, 58.2, 98.6, 109.4];
export const COMMUNES = ['Bruxelles', 'Namur', 'Liège', 'Charleroi', 'Mons', 'Anvers', 'Gand'];
/** Communes reconnues dans une adresse saisie (écran connecté) : les cinq premières ; Anvers et Gand ne se choisissent que par zone. */
export const NB_COMMUNES_ADRESSE = 5;
export const KM_OFFERTS = 25, PRIX_KM = 0.5;
/** Durée d'une prestation facturée à l'heure : minimum 2 h (règle commerciale), maximum 14 h (ruban de la journée). */
export const DUREE_MIN = 2, DUREE_MAX = 14;
/** Distance aller-retour depuis le photographe (km, arrondie au dixième) vers la commune d'indice i. */
export const kmAllerRetour = (i) => Math.round(KM[i] * 2 * 10) / 10;
/** Règle du déplacement telle qu'affichée dans les libellés (« 25 km offerts, 0,50 € / km »), dérivée des constantes. */
const REGLE_KM = () => `${KM_OFFERTS} km offerts, ${PRIX_KM.toFixed(2).replace('.', ',')} € / km`;

export const r2 = (n) => Math.round(n * 100 + 1e-9) / 100;
export const hm = (h) => { const H = Math.floor(h), M = Math.round((h - H) * 60); return M ? `${H} h ${String(M).padStart(2, '0')}` : `${H} h`; };
export const virgule = (n) => String(n.toFixed(1)).replace('.', ',');
export const service = (id) => SERVICES.find((s) => s.id === id);

/**
 * Lignes de prix d'une prestation configurée.
 * cfg : { sid, dur (h) | qty, opts: [clés], lieux: [{ c: indice de commune (-1 = à préciser), h }] }
 */
export function calculer(cfg) {
  const s = service(cfg.sid), out = []; let manque = false;
  if (s.mode === 'P3') {
    const over = Math.max(0, cfg.dur - s.incl), bill = Math.ceil(over * 2 - 1e-9) / 2;
    out.push({ o: 'Service', t: `${s.t} · ${hm(cfg.dur)}`, ht: r2(s.base + bill * s.extra), act: true,
      sub: bill > 0 ? `${hm(s.incl)} incluses, ${hm(over)} en plus${bill - over > 1e-9 ? `, facturées ${hm(bill)}` : ''} à ${s.extra} € / h` : `forfait, ${hm(s.incl)} incluses` });
  } else {
    out.push({ o: 'Service', t: `${s.t} · ${cfg.qty} plats`, ht: r2(cfg.qty * s.unit), act: true, sub: `${s.unit},00 € par plat` });
  }
  cfg.opts.forEach((k) => out.push({ o: 'Option', t: OPTIONS[k][0], ht: OPTIONS[k][1] }));
  if (s.tech) {
    if (cfg.lieux.length && cfg.lieux.every((z) => z.c === -3)) {
      // page publique, sans compte : jamais d'adresse exacte, seulement une ZONE (déplacement estimé)
      if (cfg.zone >= 0) {
        const km = kmAllerRetour(cfg.zone), fee = r2(Math.max(0, km - KM_OFFERTS) * PRIX_KM);
        out.push({ o: 'Transport', t: `Déplacement estimé · zone ${COMMUNES[cfg.zone]}`, ht: fee,
          sub: fee > 0 ? `environ ${virgule(km)} km aller-retour, ${REGLE_KM()}` : 'Déplacement offert' });
      }
    } else if (cfg.lieux.some((z) => z.c === -1)) { manque = true; out.push({ o: 'Transport', t: 'Départ photographe → lieu à préciser', ht: null }); }
    else if (!cfg.lieux.some((z) => z.c >= 0)) {
      // adresses saisies hors communes connues : 0,00 €, distance confirmée par le photographe
      out.push({ o: 'Transport', t: 'Départ photographe → adresse saisie', ht: 0, sub: 'distance confirmée par le photographe' });
    } else {
      const tri = cfg.lieux.slice().sort((a, b) => a.h - b.h);
      let loin = tri.find((z) => z.c >= 0); tri.forEach((z) => { if (z.c >= 0 && KM[z.c] > KM[loin.c]) loin = z; });
      const km = kmAllerRetour(loin.c), fee = r2(Math.max(0, km - KM_OFFERTS) * PRIX_KM);
      out.push({ o: 'Transport', t: `Départ photographe → ${COMMUNES[loin.c]} : ${virgule(KM[loin.c])} km`, ht: fee,
        sub: fee > 0 ? `aller-retour ${virgule(km)} km, ${REGLE_KM()}` : 'Déplacement offert' });
    }
  }
  return { s, lignes: out, manque, ht: r2(out.reduce((t, l) => t + (l.ht || 0), 0)) };
}

/** Total d'un devis exprimé en centimes (HTVA, TVA 21 %, TVAC) pour un cfg. */
export function totalCentimes(cfg) {
  const ht = Math.round(calculer(cfg).ht * 100), tva = Math.round(ht * TVA);
  return { ht, tva, ttc: ht + tva };
}

/**
 * Reconnaît la commune d'une adresse saisie (nom ou code postal) : indice dans COMMUNES,
 * -1 si l'adresse est vide, -2 si elle n'est pas reconnue (distance à confirmer par le photographe).
 * Aucune requête : tout se calcule sur place.
 */
export function ville(v) {
  const s = String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!s.trim()) return -1;
  const M = [[/bruxelles|brussel|\b1\d{3}\b/, 0], [/namur|\b5\d{3}\b/, 1], [/liege|\b4\d{3}\b/, 2], [/charleroi|\b6\d{3}\b/, 3], [/mons|\b7\d{3}\b/, 4]];
  for (const [re, i] of M) if (re.test(s)) return i;
  return -2;
}
