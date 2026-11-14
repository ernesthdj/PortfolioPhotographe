// Atelier · réductions : logique partagée par la liste (E20-B) et le formulaire (E21-B).
// Phrases « Si … alors … sur … » générées depuis les données, évaluation sur un devis d'exemple (moteur de data/tarifs.js),
// validation aux frontières, mémoire de session (rien n'est envoyé).
import { el, animer } from '../lib/dom.js';
import { eurC } from '../lib/format.js';
import { TVA, CATEGORIES, SERVICES, OPTIONS, calculer, r2, service } from '../../data/tarifs.js';
import { REDUCTIONS, NOMS_COURTS, DEVIS_EXEMPLE } from '../../data/reductions.js';

export const COND_TYPES = ['contient', 'nbServices', 'categorie', 'montant', 'dates', 'code', 'parrainage'];
export const EFFET_TYPES = ['pourcentage', 'montant', 'offert'];
export const CIBLE_TYPES = ['dossier', 'service', 'option', 'categorie', 'transport'];
export const CUMULS = ['general', 'oui', 'non'];
/** Clés des services puis des options (le devis les distingue par service(k)). */
export const ITEMS = [...SERVICES.map((s) => s.id), ...Object.keys(OPTIONS)];

export const nomService = (id) => (service(id) ? service(id).t : String(id));
export const nomOption = (k) => NOMS_COURTS[k] || (OPTIONS[k] ? OPTIONS[k][0] : String(k));
export const nomItem = (k) => (service(k) ? service(k).t : nomOption(k));
const nomCategorie = (i) => (CATEGORIES[i] === undefined ? '' : CATEGORIES[i]);

// ---------------------------------------------------------------- nombres et dates
/** Nombre positif saisi (virgule ou point) ; NaN si vide ou invalide. */
export function nombre(v) {
  const s = String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.');
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}
const entier = (v, min, max) => { const n = nombre(v); return Number.isInteger(n) && n >= min && n <= max ? n : NaN; };
const frNb = (n) => String(Number(Number(n).toFixed(2))).replace('.', ',');
const nb = (s) => s.replace(/ /g, ' ');
const eur = (v) => eurC(Math.round(v * 100));
const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
/** 'AAAA-MM-JJ' -> 'JJ/MM/AAAA' ; '' si la chaîne n'a pas cette forme. */
const jour = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
const dateValide = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};

// ---------------------------------------------------------------- phrases
const b = (s) => el('b', null, s);
const joindre = (noms) => noms.map((n, i) => (i === 0 ? [b(n)] : [i === noms.length - 1 ? ' et ' : ', ', b(n)])).flat();

/** Morceau de phrase d'une condition (tableau de nœuds ; les valeurs sont en gras). */
function conditionNoeuds(c) {
  switch (c.type) {
    case 'contient': return ['le devis contient ', ...joindre(c.items.map(nomItem))];
    case 'nbServices': return ['le devis compte ', b(pluriel(c.n, 'service')), ' ou plus'];
    case 'categorie': return ['le devis contient un service de la catégorie ', b(nomCategorie(c.ref))];
    case 'montant': return ['le total HTVA atteint ', b(eur(c.v))];
    case 'dates': return ['le devis compte ', b(pluriel(c.n, 'date') + ' différente' + (c.n > 1 ? 's' : '')), ' ou plus'];
    case 'code': return ['le visiteur saisit ', b(c.code)];
    case 'parrainage': return ['un ', b('code de parrainage valide'), ' est saisi'];
    default: return [];
  }
}
/** Libellé court d'une condition (pastille du formulaire). */
export function conditionCourt(c) {
  switch (c.type) {
    case 'contient': return 'Contient ' + (c.items.length ? c.items.map(nomItem).join(' + ') : '…');
    case 'nbServices': return pluriel(Number(c.n) || 0, 'service') + ' ou plus';
    case 'categorie': return 'Catégorie ' + nomCategorie(c.ref);
    case 'montant': return 'Total HTVA ≥ ' + (nombre(c.v) > 0 ? eur(nombre(c.v)) : '…');
    case 'dates': return (Number(c.n) || 0) + ' dates différentes ou plus';
    case 'code': return 'Code ' + (c.code || '…');
    case 'parrainage': return 'Parrainage valide';
    default: return '';
  }
}
export const LIB_AJOUT = { contient: 'Contient', nbServices: 'Nombre de services', categorie: 'Catégorie', montant: 'Montant total', dates: 'Dates différentes', code: 'Code promo', parrainage: 'Parrainage' };

