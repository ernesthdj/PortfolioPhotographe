// Atelier · E17 Catégories (UC01.6) : ajout, renommage en place, suppression confirmée en ligne.
// Traduit ErpCategories.dc.html.
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, animer, liste, texte, voir } from '../lib/dom.js';
import { CAT_L } from '../../data/catalogue.js';
import { monterToast, majErr, invalide, resumeCategorie } from './atelier-catalogue2-logique.js';
import { creerVie } from '../lib/vie.js';

let vie = null;

export function init(racine) {
  vie = creerVie();
  const { a, H } = monterAtelier('categories');

  // ------------------------------------------------------------------ en-tête
  const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);
  ecrire($('#eye'), 'Catalogue · catégories');
  ecrire($('#h1'), 'Catégories,');
  ecrire($('#h2'), italique('pour ranger et pour cibler.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#ncat-champ'), a.sig); animer($('#ajouter-bloc'), a.sig);
  animer($('#aide-verre'), a.p2); animer($('#aide'), a.p2);

  // ------------------------------------------------------------------ état
  // src : nom d'origine, d'où se calculent les compteurs (services / options du catalogue).
  const st = {
    cats: CAT_L.map((c) => ({ k: c.k, t: c.t, src: c.t, red: c.red || null, neuf: false })),
    n: CAT_L.length, edit: null, conf: null, errN: '', errR: ''
  };
  const toast = monterToast(racine, { left: 304, top: 708, width: 'calc(576px + var(--dx))' });
  const champ = $('#ncat');

  const existe = (t, sauf) => st.cats.some((c) => c.k !== sauf && c.t.toLowerCase() === t.toLowerCase());
  const sousTitre = (c) => (c.neuf ? 'aucun service pour l’instant' : resumeCategorie(c.src)) + (c.red ? ' · réduction « ' + c.red + ' »' : '');

  // ------------------------------------------------------------------ actions
  function ajouter() {
    const t = champ.value.trim();
    if (!t) { st.errN = 'Le libellé de la catégorie est obligatoire.'; return rendre(); }
    if (existe(t)) { st.errN = 'Cette catégorie existe déjà.'; return rendre(); }
    champ.value = '';
    st.n += 1; st.errN = '';
    st.cats.push({ k: 'c' + st.n, t, src: t, red: null, neuf: true });
    toast.montrer('Catégorie « ' + t + ' » ajoutée.');
    rendre();
  }
  function renommer(k) {
    st.edit = k; st.errR = ''; st.conf = null; rendre();
    const c = st.cats.find((x) => x.k === k), inp = $('#ren-' + k);
    inp.value = c.t; inp.focus();
  }
  function validerRenommage() {
    const k = st.edit, t = $('#ren-' + k).value.trim();
    if (!t) { st.errR = 'Le libellé de la catégorie est obligatoire.'; return rendre(); }
    if (existe(t, k)) { st.errR = 'Cette catégorie existe déjà.'; return rendre(); }
    st.cats.find((c) => c.k === k).t = t;
    st.edit = null; st.errR = '';
    toast.montrer('Catégorie renommée en « ' + t + ' ».');
    rendre();
  }
  function supprimer(k) {
    const c = st.cats.find((x) => x.k === k);
    st.conf = null;
    if (c.red) { toast.montrer('Cette catégorie est utilisée par une réduction : retirez-la de la réduction d’abord.', true); return rendre(); }
    st.cats = st.cats.filter((x) => x.k !== k);
    toast.montrer('Catégorie « ' + c.t + ' » supprimée.');
    rendre();
  }

  // ------------------------------------------------------------------ une ligne (lecture / édition / confirmation)
  function creerLigne(c) {
    const k = c.k;
    const ligne = el('div', { class: 'sep', style: 'position:absolute;left:304px;width:calc(576px + var(--dx));height:52px' });
    const lire = el('div', null,
      el('span', { class: 'titre', style: 'position:absolute;left:0;top:4px;font:400 16px Inter,sans-serif' }),
      el('span', { class: 'note sous', style: 'position:absolute;left:0;top:27px;font-size:12.5px;white-space:nowrap' }),
      el('button', { type: 'button', class: 'mini ren', style: 'position:absolute;right:96px;top:14px', on: { click: () => renommer(k) } }, 'Renommer'),
      el('button', { type: 'button', class: 'mini doux sup', style: 'position:absolute;right:0;top:14px', on: { click: () => { st.conf = k; st.edit = null; toast.cacher(); rendre(); } } }, 'Supprimer'));
    const inp = el('input', { id: 'ren-' + k, type: 'text', autocomplete: 'off', 'aria-label': 'Nouveau libellé', 'aria-invalid': 'false', 'aria-describedby': 'ren-err-' + k, });
    const erreur = el('p', { id: 'ren-err-' + k, class: 'err', role: 'alert', style: 'margin:0;min-height:0;font-size:12px' });
    const edit = el('div', null,
      el('div', { class: 'champ', style: 'position:absolute;left:0;top:-6px;width:300px' }, inp),
      el('div', { style: 'position:absolute;left:0;top:30px;width:380px' }, erreur),
      el('button', { type: 'button', class: 'mini', style: 'position:absolute;right:96px;top:14px', on: { click: validerRenommage } }, 'Enregistrer'),
      el('button', { type: 'button', class: 'mini doux', style: 'position:absolute;right:0;top:14px', on: { click: () => { st.edit = null; st.errR = ''; rendre(); } } }, 'Annuler'));
    const conf = el('div', null,
      el('span', { class: 'titre', style: 'position:absolute;left:0;top:4px;font:400 16px Inter,sans-serif' }),
      el('span', { class: 'note', style: 'position:absolute;left:0;top:27px;font-size:12.5px' }, 'Supprimer cette catégorie ?'),
      el('button', { type: 'button', class: 'mini', style: 'position:absolute;right:96px;top:14px', on: { click: () => supprimer(k) } }, 'Supprimer'),
      el('button', { type: 'button', class: 'mini doux', style: 'position:absolute;right:0;top:14px', on: { click: () => { st.conf = null; rendre(); } } }, 'Garder'));
    ligne.append(lire, edit, conf);
    ligne._v = { lire, edit, conf, inp, erreur };
    return ligne;
  }
  function majLigne(ligne, c, i) {
    const { lire, edit, conf, inp, erreur } = ligne._v;
    ligne.style.top = (262 + i * 58) + 'px';
    animer(ligne, H(1.5 + i * .06));
    const enEdition = st.edit === c.k, enConf = st.conf === c.k;
    voir(lire, !enEdition && !enConf); voir(edit, enEdition); voir(conf, enConf);
    ligne.querySelectorAll('.titre').forEach((n) => texte(n, c.t));
    texte(lire.querySelector('.sous'), sousTitre(c));
    lire.querySelector('.ren').setAttribute('aria-label', 'Renommer ' + c.t);
    lire.querySelector('.sup').setAttribute('aria-label', 'Supprimer ' + c.t);
    if (enEdition) { majErr(erreur, st.errR); invalide(inp, !!st.errR); }
  }

  function rendre() {
    liste($('#lignes'), st.cats, (c) => c.k, creerLigne, majLigne);
    majErr($('#ncat-err'), st.errN); invalide(champ, !!st.errN);
  }

  $('#ajouter').addEventListener('click', ajouter);
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
