// Atelier · catalogue : logique partagée par Services / Service / Options / Option
// (planches ErpServices, ErpService, ErpOptions, ErpOption ; PID F01, F02 : E13 à E16).
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, svg, mot, ecrire, majMot, animer, texte, liste, voir } from '../lib/dom.js';
import { param } from '../lib/params.js';
import { posf, larg } from '../lib/scene.js';
import { creerVie } from '../lib/vie.js';
import { SRV, OPT, CATS0, MODES, ARR, TRANSPORT } from '../../data/catalogue.js';
import { SERVICES } from '../../data/tarifs.js';

const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);

/** Nombre saisi : null si vide, NaN si invalide, sinon le nombre (virgule ou point décimal acceptés). */
const n2 = (v) => {
  const s = String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.');
  if (s === '') return null;
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
};

/** Paramètres de chaque mode de prix : [id, libellé, (liste de choix)]. */
const PARAMS = {
  P1: [['prix', 'Prix (€)']],
  P2: [['prixU', 'Prix par unité (€)'], ['unite', 'Unité', ['heure', 'demi-journée', 'journée']], ['min', 'Minimum facturé (unités)'], ['arr', 'Arrondi', ARR]],
  P3: [['forf', 'Forfait (€)'], ['dInc', 'Durée incluse (h)'], ['pDep', 'Prix du dépassement (€ / h)'], ['arr', 'Arrondi du dépassement', ARR]],
  P4: [['prixU', 'Prix unitaire (€)'], ['qMin', 'Quantité minimum'], ['qMax', 'Quantité maximum'], ['qPas', 'Pas']],
  P5: [['pInc', 'Personnes incluses'], ['pPers', 'Prix par personne (€)']],
  P6: []
};

// Valeurs initiales des champs : dérivées de data/ (prix du simulateur). Les paliers P6 gardent leur structure d'exemple.
const virg2 = (n) => n.toFixed(2).replace('.', ',');
const virg = (n) => String(n).replace('.', ',');
function memInitiale(opt) {
  if (opt) {
    const o = OPT[0];
    return { lib: o.t, desc: 'Album de 20 pages, couverture lin, livré après la sélection des photos.', prix: virg2(Number(o.px.replace(/[^\d,.]/g, ''))), unite: 'heure', arr: 'Aucun', tva: '21' };
  }
  const s = SRV[0];
  return { lib: s.t, desc: 'Cérémonie, portraits et moments forts, avec une galerie en ligne livrée sous 6 semaines.',
    forf: virg2(s.base), dInc: virg(s.incl), pDep: virg2(s.extra), arr: 'À la demi-heure', unite: 'heure', fiche: s.fiche, tva: '21',
    km: 'Aller-retour, lieu le plus loin', seuil: 'Franchise', sKm: String(TRANSPORT.franchiseKm), pKm: virg2(TRANSPORT.prixKm), dlj: '30',
    pde1: '1', pa1: '3', pp1: '180,00', pde2: '4', pa2: '6', pp2: '300,00' };
}
const dossiers = (n) => n + ' dossier' + (n > 1 ? 's' : '');

/** Pose un texte dans un conteneur « .err » : pastille bordeaux + message, ou rien. */
function majErreur(p, message) {
  p.replaceChildren();
  if (message) p.append(el('i', { 'aria-hidden': 'true' }), message);
}

/** Toast : trait coloré + texte. Ne relance son animation que lorsqu'il réapparaît. */
function majToast(p, st) {
  if (!st.toast) { p.hidden = true; return; }
  if (p.hidden) p.hidden = false;
  p.setAttribute('role', st.tErr ? 'alert' : 'status');
  if (!p._trait) { p._trait = el('span', { 'aria-hidden': 'true', style: 'display:block;flex:none;width:20px;height:1px;margin-top:9px' }); p._txt = document.createTextNode(''); p.replaceChildren(p._trait, p._txt); }
  p._trait.style.background = st.tErr ? '#7A1F33' : '#D9783A';
  if (p._txt.nodeValue !== st.toast) p._txt.nodeValue = st.toast;
}