export function cibleTexte(c) {
  switch (c.type) {
    case 'service': return 'le service ' + nomService(c.ref);
    case 'option': return 'l’option ' + nomOption(c.ref);
    case 'categorie': return 'la catégorie ' + nomCategorie(c.ref);
    case 'transport': return 'le transport';
    default: return 'le dossier';
  }
}
/** « − 10 % », « − 50,00 € » ou « offert ». */
export function effetTexte(e) {
  if (e.type === 'offert') return 'offert';
  return e.type === 'montant' ? nb('− ' + eur(e.valeur)) : nb('− ' + frNb(e.valeur) + ' %');
}
/** Résumé court d'un effet sur sa cible (ligne de l'aperçu). */
export const resumeEffet = (r) => (r.effet.type === 'offert' ? 'offert : ' + cibleTexte(r.cible) : effetTexte(r.effet) + ' sur ' + cibleTexte(r.cible));

/** Phrase de la carte : « Si le devis contient Mariage et Album, alors − 10 % sur le dossier. » (tableau de nœuds) */
export function phraseNoeuds(r) {
  const out = [];
  if (!r.conditions.length) out.push('Dans tous les cas, ');
  r.conditions.forEach((c, i) => out.push(i === 0 ? 'Si ' : ', et si ', ...conditionNoeuds(c)));
  if (r.conditions.length) out.push(', alors ');
  if (r.effet.type === 'offert') out.push(el('i', null, 'offert'), ' : ', b(cibleTexte(r.cible)));
  else out.push(el('i', null, effetTexte(r.effet)), ' sur ', b(cibleTexte(r.cible)));
  out.push('.');
  return out;
}

/** Étiquette de la carte, dérivée des données. */
export function badge(r) {
  if (r.conditions.some((c) => c.type === 'parrainage')) return 'Réservée au parrainage';
  if (r.conditions.some((c) => c.type === 'code')) return 'Code promo';
  return r.suggeree ? 'Suggérée au visiteur' : 'Toujours évaluée';
}
/** Ligne de détail : utilisations, une fois par client, remise maximale, période. */
export function detail(r) {
  const l = r.limites, p = [];
  p.push(r.usages + ' utilisation' + (r.usages > 1 ? 's' : '') + (l.max ? ' sur ' + l.max : ''));
  if (l.parClient) p.push('une fois par client');
  if (l.plafond) p.push('remise limitée à ' + eur(l.plafond));
  p.push(l.du && l.au ? 'du ' + jour(l.du) + ' au ' + jour(l.au) : 'sans date limite');
  return p.join(' · ');
}
export const jaugePct = (r) => (r.limites.max ? Math.min(100, Math.round((r.usages / r.limites.max) * 100)) : 0);
export const jaugeLabel = (r) => (r.limites.max ? r.usages + ' sur ' + r.limites.max + ' utilisations' : (r.usages > 1 ? r.usages + ' utilisations' : r.usages + ' utilisation') + ', sans maximum');

// ---------------------------------------------------------------- mémoire de session (aucune donnée envoyée)
const CLE = 'maquette.reductions';
const copie = (o) => JSON.parse(JSON.stringify(o));

