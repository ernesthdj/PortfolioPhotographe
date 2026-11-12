// Atelier · E11 Dossiers (liste). Traduit ErpDossiers.dc.html.
// États (?etat=) : Données (défaut), Chargement, Aucun résultat. Recherche, filtres par date et par étape, pagination (9 par page).
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, animer, texte, liste, voir } from '../lib/dom.js';
import { param } from '../lib/params.js';
import { eurC } from '../lib/format.js';
import { DOSSIERS, ETAPES, AUJOURDHUI } from '../../data/dossiers.js';
import { REQ } from '../../data/demandes.js';
import { posf, larg } from '../lib/scene.js';
import { creerVie } from '../lib/vie.js';

let vie = null, fondPage = null;

export function init() {
  vie = creerVie();
  const atelier = monterAtelier('dossiers', { nDemandes: Object.keys(REQ).length });
  fondPage = atelier.fond;
  const { a, H } = atelier;
  const etat = param('etat', ['Données', 'Chargement', 'Aucun résultat'], 'Données');
  const donnees = etat === 'Données', charge = etat === 'Chargement', sansRes = etat === 'Aucun résultat';

  const J30 = 20261211, PAGE = 9;
  const clos = (k) => k === 'refuse' || k === 'annule';
  const st = { fe: 'tous', fd: 'toutes', q: '', pg: 0 };

  // ------------------------------------------------------------------ en-tête (fixe)
  const enCours = DOSSIERS.filter((d) => !['realise', 'refuse', 'annule'].includes(d.et)).length;
  ecrire($('#eye'), `Dossiers · ${enCours} en cours · ${DOSSIERS.length} au total`);
  ecrire($('#h1'), 'Tous les dossiers,');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, 'du premier devis au jour J.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#zone-q'), a.sig); animer($('#chercher'), a.sig);
  animer($('#groupe-dates'), a.nt); animer($('#groupe-etapes'), a.nt);
  animer($('#l1'), a.l1);
  ['info', 'legende', 'prec', 'suiv'].forEach((id) => animer($('#' + id), a.p2));
  ecrire($('#vide-t'), 'Aucun dossier ne correspond aux filtres.');
  animer($('#vide-t'), a.vT); animer($('#effacer'), a.nt);
  for (let i = 0; i < 9; i++) $('#squelettes').append(el('span', { class: 'sk', style: `left:304px;top:${340 + i * 50}px;width:${larg(1072, 1)};height:34px;border-radius:10px` }));

  // ------------------------------------------------------------------ pastilles de filtre
  const FD = [['toutes', 'Toutes'], ['30j', '30 prochains jours'], ['avenir', 'À venir'], ['passes', 'Passés']];
  const FE = [['tous', 'Tous'], ['soumis', 'Soumis'], ['accepte', 'Acceptés'], ['confirme', 'Confirmés'], ['realise', 'Réalisés'], ['refuse', 'Refusés'], ['annule', 'Annulés']];

  function pastilleDate([k, t]) {
    return el('button', { type: 'button', class: 'puce', 'aria-pressed': 'false', 'data-k': k, on: { click: () => { st.fd = k; st.pg = 0; rendre(); } } }, t);
  }
  function pastilleEtape([k]) {
    const b = el('button', { type: 'button', class: 'puce', 'aria-pressed': 'false', 'data-k': k, on: { click: () => { st.fe = k; st.pg = 0; rendre(); } } });
    if (k !== 'tous') b.append(el('i', { 'aria-hidden': 'true' }));
    b.append(el('span', { class: 'lib' }), el('b'));
    return b;
  }
  // les puces de date vivent à côté du libellé « Shooting » : on les range dans un conteneur dédié
  const bandeDates = el('span', { style: 'display:contents' });
  $('#groupe-dates').append(bandeDates);

  // ------------------------------------------------------------------ lignes du registre
  function creerLigne() {
    const l = el('a', { href: 'dossier.html', class: 'lig sep', style: `left:290px;width:${larg(1100, 1)};height:48px` },
      el('span', { class: 'mono n', style: 'position:absolute;left:14px;top:17px;color:#0D0E10' }),
      el('span', { class: 'cli', style: 'position:absolute;left:124px;top:5px;font:400 15px Inter,sans-serif;white-space:nowrap' }),
      el('span', { class: 'note mail', style: 'position:absolute;left:124px;top:25px;font-size:12px;line-height:1.4;white-space:nowrap' }),
      el('span', { class: 'srv', style: `position:absolute;left:${posf(384, .2)};top:14px;font:400 14px Inter,sans-serif;white-space:nowrap` }),
      el('span', { class: 'dat', style: `position:absolute;left:${posf(614, .5)};top:14px;font:400 14px Inter,sans-serif;white-space:nowrap` }),
      el('span', { class: 'etape', style: `position:absolute;left:${posf(754, .65)};top:15px` }, el('i', { 'aria-hidden': 'true' }), el('span', { class: 'et' })),
      el('span', { class: 'tot', style: "position:absolute;right:98px;top:15px;font:500 13px 'IBM Plex Mono',monospace" }),
      el('span', { class: 'dem', 'aria-hidden': 'true', title: 'Demande en attente', style: 'position:absolute;right:34px;top:19px;width:10px;height:10px;border-radius:5px;background:#3AA6B5;animation:pulse 2.4s ease-in-out 2s infinite' }));
    return l;
  }
  function majLigne(l, r, i) {
    l.style.top = (334 + i * 50) + 'px';
    animer(l, H(1.5 + i * .06));
    const e = ETAPES[r.et];
    l.setAttribute('aria-label', 'Dossier ' + r.num + ', ' + r.cli + ', ' + r.srv + ' le ' + r.date + ', ' + e.t.toLowerCase() + ', ' + eurC(r.c) + (r.dem ? ', demande en attente' : ''));
    texte(l.querySelector('.n'), r.num); texte(l.querySelector('.cli'), r.cli); texte(l.querySelector('.mail'), r.mail);
    texte(l.querySelector('.srv'), r.srv); texte(l.querySelector('.dat'), r.date); texte(l.querySelector('.et'), e.t); texte(l.querySelector('.tot'), eurC(r.c));
    const pt = l.querySelector('.etape i'); pt.style.background = e.c; pt.style.boxShadow = clos(r.et) ? 'inset 0 0 0 1.5px #8C8E93' : 'none';
    l.querySelector('.dem').hidden = !r.dem;
  }

  // ------------------------------------------------------------------ rendu
  function filtrer() {
    const q = st.q.toLowerCase();
    const rows = DOSSIERS.filter((r) => (st.fe === 'tous' || r.et === st.fe)
      && (st.fd === 'toutes' || (st.fd === '30j' ? r.k >= AUJOURDHUI && r.k <= J30 : st.fd === 'avenir' ? r.k >= AUJOURDHUI : r.k < AUJOURDHUI))
      && (!q || r.num.includes(q) || r.mail.includes(q)));
    // à venir d'abord (le plus proche en tête), puis les passés (le plus récent en tête)
    rows.sort((x, y) => (x.k >= AUJOURDHUI) !== (y.k >= AUJOURDHUI) ? (x.k >= AUJOURDHUI ? -1 : 1) : (x.k >= AUJOURDHUI ? x.k - y.k : y.k - x.k));
    return rows;
  }

  function rendre() {
    const rows = filtrer();
    const np = Math.max(1, Math.ceil(rows.length / PAGE)), pg = Math.min(st.pg, np - 1);
    st.pg = pg;
    liste(bandeDates, FD, (f, i) => i, pastilleDate, (b, [k, t]) => {
      b.className = 'puce' + (st.fd === k ? ' on' : ''); b.setAttribute('aria-pressed', st.fd === k ? 'true' : 'false');
    });
    liste($('#groupe-etapes'), FE, (f, i) => i, pastilleEtape, (b, [k, t]) => {
      b.className = 'puce' + (st.fe === k ? ' on' : ''); b.setAttribute('aria-pressed', st.fe === k ? 'true' : 'false');
      texte(b.querySelector('.lib'), t);
      texte(b.querySelector('b'), k === 'tous' ? DOSSIERS.length : DOSSIERS.filter((r) => r.et === k).length);
      const p = b.querySelector('i');
      if (p) { p.style.background = ETAPES[k].c; p.style.boxShadow = clos(k) ? 'inset 0 0 0 1.5px currentColor' : 'none'; }
    });
    liste($('#lignes'), rows.slice(pg * PAGE, pg * PAGE + PAGE), (r, i) => i, creerLigne, majLigne);
    texte($('#info'), 'Page ' + (pg + 1) + ' sur ' + np + ' · ' + rows.length + ' dossier' + (rows.length > 1 ? 's' : ''));
    $('#prec').setAttribute('aria-disabled', pg > 0 ? 'false' : 'true');
    $('#suiv').setAttribute('aria-disabled', pg < np - 1 ? 'false' : 'true');
    const qi = $('#q-info'); voir(qi, !!st.q); if (st.q) texte(qi, 'Recherche : « ' + st.q + ' »');
    voir($('#vue-ok'), donnees && rows.length > 0);
    voir($('#vue-vide'), sansRes || (donnees && rows.length === 0));
    voir($('#vue-charge'), charge);
  }

  $('#chercher').addEventListener('click', () => { st.q = $('#q').value.trim(); st.pg = 0; rendre(); });
  $('#prec').addEventListener('click', () => { if (st.pg > 0) { st.pg--; rendre(); } });
  $('#suiv').addEventListener('click', () => { st.pg++; rendre(); });
  $('#effacer').addEventListener('click', () => { $('#q').value = ''; st.fe = 'tous'; st.fd = 'toutes'; st.q = ''; st.pg = 0; rendre(); });
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  if (fondPage) animer(fondPage, '');   // les panneaux animaient #fond (menu inclus)
}