// =========================================================================
//  E13 / E15 — liste
// =========================================================================
export function monterListe({ opt }) {
  const vie = creerVie();
  const at = monterAtelier(opt ? 'options' : 'services', { nDemandes: 2 });
  const { a, H } = at;
  const etat = param('etat', ['Données', 'Chargement', 'Vide'], 'Données');
  const charge = etat === 'Chargement', vide = etat === 'Vide', ok = etat === 'Données';
  const st = { list: (opt ? OPT : SRV).map((x) => ({ ...x })), arch: false, conf: null, toast: null, tErr: false };

  ecrire($('#h1'), opt ? 'Options,' : 'Services,');
  ecrire($('#h2'), italique(opt ? 'ce qui s’ajoute à un service.' : 'ce que vous proposez.'));
  ecrire($('#eye'), '');
  ecrire($('#vide-t'), opt ? 'Aucune option. Créez la première.' : 'Aucun service. Créez le premier.');
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#nouveau'), a.p1); animer($('#l1'), a.l1); animer($('#vide-t'), a.vT);
  for (let i = 0; i < 8; i++) $('#squelettes').append(el('span', { class: 'sk', style: `left:304px;top:${256 + i * 58}px;width:${larg(1072)};height:40px;border-radius:10px` }));

  const arch = $('#arch');
  vie.ecouter(arch, 'click', () => { st.arch = !st.arch; rendre(); });

  function supprimer(k) {
    const it = st.list.find((x) => x.k === k); if (!it) return;
    st.conf = null; st.tErr = false;
    if (it.used > 0) {
      st.list = st.list.map((x) => (x.k === k ? { ...x, arch: true } : x));
      st.toast = opt ? 'Cette option figure dans des dossiers : elle est archivée, pas supprimée.' : 'Ce service figure dans des dossiers : il est archivé, pas supprimé.';
    } else {
      st.list = st.list.filter((x) => x.k !== k);
      st.toast = '« ' + it.t + ' » est supprimé' + (opt ? 'e' : '') + ' définitivement.';
    }
    rendre();
  }

  function creerLigne(r) {
    const lien = el('a', { href: opt ? 'option.html' : 'service.html', class: 'lig sep', style: `left:290px;width:${larg(960)};height:56px` },
      el('span', { style: 'position:absolute;left:14px;top:8px;font:400 15px Inter,sans-serif;white-space:nowrap' }),
      el('span', { class: 'note', style: 'position:absolute;left:14px;top:30px;font-size:12px;white-space:nowrap' }),
      el('span', { style: `position:absolute;left:${posf(300, .2)};top:18px;width:${larg(164, .3)};overflow:hidden;text-overflow:ellipsis;font:400 14px Inter,sans-serif;white-space:nowrap` }),
      el('span', { style: `position:absolute;left:${posf(480, .5)};top:8px;font:400 14px Inter,sans-serif;white-space:nowrap` }),
      el('span', { class: 'note', style: `position:absolute;left:${posf(480, .5)};top:30px;font-size:12px;white-space:nowrap` }),
      el('span', { class: 'etape', style: `position:absolute;left:${posf(870, 1)};top:18px` }, el('i', { 'aria-hidden': 'true' }), document.createTextNode('')));
    const supp = el('button', { type: 'button', class: 'mini doux', style: `position:absolute;left:${posf(1290, 1)};margin-top:19px`, on: { click: () => { st.conf = r.k; st.toast = null; rendre(); } } }, 'Supprimer');
    const oui = el('button', { type: 'button', class: 'mini', style: `position:absolute;left:${posf(1266, 1)};margin-top:8px`, on: { click: () => supprimer(r.k) } }, 'Confirmer');
    const non = el('button', { type: 'button', class: 'mini doux', style: `position:absolute;left:${posf(1266, 1)};margin-top:30px`, on: { click: () => { st.conf = null; rendre(); } } }, 'Garder');
    const w = el('div', { style: 'display:contents' }, lien, supp, oui, non);
    w._r = { lien, supp, oui, non, c: lien.children };
    return w;
  }
  function majLigne(w, r, i) {
    const { lien, supp, oui, non, c } = w._r;
    const y = 248 + i * 58, ac = H(1.5 + i * .06);
    const col = r.arch ? '#4B4D52' : '#0D0E10';
    lien.style.top = y + 'px'; lien.style.color = col; animer(lien, ac);
    lien.setAttribute('aria-label', 'Modifier ' + r.t);
    texte(c[0], r.t);
    texte(c[1], opt ? 'proposée sur ' + r.fiche : (r.fiche ? r.fiche : 'Produit sans fiche technique'));
    texte(c[2], r.cats.length ? r.cats.join(', ') : 'toutes');
    c[2].title = c[2].textContent;   // catégories longues : tronquées par une ellipse, texte complet au survol
    texte(c[3], MODES.find((m) => m[0] === r.mode)[1]);
    texte(c[4], r.px);
    c[5].style.color = col;
    c[5].firstChild.style.background = r.arch ? 'transparent' : '#3AA6B5';
    c[5].firstChild.style.boxShadow = r.arch ? 'inset 0 0 0 1.5px #8C8E93' : 'none';
    texte(c[5].lastChild, r.arch ? 'Archivé' : 'Actif');
    supp.style.top = y + 'px'; animer(supp, ac); supp.setAttribute('aria-label', 'Supprimer ' + r.t);
    oui.style.top = y + 'px'; non.style.top = y + 'px';
    voir(supp, !r.arch && st.conf !== r.k);
    voir(oui, st.conf === r.k); voir(non, st.conf === r.k);
  }

  function rendre() {
    const vis = st.list.filter((r) => st.arch || !r.arch);
    const actifs = st.list.filter((r) => !r.arch).length;
    majMot($('#eye'), opt ? 'Options · ' + actifs + ' actives' : 'Services · ' + actifs + ' actifs');
    arch.setAttribute('aria-checked', st.arch ? 'true' : 'false');
    majToast($('#toast'), st);
    liste($('#rows'), vide ? [] : vis, (r) => r.k, creerLigne, majLigne);
    voir($('#vue-ok'), ok && vis.length > 0);
    voir($('#vue-vide'), vide || (ok && vis.length === 0));
    voir($('#vue-charge'), charge);
  }
  rendre();
  return vie;
}