function condValide(c) {
  if (!c || !COND_TYPES.includes(c.type)) return false;
  switch (c.type) {
    case 'contient': return Array.isArray(c.items) && c.items.length > 0 && c.items.every((k) => ITEMS.includes(k));
    case 'nbServices': case 'dates': return Number.isInteger(c.n) && c.n > 0;
    case 'categorie': return Number.isInteger(c.ref) && CATEGORIES[c.ref] !== undefined;
    case 'montant': return Number.isFinite(c.v) && c.v > 0;
    case 'code': return typeof c.code === 'string' && /^[A-Z0-9-]{3,20}$/.test(c.code);
    default: return true;
  }
}
function cibleValide(c) {
  if (!c || !CIBLE_TYPES.includes(c.type)) return false;
  if (c.type === 'service') return !!service(c.ref);
  if (c.type === 'option') return !!OPTIONS[c.ref];
  if (c.type === 'categorie') return Number.isInteger(c.ref) && CATEGORIES[c.ref] !== undefined;
  return true;
}
function reductionValide(r) {
  const l = r && r.limites;
  return !!r && typeof r.id === 'string' && /^[a-z0-9-]+$/.test(r.id) && typeof r.libelle === 'string' && r.libelle.length <= 80
    && Array.isArray(r.conditions) && r.conditions.every(condValide)
    && !!r.effet && EFFET_TYPES.includes(r.effet.type) && (r.effet.type === 'offert' || (Number.isFinite(r.effet.valeur) && r.effet.valeur > 0))
    && cibleValide(r.cible) && !!l && typeof l === 'object' && Number.isInteger(r.usages) && r.usages >= 0
    && CUMULS.includes(r.cumul) && typeof r.suggeree === 'boolean' && typeof r.active === 'boolean';
}

/** Les réductions : celles de la session si elles sont valides, sinon les exemples de data/reductions.js. */
export function charger() {
  try {
    const brut = sessionStorage.getItem(CLE);
    if (brut) {
      const v = JSON.parse(brut);
      if (Array.isArray(v) && v.every(reductionValide)) return v;
    }
  } catch (e) { /* stockage indisponible ou JSON invalide : exemples */ }
  return copie(REDUCTIONS);
}
export function sauver(liste) {
  try { sessionStorage.setItem(CLE, JSON.stringify(liste)); } catch (e) { /* stockage indisponible : sans effet */ }
}
export function nouvelId(liste) {
  let n = 1;
  while (liste.some((r) => r.id === 'reduction-' + n)) n += 1;
  return 'reduction-' + n;
}

// ---------------------------------------------------------------- formulaire : état <-> données, validation
/** État vide d'une nouvelle réduction (champs numériques en texte, comme dans les champs). */
export function etatVide() {
  return { id: null, libelle: '', conds: [], effet: 'pourcentage', valeur: '', cible: { type: 'dossier', ref: null },
    lim: { periode: false, du: '', au: '', max: false, maxV: '', plafond: false, plafondV: '', parClient: false },
    cumul: 'general', suggeree: false, active: true, usages: 0 };
}
export const condVide = (type) => ({ type, items: [], n: type === 'nbServices' || type === 'dates' ? '2' : '', ref: 0, v: '', code: '' });

const txt = (v) => (v == null ? '' : frNb(v));
/** Réduction (données) -> état du formulaire. */
export function etatDepuis(r) {
  const l = r.limites;
  return { id: r.id, libelle: r.libelle,
    conds: r.conditions.map((c) => ({ ...condVide(c.type), items: c.items ? c.items.slice() : [], n: c.n == null ? condVide(c.type).n : String(c.n), ref: c.ref == null ? 0 : c.ref, v: txt(c.v), code: c.code || '' })),
    effet: r.effet.type, valeur: r.effet.type === 'offert' ? '' : txt(r.effet.valeur),
    cible: { type: r.cible.type, ref: r.cible.ref == null ? null : r.cible.ref },
    lim: { periode: !!(l.du && l.au), du: l.du || '', au: l.au || '', max: !!l.max, maxV: txt(l.max), plafond: !!l.plafond, plafondV: txt(l.plafond), parClient: !!l.parClient },
    cumul: r.cumul, suggeree: r.suggeree, active: r.active, usages: r.usages };
}

/**
 * Contrôle aux frontières. Renvoie { errs, r } : `errs` = messages par champ ({ libelle, conds: { type: message }, valeur, cible, periode, max, plafond }),
 * `r` = la réduction (données) construite depuis l'état, utilisable seulement si `errs` est vide.
 */
