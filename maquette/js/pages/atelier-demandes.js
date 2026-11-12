// Atelier · E24 Demandes en attente. Traduit ErpDemandes.dc.html (états ?etat= : Données (défaut), Vide).
// « Traiter » ouvre E12.a sur place ; « Traitées récemment » est dessous.
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, animer, texte, liste, voir } from '../lib/dom.js';
import { param } from '../lib/params.js';
import { LIGNES_014 } from '../../data/dossiers.js';
import { REQ, HISTORIQUE } from '../../data/demandes.js';
import { posf, larg } from '../lib/scene.js';
import { monterPanneaux, preparer } from './atelier-dossier-logique.js';
import { creerVie } from '../lib/vie.js';

let vie = null, fondPage = null;

export function init() {
  vie = creerVie();
  const atelier = monterAtelier('demandes', { nDemandes: 2 });
  fondPage = atelier.fond;
  const { a, H } = atelier;
  const vide = param('etat', ['Données', 'Vide'], 'Données') === 'Vide';
  const st = { reqs: ['r1', 'r2'], hist: HISTORIQUE.map((h) => ({ ...h })) };
  const cle = (r) => (r === REQ.r1 ? 'r1' : 'r2');

  ecrire($('#eye'), '');
  ecrire($('#h1'), 'Demandes en attente,');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, 'la plus ancienne d’abord.'));
  preparer(document, a);

  const contexte = {
    lignes: () => LIGNES_014,
    etape: () => 'soumis',
    baseDemande: () => LIGNES_014,
    reqs: () => st.reqs,
    surChange: () => rendre(),
    valider(r) {
      st.reqs = st.reqs.filter((k) => k !== cle(r));
      st.hist = [{ num: r.num, cli: r.cli, t: r.titre, r: 'Validée aujourd’hui', ok: true }].concat(st.hist);
      return { ok: true, t: 'Demande validée.', s: 'Une nouvelle version PDF du dossier n° ' + r.num + ' est créée.' };
    },
    refuser(r, m) {
      st.reqs = st.reqs.filter((k) => k !== cle(r));
      st.hist = [{ num: r.num, cli: r.cli, t: r.titre, r: 'Refusée aujourd’hui · motif : ' + m, ok: false }].concat(st.hist);
      return { ok: false, t: 'Demande refusée.', s: 'Le client voit le motif dans son dossier ; rien d’autre ne change.' };
    }
  };
  const panneaux = monterPanneaux({ vie, atelier, page: 'demandes', contexte, REQ });

  function creerCarte(r, i) {
    const ac = H(1.5 + i * .2);
    const verre = el('div', { class: 'verre', 'aria-hidden': 'true', style: `left:304px;width:${larg(1072, 1)};height:120px;opacity:0` });
    const traiter = el('button', { type: 'button', class: 'btn encre', style: `left:${posf(852, 1)};top:38px;width:192px;height:44px;border-radius:22px` }, 'Traiter');
    const corps = el('div', { style: `position:absolute;left:304px;width:${larg(1072, 1)};height:120px` },
      el('p', { class: 'mono', style: 'position:absolute;left:28px;top:24px;margin:0;display:flex;align-items:center;gap:10px' }, el('i', { class: 'pt', 'aria-hidden': 'true', style: 'display:block;width:8px;height:8px;border-radius:4px' }), el('span', { class: 'lib' })),
      el('span', { class: 'titre', style: 'position:absolute;left:28px;top:46px;font:300 24px Inter,sans-serif;letter-spacing:-.02em;white-space:nowrap' }),
      el('span', { class: 'note quand', style: 'position:absolute;left:28px;top:84px' }),
      el('a', { href: 'dossier.html', class: 'lien mini', style: 'position:absolute;right:252px;top:50px' }, 'Ouvrir le dossier'),
      traiter);
    animer(verre, ac); animer(corps, ac);
    traiter.addEventListener('click', () => panneaux.ouvrir('dem', { req: corps._cle }));
    const n = el('div', { style: 'display:contents' }, verre, corps);
    n._verre = verre; n._corps = corps;
    return n;
  }
  function majCarte(n, k, i) {
    const r = REQ[k], y = 176 + i * 136;
    n._verre.style.top = y + 'px'; n._corps.style.top = y + 'px'; n._corps._cle = k;
    texte(n._corps.querySelector('.lib'), 'N° ' + r.num + ' · ' + r.cli + ' · ' + r.type);
    n._corps.querySelector('.pt').style.background = r.c;
    texte(n._corps.querySelector('.titre'), r.titre); texte(n._corps.querySelector('.quand'), r.quand);
    n._corps.querySelector('button').setAttribute('aria-label', 'Traiter la demande du dossier ' + r.num + ' : ' + r.titre);
  }

  function creerHist() {
    const n = el('div', { class: 'sep', style: `position:absolute;left:304px;width:${larg(1072, 1)};height:56px` },
      el('span', { class: 'mono num', style: 'position:absolute;left:0;top:4px' }),
      el('span', { class: 't', style: 'position:absolute;left:0;top:24px;font:400 15px Inter,sans-serif;color:#4B4D52' }),
      el('span', { class: 'etape', style: 'position:absolute;right:0;top:18px;color:#4B4D52' }, el('i', { 'aria-hidden': 'true' }), el('span', { class: 'r' })));
    animer(n, a.p2);
    return n;
  }

  function rendre() {
    const keys = vide ? [] : st.reqs;
    atelier.setBadge(st.reqs.length);
    texte($('#eye .o'), 'Demandes · ' + keys.length + ' en attente'); texte($('#eye .f'), 'Demandes · ' + keys.length + ' en attente');
    liste($('#items'), keys, (k, i) => i, creerCarte, majCarte);
    voir($('#vue-ok'), keys.length > 0); voir($('#vue-vide'), keys.length === 0);
    const hy = keys.length ? 176 + keys.length * 136 + 28 : 360;
    voir($('#vue-hist'), st.hist.length > 0);
    $('#hist-t').style.top = hy + 'px';
    liste($('#hist'), st.hist.slice(0, 4), (h, i) => i, creerHist, (n, h, i) => {
      n.style.top = (hy + 34 + i * 64) + 'px';
      texte(n.querySelector('.num'), 'N° ' + h.num + ' · ' + h.cli); texte(n.querySelector('.t'), h.t); texte(n.querySelector('.r'), h.r);
      const p = n.querySelector('.etape i'); p.style.background = h.ok ? '#0D0E10' : 'transparent'; p.style.boxShadow = h.ok ? 'none' : 'inset 0 0 0 1.5px #8C8E93';
    });
  }
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  if (fondPage) animer(fondPage, '');   // les panneaux animaient #fond (menu inclus)
}