// =========================================================================
//  E14 / E16 — formulaire
// =========================================================================
export function monterFormulaire({ opt }) {
  const vie = creerVie();
  const at = monterAtelier(opt ? 'option' : 'service', { nDemandes: 2 });
  const { a } = at;
  const tvaRegle = param('tva', ['Réglée', 'Non réglée'], 'Réglée') === 'Réglée';
  const mem = memInitiale(opt);
  const ref = opt ? OPT[0] : SRV[0];
  const sdef = SERVICES.find((s) => s.id === SRV[0].k);
  const st = {
    mode: opt ? 'P1' : ref.mode, cats: ref.cats.slice(), base: 'TVAC', tvaP: false,
    opts: opt ? [] : sdef.opts.slice(), svcs: opt ? SERVICES.filter((s) => s.opts.includes(ref.k)).map((s) => s.id) : [], trp: true, dl: false, pal: [{ k: 1 }, { k: 2 }], pk: 2,
    errs: {}, toast: null, tErr: false, busy: false
  };
  let tempo = null;

  // --- en-tête ---
  ecrire($('#eye'), opt ? 'Catalogue · option · choisie dans ' + dossiers(ref.used) : 'Catalogue · service · utilisé dans ' + dossiers(ref.used));
  ecrire($('#h1'), opt ? 'Modifier l’option' : 'Modifier le service');
  ecrire($('#h2'), italique(ref.t + '.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#retour'), a.sig); animer($('#nt'), a.nt);
  animer($('#col1'), a.p1); animer($('#p2-verre'), a.p2); animer($('#col2'), a.p2);

  // --- mémoire des champs : les rendus ne perdent jamais ce que la personne a saisi ---
  const noter = (e) => { const t = e.target; if (t.dataset && t.dataset.m && t.id) mem[t.id] = t.value; };
  vie.ecouter($('#fond'), 'input', noter);
  vie.ecouter($('#fond'), 'change', noter);
  const remplir = (racine) => racine.querySelectorAll('[data-m]').forEach((n) => { if (n.id) n.value = mem[n.id] == null ? '' : mem[n.id]; });
  remplir(document);

  // --- puces ---
  const puce = (t, on, role, go) => {
    const b = el('button', { type: 'button', class: 'puce', on: { click: go } }, t);
    if (role) b.setAttribute('role', role);
    return b;
  };
  const majPuce = (b, on, role) => {
    b.className = 'puce' + (on ? ' on' : '');
    b.setAttribute(role === 'radio' ? 'aria-checked' : 'aria-pressed', on ? 'true' : 'false');
  };
  const basculer = (tab, k) => (tab.includes(k) ? tab.filter((z) => z !== k) : tab.concat([k]));

  // --- cases à cocher ---
  const aCocher = (id, fn) => vie.ecouter($('#' + id), 'click', fn);
  aCocher('tva-case', () => { st.tvaP = !st.tvaP; st.errs = { ...st.errs, tva: '' }; rendre(); });
  if (!opt) {
    aCocher('trp-case', () => { st.trp = !st.trp; rendre(); });
    aCocher('dl-case', () => { st.dl = !st.dl; rendre(); });
  }
  $('#add-pal').addEventListener('click', () => { st.pal = st.pal.concat([{ k: st.pk + 1 }]); st.pk += 1; rendre(); });
  $('#save').addEventListener('click', () => enregistrer());

  function enregistrer() {
    if (st.busy) return;
    const errs = {};
    if (!(mem.lib || '').trim()) errs.lib = opt ? 'Le libellé de l’option est obligatoire.' : 'Le libellé du service est obligatoire.';
    const miss = [], neg = [];
    if (st.mode === 'P6') {
      if (!st.pal.length) miss.push('au moins un palier');
      st.pal.forEach((p) => ['pde', 'pa', 'pp'].forEach((f) => {
        const v = n2(mem[f + p.k]);
        if (v === null || Number.isNaN(v)) { if (!miss.includes('les bornes et le prix de chaque palier')) miss.push('les bornes et le prix de chaque palier'); } else if (v < 0) neg.push(f);
      }));
    } else {
      PARAMS[st.mode].filter((f) => !f[2]).forEach((f) => {
        const v = n2(mem[f[0]]);
        if (v === null || Number.isNaN(v)) miss.push(f[1].replace(/ \(.*\)$/, '').toLowerCase()); else if (v < 0) neg.push(f[0]);
      });
    }
    if (miss.length) errs.par = 'Le mode de prix choisi demande : ' + miss.join(', ') + '.';
    else if (neg.length) errs.par = 'Un montant ne peut pas être négatif.';
    if (st.tvaP) {
      const t = n2(mem.tva);
      if (t === null || Number.isNaN(t) || t < 0 || t > 100) errs.tva = 'Un taux de TVA est compris entre 0 et 100 %.';
    } else if (!tvaRegle) {
      errs.tva = 'Aucun taux de TVA n’est défini : saisissez le taux général dans les réglages ou un taux propre à ce service.';
    }
    if (Object.keys(errs).length) { st.errs = errs; st.toast = null; rendre(); return; }
    st.errs = {}; st.busy = true; rendre();
    vie.clearTimeout(tempo);
    tempo = vie.timeout(() => { st.busy = false; st.toast = opt ? 'Option enregistrée.' : 'Service enregistré.'; st.tErr = false; rendre(); }, 900);
  }

  // --- rendu ---
  function rendre() {
    const errs = st.errs;
    // erreurs + champs
    majErreur($('#lib-err'), errs.lib); $('#lib').setAttribute('aria-invalid', errs.lib ? 'true' : 'false');
    majErreur($('#par-err'), errs.par);
    majErreur($('#tva-err'), errs.tva); $('#tva').setAttribute('aria-invalid', errs.tva ? 'true' : 'false');
    const parInvalide = errs.par ? 'true' : 'false';

    // modes de prix, bases
    liste($('#modes'), MODES, (m) => m[0], (m) => puce(m[1], false, 'radio', () => { st.mode = m[0]; st.errs = { ...st.errs, par: '' }; rendre(); }), (b, m) => majPuce(b, st.mode === m[0], 'radio'));
    liste($('#bases'), ['HTVA', 'TVAC'], (b) => b, (b) => puce(b, false, 'radio', () => { st.base = b; rendre(); }), (n, b) => majPuce(n, st.base === b, 'radio'));

    // paramètres du mode choisi
    const champs = PARAMS[st.mode];
    liste($('#params'), champs, (f) => f[0], (f) => {
      const lab = el('label', { class: 'mono', for: f[0] }, f[1]);
      let ctl;
      if (f[2]) { ctl = el('select', { id: f[0], 'data-m': '1' }, ...f[2].map((o) => el('option', null, o))); }
      else ctl = el('input', { id: f[0], 'data-m': '1', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-describedby': 'par-err' });
      const d = el('div', { class: 'champ' }, lab, ctl);
      ctl.value = mem[f[0]] == null ? '' : mem[f[0]];
      return d;
    }, (d, f) => { if (!f[2]) d.querySelector('input').setAttribute('aria-invalid', parInvalide); });

    // paliers (P6)
    voir($('#p6'), st.mode === 'P6');
    liste($('#pal'), st.pal, (p) => p.k, (p) => {
      const champ = (id, lab, mode) => { const i = el('input', { id, 'data-m': '1', type: 'text', inputmode: mode, 'aria-label': lab, 'aria-describedby': 'par-err' }); i.value = mem[id] == null ? '' : mem[id]; return i; };
      const croix = el('button', { type: 'button', class: 'ico', 'aria-label': 'Retirer le palier', 'aria-disabled': 'false', style: 'position:relative', on: { click: () => { st.pal = st.pal.filter((q) => q.k !== p.k); rendre(); } } },
        svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, svg('path', { d: 'M7 7 L17 17 M17 7 L7 17' })));
      return el('div', { class: 'champ', style: 'display:grid;grid-template-columns:1fr 1fr 1.4fr 26px;gap:16px;align-items:end' },
        champ('pde' + p.k, 'Palier, de', 'numeric'), champ('pa' + p.k, 'Palier, à', 'numeric'), champ('pp' + p.k, 'Palier, prix', 'decimal'), croix);
    }, (d) => d.querySelectorAll('input').forEach((i) => i.setAttribute('aria-invalid', parInvalide)));

    // TVA propre
    $('#tva-case').setAttribute('aria-checked', st.tvaP ? 'true' : 'false');
    voir($('#tva-bloc'), st.tvaP);

    // colonne de droite
    liste($('#cats'), CATS0, (c) => c, (c) => puce(c, false, null, () => { st.cats = basculer(st.cats, c); rendre(); }), (b, c) => majPuce(b, st.cats.includes(c), 'pressed'));
    if (opt) {
      liste($('#svcs'), SRV.filter((s) => !s.arch), (s) => s.k, (s) => {
        const b = el('button', { type: 'button', class: 'case', role: 'checkbox', style: 'position:relative', on: { click: () => { st.svcs = basculer(st.svcs, s.k); rendre(); } } },
          el('span', { class: 'bx', 'aria-hidden': 'true' }, svg('svg', { viewBox: '0 0 12 12' }, svg('path', { d: 'M2 6.5 L5 9 L10 3' }))), s.t);
        return b;
      }, (b, s) => b.setAttribute('aria-checked', st.svcs.includes(s.k) ? 'true' : 'false'));
    } else {
      liste($('#opts'), OPT.filter((o) => !o.arch), (o) => o.k, (o) => puce(o.t, false, null, () => { st.opts = basculer(st.opts, o.k); rendre(); }), (b, o) => majPuce(b, st.opts.includes(o.k), 'pressed'));
      $('#trp-case').setAttribute('aria-checked', st.trp ? 'true' : 'false');
      voir($('#trp-bloc'), st.trp);
      $('#dl-case').setAttribute('aria-checked', st.dl ? 'true' : 'false');
      voir($('#dl-bloc'), st.dl);
    }

    // bouton Enregistrer (grisé pendant l'enregistrement)
    const bt = $('#save');
    bt.className = st.busy ? 'btn off' : 'btn';
    bt.setAttribute('aria-disabled', st.busy ? 'true' : 'false');
    texte(bt, st.busy ? 'Enregistrement…' : 'Enregistrer');
    $('#enc').style.opacity = st.busy ? '0' : '1';
    majToast($('#toast'), st);
  }
  rendre();
  return vie;
}