export function valider(st) {
  const errs = { conds: {} };
  const libelle = st.libelle.trim();
  if (!libelle) errs.libelle = 'Le libellé est obligatoire.';
  else if (libelle.length > 60) errs.libelle = 'Le libellé compte 60 caractères au plus.';
  const conditions = [];
  st.conds.forEach((c) => {
    let d = null;
    switch (c.type) {
      case 'contient': if (!c.items.length) errs.conds[c.type] = 'Choisissez au moins un service ou une option.'; else d = { type: c.type, items: c.items.slice() }; break;
      case 'nbServices': { const n = entier(c.n, 1, 99); if (Number.isNaN(n)) errs.conds[c.type] = 'Indiquez un nombre entier entre 1 et 99.'; else d = { type: c.type, n }; break; }
      case 'dates': { const n = entier(c.n, 2, 99); if (Number.isNaN(n)) errs.conds[c.type] = 'Indiquez un nombre entier entre 2 et 99.'; else d = { type: c.type, n }; break; }
      case 'montant': { const v = nombre(c.v); if (!(v > 0 && v <= 1000000)) errs.conds[c.type] = 'Indiquez un montant positif, en euros.'; else d = { type: c.type, v: r2(v) }; break; }
      case 'code': { const code = c.code.trim().toUpperCase(); if (!/^[A-Z0-9-]{3,20}$/.test(code)) errs.conds[c.type] = 'Le code compte 3 à 20 caractères : lettres, chiffres ou tiret.'; else d = { type: c.type, code }; break; }
      case 'categorie': d = { type: c.type, ref: c.ref }; break;
      default: d = { type: c.type };
    }
    if (d) conditions.push(d);
  });
  let effet = { type: st.effet };
  if (st.effet !== 'offert') {
    const v = nombre(st.valeur);
    if (st.effet === 'pourcentage') { if (!(v > 0 && v <= 100)) errs.valeur = 'Un pourcentage est compris entre 0 et 100 (0 exclu).'; else effet.valeur = v; }
    else if (!(v > 0 && v <= 100000)) errs.valeur = 'Indiquez un montant positif, en euros.';
    else effet.valeur = r2(v);
  }
  const cible = { type: st.cible.type };
  if (['service', 'option', 'categorie'].includes(cible.type)) {
    const ref = st.cible.ref;
    const ok = cible.type === 'service' ? !!service(ref) : cible.type === 'option' ? !!OPTIONS[ref] : Number.isInteger(ref) && CATEGORIES[ref] !== undefined;
    if (!ok) errs.cible = 'Choisissez sur quoi la réduction s’applique.'; else cible.ref = ref;
  } else if (cible.type === 'dossier' && st.effet === 'offert') errs.cible = 'Choisissez ce qui est offert.';
  const l = st.lim, limites = { max: null, du: null, au: null, parClient: l.parClient, plafond: null };
  if (l.periode) {
    if (!dateValide(l.du) || !dateValide(l.au) || l.du > l.au) errs.periode = 'Indiquez les deux dates, la fin n’étant pas avant le début.'; else { limites.du = l.du; limites.au = l.au; }
  }
  if (l.max) { const n = entier(l.maxV, 1, 100000); if (Number.isNaN(n)) errs.max = 'Indiquez un nombre entier entre 1 et 100 000.'; else limites.max = n; }
  if (l.plafond) { const v = nombre(l.plafondV); if (!(v > 0 && v <= 100000)) errs.plafond = 'Indiquez un montant positif, en euros.'; else limites.plafond = r2(v); }
  const r = { id: st.id, libelle, conditions, effet, cible, limites, usages: st.usages, cumul: st.cumul, suggeree: st.suggeree, active: st.active };
  return { errs, r };
}
export const aDesErreurs = (e) => !!(e.libelle || e.valeur || e.cible || e.periode || e.max || e.plafond || Object.keys(e.conds).length);
/** Erreurs qui empêchent de calculer l'aperçu (le libellé, lui, n'y change rien). */
export const bloqueApercu = (e) => !!(e.valeur || e.cible || Object.keys(e.conds).length);

