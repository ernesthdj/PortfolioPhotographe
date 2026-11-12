// Atelier · E25 Clients (liste) + E26.a panneau « Nouveau client ». Traduit ErpClients.dc.html.
// Paramètres d'URL : ?etat=Données|Chargement|Vide  ?panneau=Aucun|Nouveau client  ?ombre=…
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, svg, ecrire, animer, liste, voir, texte } from '../lib/dom.js';
import { creerVie } from '../lib/vie.js';
import { param } from '../lib/params.js';
import { eurC } from '../lib/format.js';
import { CLIENTS, ORIGINES, ETIQUETTES, resumeDossiers } from '../../data/clients.js';
import { PAGE, CATALOGUE_DEVIS, ttc, totalDevis, filtrerClients, validerNouveauClient, resultatCreation, majPuces, poserErreur } from './atelier-clients-logique.js';

export function init() {
  const atelier = monterAtelier('clients');
  const { a, E, H } = atelier;
    vie = creerVie();
    const scene = document.getElementById('scene');
    // le panneau vit hors de #fond (que son ouverture résorbe) : il est déplacé dans la scène, et retiré à destroy()
    const panneau = $('#panneau'); scene.append(panneau); vie.noeud(panneau);
  // Cette planche n'a que trois états (pas d'« Erreur »).
  const etat = atelier.etat === 'Erreur' ? 'Données' : atelier.etat;
  const charge = etat === 'Chargement', vide = etat === 'Vide';

  // ------------------------------------------------------------------ état de la planche
  const st = { ty: 'tous', tag: null, org: null, q: '', pg: 0, pan: 'off', ph: 'form', cl: false, n: 0, lignes: [], errE: '', errN: '', errL: '', res: null };

  // ------------------------------------------------------------------ en-tête (statique)
  const nCli = CLIENTS.filter((c) => c.ty === 'client').length, nPro = CLIENTS.length - nCli;
  ecrire($('#eye'), 'Clients · ' + nCli + ' clients · ' + nPro + ' prospects');
  ecrire($('#h1'), 'Clients et prospects,');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, 'qui vous écrit, qui signe.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#nouveau'), a.p1);
  animer($('#champ-q'), a.sig); animer($('#rechercher'), a.sig);
  ['#f-type', '#g-tags', '#g-orgs'].forEach((s) => animer($(s), a.nt));
  animer($('#l1'), a.l1);

  // ------------------------------------------------------------------ liste
  const SKS = Array.from({ length: 8 }, (_, i) => ({ l: 304, t: 350 + i * 50, w: 1072, h: 34, r: 10 }));
  SKS.forEach((s) => $('#squelettes').append(el('span', { class: 'sk', style: `left:${s.l}px;top:${s.t}px;width:calc(${s.w}px + var(--dx));height:${s.h}px;border-radius:${s.r}px` })));

  function creerLigne(c, i) {
    const l = el('a', { href: 'client.html', class: 'lig sep', style: 'left:290px;width:calc(1100px + var(--dx));height:48px' },
      el('span', { style: 'position:absolute;left:14px;top:5px;font:400 15px Inter,sans-serif;white-space:nowrap', 'data-c': 'nom' }),
      el('span', { class: 'note', style: 'position:absolute;left:14px;top:25px;font-size:12px;line-height:1.4;white-space:nowrap', 'data-c': 'mail' }),
      el('span', { class: 'etape', style: 'position:absolute;left:calc(330px + var(--dx) * .25);top:15px' }, el('i', { 'aria-hidden': 'true', 'data-c': 'pt' }), el('span', { 'data-c': 'ty' })),
      el('span', { style: 'position:absolute;left:calc(470px + var(--dx) * .4);top:14px;font:400 14px Inter,sans-serif;white-space:nowrap', 'data-c': 'org' }),
      el('span', { class: 'note', style: 'position:absolute;left:calc(640px + var(--dx) * .55);top:15px;font-size:13px;white-space:nowrap', 'data-c': 'tags' }),
      el('span', { class: 'note', style: 'position:absolute;left:calc(830px + var(--dx) * .75);top:15px;font-size:13px;white-space:nowrap', 'data-c': 'info' }),
      el('span', { class: 'note', style: 'position:absolute;right:24px;top:15px;font-size:13px', 'data-c': 'act' }));
    l.style.animation = H(1.5 + i * .06);
    return l;
  }
  function majLigne(l, c, i) {
    const f = (k) => l.querySelector(`[data-c="${k}"]`);
    l.style.top = (344 + i * 50) + 'px';
    texte(f('nom'), c.nom); texte(f('mail'), c.mail); texte(f('ty'), c.ty === 'client' ? 'Client' : 'Prospect');
    const pt = f('pt');
    pt.style.background = c.ty === 'client' ? '#0D0E10' : 'transparent';
    pt.style.boxShadow = c.ty === 'client' ? 'none' : 'inset 0 0 0 1.5px #3AA6B5';
    texte(f('org'), c.org); texte(f('tags'), c.tags.join(', ') || '—'); texte(f('info'), resumeDossiers(c)); texte(f('act'), c.act);
    l.setAttribute('aria-label', c.nom + ', ' + c.ty + ', ' + c.mail + ', origine ' + c.org);
  }

  function rendreListe() {
    const rows = filtrerClients(st, vide);
    const np = Math.max(1, Math.ceil(rows.length / PAGE)), pg = Math.min(st.pg, np - 1);
    const page = rows.slice(pg * PAGE, pg * PAGE + PAGE);
    // la liste est indexée par position : un changement de filtre ne relance pas les animations d'entrée
    liste($('#lignes'), page.map((c, i) => ({ c, i })), (x) => x.i, (x) => creerLigne(x.c, x.i), (l, x) => majLigne(l, x.c, x.i));
    voir($('#vue-ok'), !charge && rows.length > 0);
    const v = $('#vue-vide');
    voir(v, !charge && rows.length === 0);
    if (!charge && rows.length === 0) texte(v, vide ? 'Aucun client pour le moment.' : 'Aucun client ne correspond aux filtres.');
    voir($('#vue-charge'), charge);
    texte($('#info'), 'Page ' + (pg + 1) + ' sur ' + np + ' · ' + rows.length + ' fiche' + (rows.length > 1 ? 's' : ''));
    $('#prec').setAttribute('aria-disabled', pg > 0 ? 'false' : 'true');
    $('#suiv').setAttribute('aria-disabled', pg < np - 1 ? 'false' : 'true');
    $('#prec').onclick = () => { if (pg > 0) { st.pg = pg - 1; rendre(); } };
    $('#suiv').onclick = () => { if (pg < np - 1) { st.pg = pg + 1; rendre(); } };
  }

  function rendrePuces() {
    majPuces($('#f-type'), [['tous', 'Tous'], ['client', 'Clients'], ['prospect', 'Prospects']].map(([k, t]) => ({ t, on: st.ty === k, go: () => { st.ty = k; st.pg = 0; rendre(); } })));
    majPuces($('#f-tags'), ETIQUETTES.map((t) => ({ t, on: st.tag === t, go: () => { st.tag = st.tag === t ? null : t; st.pg = 0; rendre(); } })));
    majPuces($('#f-orgs'), ORIGINES.map((t) => ({ t, on: st.org === t, go: () => { st.org = st.org === t ? null : t; st.pg = 0; rendre(); } })));
  }

  $('#rechercher').addEventListener('click', () => { st.q = $('#q').value.trim(); st.pg = 0; rendre(); });

  // ------------------------------------------------------------------ panneau E26.a
  const champM = $('#ncm'), champN = $('#ncn');
  const ligneDevis = (k) => CATALOGUE_DEVIS.find((c) => c.k === k);

  // catalogue : lignes statiques, créées une fois
  CATALOGUE_DEVIS.forEach((c) => {
    const b = el('button', { type: 'button', class: 'ico', 'aria-label': 'Ajouter ' + c.t, 'aria-disabled': 'false', style: 'position:relative;box-shadow:inset 0 0 0 1.5px #0D0E10' },
      svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, svg('path', { d: 'M12 6 L12 18 M6 12 L18 12' })));
    b.addEventListener('click', () => { st.lignes = st.lignes.concat([c.k]); st.errL = ''; rendrePanneau(); });
    $('#pn-cat').append(el('div', { class: 'cat-l' },
      el('span', { style: 'flex:1;display:flex;flex-direction:column' }, el('span', { style: 'font:400 15px Inter,sans-serif' }, c.t), el('span', { class: 'note', style: 'font-size:12px;line-height:1.3' }, c.s)),
      el('span', { style: "font:500 13px 'IBM Plex Mono',monospace" }, eurC(ttc(c.ht))), b));
  });

  function rendrePanneau() {
    const ouvert = st.pan !== 'off', cl = st.cl, busy = st.ph === 'busy';
    voir($('#panneau'), ouvert);
    voir($('#pn-form'), st.ph !== 'done');
    voir($('#pn-done'), st.ph === 'done');
    if (!ouvert) { rendreFond(); return; }
    animer($('#pn-verre'), cl ? 'devOut .3s ease-out forwards' : 'habille .7s ease .35s both');
    animer($('#pn-trait'), cl ? `undrawS .35s ${E} both` : `drawS .55s ${E} both`);
    animer($('#pn-dialog'), cl ? 'devOut .2s ease-out forwards' : 'habille .45s ease .5s both');
    // devis
    liste($('#pn-lig'), st.lignes.map((k, i) => ({ k, i })), (x) => x.i, (x) => {
      const b = el('button', { type: 'button', class: 'ico', 'aria-disabled': 'false', style: 'position:relative' }, svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, svg('path', { d: 'M7 7 L17 17 M17 7 L7 17' })));
      const l = el('div', { class: 'cat-l' }, el('span', { style: 'flex:1;display:flex;flex-direction:column' }, el('span', { style: 'font:400 15px Inter,sans-serif', 'data-c': 't' }), el('span', { class: 'note', style: 'font-size:12px;line-height:1.3', 'data-c': 's' })),
        el('span', { style: "font:500 13px 'IBM Plex Mono',monospace", 'data-c': 'v' }), b);
      b.addEventListener('click', () => { const i = Number(l.dataset.i); st.lignes = st.lignes.filter((_, j) => j !== i); rendrePanneau(); });
      return l;
    }, (l, x) => {
      const c = ligneDevis(x.k);
      l.dataset.i = x.i;
      texte(l.querySelector('[data-c="t"]'), c.t); texte(l.querySelector('[data-c="s"]'), c.s); texte(l.querySelector('[data-c="v"]'), eurC(ttc(c.ht)));
      l.querySelector('button').setAttribute('aria-label', 'Retirer ' + c.t);
    });
    voir($('#pn-vide'), !st.lignes.length);
    voir($('#pn-plein'), st.lignes.length > 0);
    texte($('#pn-tot'), eurC(totalDevis(st.lignes.map((k) => ligneDevis(k).ht))));
    poserErreur($('#ncm-err'), st.errE, champM); poserErreur($('#ncn-err'), st.errN, champN); poserErreur($('#ncl-err'), st.errL);
    // bouton principal : inactif pendant la création
    $('#pn-enc').style.opacity = busy ? '0' : '1';
    const bt = $('#pn-creer');
    bt.className = busy ? 'btn off' : 'btn';
    bt.setAttribute('aria-disabled', busy ? 'true' : 'false');
    texte(bt, busy ? 'Création…' : 'Créer le dossier');
    // résultat
    if (st.ph === 'done' && st.res) {
      const t = $('#pn-res-t');
      if (!t.firstChild || t.querySelector('.o').textContent !== st.res.t) { ecrire(t, st.res.t); animer(t, a.dn); }
      texte($('#pn-res-s'), st.res.s);
      voir($('#pn-fiche'), st.res.ex);
    }
    rendreFond();
  }

  function rendreFond() {
    const f = st.pan !== 'off' && !st.cl ? `wOut .4s ${E} both` : (st.n ? `wIn .5s ${E} .05s both` : 'none');
    animer($('#fond'), f);
  }

  let tP = 0;
  function ouvrir() {
    if (st.pan !== 'off') return;
    champM.value = ''; champN.value = '';
    Object.assign(st, { pan: 'on', ph: 'form', cl: false, lignes: [], errE: '', errN: '', errL: '', res: null });
    rendrePanneau();
  }
  function fermer() {
    if (st.pan === 'off' || st.cl || st.ph === 'busy') return;
    vie.clearTimeout(tP);
    st.cl = true; st.n += 1; rendrePanneau();
    tP = vie.timeout(() => { st.pan = 'off'; st.cl = false; rendrePanneau(); }, 380);
  }
  function creer() {
    if (st.ph !== 'form') return;
    const mail = champM.value.trim(), nom = champN.value.trim();
    const v = validerNouveauClient(mail, nom, st.lignes.length);
    Object.assign(st, v);
    if (v.errE || v.errN || v.errL) { rendrePanneau(); return; }
    st.ph = 'busy'; rendrePanneau();
    vie.clearTimeout(tP);
    tP = vie.timeout(() => { st.ph = 'done'; st.res = resultatCreation(mail); rendrePanneau(); }, 1000);
  }
  $('#nouveau').addEventListener('click', ouvrir);
  $('#pn-x').addEventListener('click', fermer);
  $('#pn-annuler').addEventListener('click', fermer);
  $('#pn-fermer').addEventListener('click', fermer);
  $('#pn-creer').addEventListener('click', creer);

  // ------------------------------------------------------------------ rendu
  function rendre() { rendrePuces(); rendreListe(); }
  rendre();
  if (param('panneau', ['Aucun', 'Nouveau client'], 'Aucun') === 'Nouveau client') ouvrir();

  vie.aFaire(() => { const f = $('#fond'); if (f) f.style.animation = ''; });
}

let vie;
export function destroy() { if (vie) vie.nettoyer(); }
