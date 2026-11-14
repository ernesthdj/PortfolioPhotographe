// Atelier · E21 Réduction (formulaire, variante B « constructeur Si… alors… »). Traduit E21-form-B.dc.html.
// Trois colonnes (quand / alors / sur quoi), aperçu chiffré calculé par le moteur de data/tarifs.js, limites, cumul et visibilité.
// Rien n'est envoyé : « Enregistrer » valide, garde la réduction en sessionStorage puis retourne à la liste.
import { monterAtelier } from '../lib/atelier-shell.js';
import { aller } from '../lib/routeur.js';
import { $, el, ecrire, animer, texte, liste, voir } from '../lib/dom.js';
import { creerVie } from '../lib/vie.js';
import { param } from '../lib/params.js';
import { eurC } from '../lib/format.js';
import { TVA, SERVICES, OPTIONS, CATEGORIES } from '../../data/tarifs.js';
import {
  COND_TYPES, ITEMS, LIB_AJOUT, nomItem, nomOption, conditionCourt, condVide, etatVide, etatDepuis, valider, aDesErreurs, bloqueApercu,
  apercu, charger, sauver, nouvelId, animerPanneau
} from './atelier-reductions-logique.js';

const EFFETS = [['pourcentage', 'Pourcentage'], ['montant', 'Montant fixe'], ['offert', 'Élément offert']];
const CIBLES = [['dossier', 'Le dossier entier'], ['service', 'Un service'], ['option', 'Une option'], ['categorie', 'Une catégorie'], ['transport', 'Le transport']];
const LIMITES = [['periode', 'Période de validité'], ['max', 'Utilisations maximum'], ['plafond', 'Remise maximale'], ['parClient', 'Une fois par client']];
const QUESTION = { service: 'Quel service ?', option: 'Quelle option ?', categorie: 'Quelle catégorie ?' };
const eur = (v) => eurC(Math.round(v * 100));

let vie = null;

/** Pastille bordeaux + message dans un conteneur « .err » (ne touche pas au DOM si le message ne change pas). */
function poserErreur(p, message) {
  const m = message || '';
  if (p._m === m) return;
  p._m = m;
  p.replaceChildren();
  if (m) p.append(el('i', { 'aria-hidden': 'true' }), m);
}

/** Référence par défaut d'une cible qui en demande une. */
function refParDefaut(type) {
  if (type === 'service') return SERVICES[0].id;
  if (type === 'option') return Object.keys(OPTIONS)[0];
  return type === 'categorie' ? 0 : null;
}