// ---------------------------------------------------------------- aperçu chiffré (moteur de data/tarifs.js)
/**
 * Applique la réduction au devis d'exemple. Les conditions qui dépendent de la saisie du visiteur (code, parrainage) sont supposées remplies.
 * La réduction s'applique sur le HTVA ; la TVA (data/tarifs.js) se calcule après.
 * `r` null : aucune réduction (réduction pas encore complète), le devis seul est affiché.
 * @returns { lignes: [{ t, ht }], remise: number | null, ligneRemise, htApres, tva, ttc, message }
 */
export function apercu(r) {
  const { cfg, dates } = DEVIS_EXEMPLE, c = calculer(cfg), s = service(cfg.sid);
  const sortie = { lignes: c.lignes.map((l) => ({ t: l.t, ht: l.ht || 0 })), remise: null, ligneRemise: '', ht: c.ht };
  const fin = (remise, message) => {
    const htApres = r2(c.ht - (remise || 0)), tva = r2(htApres * TVA);
    return { ...sortie, remise, htApres, tva, ttc: r2(htApres + tva), message };
  };
  if (!r) return fin(null, 'Complétez les conditions, la valeur et la cible pour voir le calcul.');
  const manques = r.conditions.filter((k) => {
    switch (k.type) {
      case 'contient': return !k.items.every((x) => (service(x) ? x === cfg.sid : cfg.opts.includes(x)));
      case 'nbServices': return k.n > 1;
      case 'categorie': return s.cat !== k.ref;
      case 'montant': return c.ht < k.v;
      case 'dates': return dates < k.n;
      default: return false;
    }
  });
  if (manques.length) return fin(null, 'Ce devis d’exemple ne remplit pas : ' + manques.map(conditionCourt).join(' ; ') + '. La réduction ne s’applique pas.');
  const ligne = (o) => c.lignes.filter((l) => l.o === o).reduce((t, l) => t + (l.ht || 0), 0);
  const t = r.cible.type;
  let base = 0;
  if (t === 'dossier') base = c.ht;
  else if (t === 'service') base = r.cible.ref === cfg.sid ? ligne('Service') : 0;
  else if (t === 'categorie') base = s.cat === r.cible.ref ? ligne('Service') : 0;
  else if (t === 'transport') base = ligne('Transport');
  else if (t === 'option') base = c.lignes.filter((l) => l.o === 'Option' && OPTIONS[r.cible.ref] && l.t === OPTIONS[r.cible.ref][0]).reduce((x, l) => x + l.ht, 0);
  if (!(base > 0)) return fin(null, 'La cible (' + cibleTexte(r.cible) + ') ne coûte rien dans ce devis d’exemple : rien à réduire.');
  let remise = r.effet.type === 'pourcentage' ? base * r.effet.valeur / 100 : r.effet.type === 'montant' ? r.effet.valeur : base;
  remise = r2(Math.min(remise, base, r.limites.plafond || Infinity));
  sortie.ligneRemise = (r.libelle || 'Réduction') + ' · ' + resumeEffet(r);
  return fin(remise, 'Réduction appliquée : − ' + eur(remise) + ' sur le HTVA, puis la TVA.');
}

// ---------------------------------------------------------------- animation d'entrée d'un panneau de verre (trait, texte écrit, verre)
/**
 * Panneau « .rp » : le trait du contour se dessine, le texte (.rp-w) s'écrit, le verre (.rp-fond) s'habille, puis le reste (.rp-b).
 * `at` : retour de monterAtelier (rythme atelier). `i` : rang du panneau (décalage).
 */
export function animerPanneau(sec, at, i) {
  const t0 = 1.5 + i * .22;
  animer(sec.querySelector(':scope > .rp-trait rect'), at.DR(t0, 1.4));
  animer(sec.querySelector(':scope > .rp-fond'), at.H(t0 + .3));
  sec.querySelectorAll(':scope > .rp-w').forEach((n, j) => animer(n, at.W(t0 + .55 + j * .2, .8)));
  sec.querySelectorAll(':scope > .rp-b').forEach((n) => animer(n, at.H(t0 + 1)));
}