export function init() {
  vie = creerVie();
  const at = monterAtelier('reduction', { nDemandes: 2 });
  const { a } = at;
  const items = charger();
  const id = param('id', items.map((r) => r.id), null);
  const existante = id ? items.find((r) => r.id === id) : null;
  const st = existante ? etatDepuis(existante) : etatVide();
  let tente = false, occupe = false;

  // --- en-tête ---
  ecrire($('#eye'), existante ? 'Catalogue · réductions · modifier' : 'Catalogue · réductions · nouvelle');
  ecrire($('#h1'), 'Une réduction,');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, 'en trois temps.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#retour'), a.sig); animer($('#enc'), a.p1); animer($('#save'), a.p1); animer($('#champ-lib'), a.nt);
  document.querySelectorAll('#zone .rp').forEach((sec, i) => animerPanneau(sec, at, i));

  // --- champs fixes : valeurs de départ et écouteurs ---
  const lib = $('#lib'), val = $('#val'), ref = $('#ref');
  lib.value = st.libelle; val.value = st.valeur;
  $('#lim-du').value = st.lim.du; $('#lim-au').value = st.lim.au; $('#lim-max').value = st.lim.maxV; $('#lim-plafond').value = st.lim.plafondV;
  const saisie = (n, fn) => n.addEventListener('input', () => { fn(n.value); rendre(); });
  saisie(lib, (v) => { st.libelle = v; });
  saisie(val, (v) => { st.valeur = v; });
  saisie($('#lim-du'), (v) => { st.lim.du = v; });
  saisie($('#lim-au'), (v) => { st.lim.au = v; });
  saisie($('#lim-max'), (v) => { st.lim.maxV = v; });
  saisie($('#lim-plafond'), (v) => { st.lim.plafondV = v; });
  ref.addEventListener('change', () => { st.cible.ref = st.cible.type === 'categorie' ? Number(ref.value) : ref.value; rendre(); });
  $('#cumul').addEventListener('change', (e) => { st.cumul = e.target.value; rendre(); });
  $('#sug').addEventListener('change', (e) => { st.suggeree = e.target.checked; rendre(); });
  $('#act').addEventListener('change', (e) => { st.active = e.target.checked; rendre(); });
  $('#save').addEventListener('click', enregistrer);

  // --- puces ---
  const puce = (t, clic, classe) => el('button', { type: 'button', class: classe || 'puce', 'aria-pressed': 'false', on: { click: clic } }, t);
  const majPuce = (b, on) => { b.className = 'puce' + (on ? ' on' : ''); b.setAttribute('aria-pressed', on ? 'true' : 'false'); };

  // --- 1 · Quand : conditions ---
  function ajouterCond(type) {
    st.conds.push(condVide(type));
    rendre();
    const w = $('#conds')._reg.get(type);
    if (w) (w._c.ed ? w._c.ed.focus : () => w._c.chip.focus())();
  }
  function retirerCond(type) {
    st.conds = st.conds.filter((c) => c.type !== type);
    rendre();
    const b = $('#ajout')._reg.get(type);
    if (b) b.focus();
  }
  /** Champ de saisie d'une condition : met à jour l'état puis tout l'écran. */
  function champCond(c, cle, label, attrs) {
    const idc = 'c-' + c.type;
    const inp = el('input', { id: idc, type: 'text', autocomplete: 'off', 'aria-invalid': 'false', 'aria-describedby': 'cond-err-' + c.type, ...attrs });
    inp.value = c[cle];
    inp.addEventListener('input', () => { c[cle] = cle === 'code' ? inp.value.toUpperCase() : inp.value; rendre(); });
    return { noeud: el('div', { class: 'champ' }, el('label', { class: 'mono', for: idc }, label), inp), focus: () => inp.focus(),
      maj: (msg) => { if (inp.value !== c[cle]) inp.value = c[cle]; inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); } };
  }
  function editeur(c) {
    switch (c.type) {
      case 'contient': {
        const flux = el('div', { class: 'flux', role: 'group', 'aria-label': 'Services et options que le devis doit contenir' });
        const bs = ITEMS.map((k) => puce(nomItem(k), () => { c.items = c.items.includes(k) ? c.items.filter((x) => x !== k) : c.items.concat([k]); rendre(); }));
        flux.append(...bs);
        return { noeud: flux, focus: () => bs[0].focus(), maj: () => bs.forEach((b, i) => majPuce(b, c.items.includes(ITEMS[i]))) };
      }
      case 'nbServices': return champCond(c, 'n', 'Au moins … services', { inputmode: 'numeric', maxlength: '2' });
      case 'dates': return champCond(c, 'n', 'Au moins … dates différentes', { inputmode: 'numeric', maxlength: '2' });
      case 'montant': return champCond(c, 'v', 'Total HTVA d’au moins (€)', { inputmode: 'decimal', maxlength: '9' });
      case 'code': return champCond(c, 'code', 'Code saisi par le visiteur', { maxlength: '20', autocapitalize: 'characters', spellcheck: 'false' });
      case 'categorie': {
        const idc = 'c-' + c.type;
        const sel = el('select', { id: idc }, ...CATEGORIES.map((n, i) => el('option', { value: String(i) }, n)));
        sel.value = String(c.ref);
        sel.addEventListener('change', () => { c.ref = Number(sel.value); rendre(); });
        return { noeud: el('div', { class: 'champ' }, el('label', { class: 'mono', for: idc }, 'Catégorie du service'), sel), focus: () => sel.focus(), maj: () => { sel.value = String(c.ref); } };
      }
      default: return null;
    }
  }
  function creerCond(c) {
    const lbl = el('span');
    const chip = el('button', { type: 'button', class: 'puce on', on: { click: () => retirerCond(c.type) } }, lbl, el('span', { 'aria-hidden': 'true' }, '✕'));
    const ed = editeur(c);
    const err = el('p', { class: 'err', role: 'alert', id: 'cond-err-' + c.type });
    const w = el('div', { class: 'rz-cond' }, chip, ed ? ed.noeud : null, err);
    w._c = { lbl, chip, ed, err };
    return w;
  }
  function majCond(w, c, msg) {
    const x = w._c, court = conditionCourt(c);
    texte(x.lbl, court);
    x.chip.setAttribute('aria-label', 'Retirer la condition : ' + court);
    if (x.ed) x.ed.maj(msg);
    poserErreur(x.err, msg);
  }

  // --- 2 · Alors : effet ---
  function choisirEffet(k) {
    st.effet = k;
    // un élément offert est un service, une option ou le transport : jamais « tout le dossier » ni une catégorie
    if (k === 'offert' && ['dossier', 'categorie'].includes(st.cible.type)) st.cible = { type: 'option', ref: refParDefaut('option') };
    rendre();
  }

  // --- 3 · Sur quoi : cible ---
  function choisirCible(type) {
    if (st.cible.type !== type) st.cible = { type, ref: refParDefaut(type) };
    rendre();
  }
  function remplirRef(type) {
    if (ref._type === type) return;
    ref._type = type;
    const opts = type === 'service' ? SERVICES.map((s) => [s.id, s.t]) : type === 'option' ? Object.keys(OPTIONS).map((k) => [k, nomOption(k)]) : CATEGORIES.map((n, i) => [String(i), n]);
    ref.replaceChildren(...opts.map(([v, t]) => el('option', { value: v }, t)));
  }

  // --- limites : une pastille à enclencher, avec son champ ---
  function basculerLimite(k) { st.lim[k] = !st.lim[k]; rendre(); }

  // --- aperçu chiffré ---
  function ligne(t, v, classe, point) {
    return el('div', { class: 'rl' + (classe ? ' ' + classe : '') }, el('span', null, point ? el('i', { 'aria-hidden': 'true' }) : null, t), el('span', null, v));
  }
  function rendreApercu(r) {
    const res = apercu(r);
    const rows = res.lignes.map((l) => ligne(l.t, eur(l.ht)));
    if (res.remise) rows.push(ligne(res.ligneRemise, '− ' + eur(res.remise), '', true));
    rows.push(ligne('Total HTVA', eur(res.htApres), 'tot'));
    rows.push(ligne('TVA ' + Math.round(TVA * 100) + ' %', eur(res.tva), 'doux'));
    rows.push(ligne('Total TVAC', eur(res.ttc), 'tot'));
    $('#ap').replaceChildren(...rows);
    texte($('#ap-msg'), res.message);
  }

  // --- rendu : tout l'écran depuis `st` (mises à jour par clés : les nœuds et leurs animations ne sont pas recréés) ---
  function rendre() {
    const { errs, r } = valider(st);
    const aff = tente ? errs : { conds: {} };
    lib.setAttribute('aria-invalid', aff.libelle ? 'true' : 'false');
    poserErreur($('#lib-err'), aff.libelle);

    liste($('#conds'), st.conds, (c) => c.type, creerCond, (w, c) => majCond(w, c, aff.conds[c.type]));
    voir($('#conds-vide'), st.conds.length === 0);
    liste($('#ajout'), COND_TYPES.filter((t) => !st.conds.some((c) => c.type === t)), (t) => t,
      (t) => puce('+ ' + LIB_AJOUT[t], () => ajouterCond(t), 'puce ajout'), () => {});

    liste($('#types'), EFFETS, (e) => e[0], (e) => puce(e[1], () => choisirEffet(e[0])), (b, e) => majPuce(b, st.effet === e[0]));
    const offert = st.effet === 'offert', pct = st.effet === 'pourcentage';
    voir($('#val-bloc'), !offert); voir($('#val-offert'), offert);
    if (val.value !== st.valeur) val.value = st.valeur;
    val.setAttribute('maxlength', pct ? '6' : '9');
    val.style.width = Math.max(3, st.valeur.length + 1) + 'ch';
    val.setAttribute('aria-label', pct ? 'Pourcentage de réduction, de 0 à 100' : 'Montant de la réduction, en euros');
    val.setAttribute('aria-invalid', aff.valeur ? 'true' : 'false');
    texte($('#val-u'), pct ? '%' : '€');
    texte($('#val-note'), pct ? 'Compris entre 0 et 100.' : 'Montant positif, en euros.');
    poserErreur($('#val-err'), aff.valeur);

    liste($('#cibles'), CIBLES, (c) => c[0], (c) => puce(c[1], () => choisirCible(c[0])), (b, c) => {
      majPuce(b, st.cible.type === c[0]);
      b.disabled = offert && ['dossier', 'categorie'].includes(c[0]);
      if (b.disabled) b.title = 'Un élément offert est un service, une option ou le transport.'; else b.removeAttribute('title');
    });
    const avecRef = ['service', 'option', 'categorie'].includes(st.cible.type);
    voir($('#ref-bloc'), avecRef);
    if (avecRef) {
      remplirRef(st.cible.type);
      texte($('#ref-l'), QUESTION[st.cible.type]);
      if (ref.value !== String(st.cible.ref)) ref.value = String(st.cible.ref);
    }
    ref.setAttribute('aria-invalid', aff.cible ? 'true' : 'false');
    poserErreur($('#cible-err'), aff.cible);

    liste($('#lims'), LIMITES, (l) => l[0], (l) => puce(l[1], () => basculerLimite(l[0])), (b, l) => { majPuce(b, st.lim[l[0]]); texte(b, (st.lim[l[0]] ? '' : '+ ') + l[1]); });
    voir($('#b-periode'), st.lim.periode); voir($('#b-periode2'), st.lim.periode); voir($('#b-max'), st.lim.max); voir($('#b-plafond'), st.lim.plafond);
    const inv = (sel, m) => $(sel).setAttribute('aria-invalid', m ? 'true' : 'false');
    inv('#lim-du', aff.periode); inv('#lim-au', aff.periode); inv('#lim-max', aff.max); inv('#lim-plafond', aff.plafond);
    poserErreur($('#periode-err'), aff.periode); poserErreur($('#max-err'), aff.max); poserErreur($('#plafond-err'), aff.plafond);

    if ($('#cumul').value !== st.cumul) $('#cumul').value = st.cumul;
    $('#sug').checked = st.suggeree; $('#act').checked = st.active;

    rendreApercu(bloqueApercu(errs) ? null : r);

    const bt = $('#save');
    bt.className = occupe ? 'btn off' : 'btn';
    bt.setAttribute('aria-disabled', occupe ? 'true' : 'false');
    texte(bt, occupe ? 'Enregistrement…' : 'Enregistrer');
    $('#enc').style.opacity = occupe ? '0' : '1';
    if (tente && aDesErreurs(errs)) message('Corrigez les champs signalés.'); else message(null);
  }

  function message(m) {
    const p = $('#toast');
    if (p._m === (m || '')) return;
    p._m = m || '';
    p.replaceChildren();
    p.hidden = !m;
    if (m) p.append(el('span', { 'aria-hidden': 'true', style: 'display:block;flex:none;width:20px;height:1px;margin-top:9px;background:#7A1F33' }), m);
  }

  function premierInvalide(errs) {
    if (errs.libelle) return lib;
    const t = COND_TYPES.find((k) => errs.conds[k]);
    if (t) { const w = $('#conds')._reg.get(t); return w && (w._c.ed ? { focus: w._c.ed.focus } : w._c.chip); }
    if (errs.valeur) return val;
    if (errs.cible) return $('#ref-bloc').hidden ? $('#cibles').querySelector('button:not(:disabled)') : ref;
    if (errs.periode) return $('#lim-du');
    if (errs.max) return $('#lim-max');
    return errs.plafond ? $('#lim-plafond') : null;
  }

  function enregistrer() {
    if (occupe) return;
    tente = true;
    const { errs, r } = valider(st);
    rendre();
    if (aDesErreurs(errs)) { const n = premierInvalide(errs); if (n) n.focus({ preventScroll: false }); return; }
    occupe = true;
    r.id = st.id || nouvelId(items);
    const k = items.findIndex((x) => x.id === r.id);
    if (k >= 0) items[k] = r; else items.push(r);
    sauver(items);
    rendre();
    // le routeur attend une adresse absolue
    Promise.resolve(aller(new URL('reductions.html', window.location.href).href)).catch(() => { occupe = false; rendre(); });
  }

  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
