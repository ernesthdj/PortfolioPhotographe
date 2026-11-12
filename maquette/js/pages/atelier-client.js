// Atelier · E26 Fiche client (Camille D.) : origine, étiquettes, dossiers, simulations, notes privées, journal.
// Traduit ErpClient.dc.html. Paramètre d'URL : ?ombre=…
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, animer, liste, voir, texte } from '../lib/dom.js';
import { eurC } from '../lib/format.js';
import { client, ORIGINES, ETIQUETTES } from '../../data/clients.js';
import { DOSSIERS, ETAPES, CLIENT_CONNECTE, DATES_014, LIEU_014 } from '../../data/dossiers.js';
import { calculer, totalCentimes } from '../../data/tarifs.js';
import { creerVie } from '../lib/vie.js';
import { majPuces, poserErreur, dateJournal } from './atelier-clients-logique.js';

let vie;

export function init() {
  const atelier = monterAtelier('client');
  const { a, H } = atelier;
    vie = creerVie();

  // ------------------------------------------------------------------ données de la fiche
  const fiche = client(CLIENT_CONNECTE.nom);
  const dossiers = CLIENT_CONNECTE.dossiers.map((n) => DOSSIERS.find((d) => d.num === n));
  const d014 = dossiers.find((d) => d.num === '2027-014');
  // Simulation envoyée le 7 nov. (quand elle était prospect) : un mariage de 8 h avec album, Bruxelles, calculé par le simulateur.
  const CFG_SIM = { sid: 'mar', dur: 8, opts: ['album'], lieux: [{ c: 0, h: 14 }] };
  const SIM = { t: '7 nov. 2026 · ' + calculer(CFG_SIM).lignes.filter((l) => l.o !== 'Transport').map((l) => l.t).join(' + '), ttc: totalCentimes(CFG_SIM).ttc };

  const st = {
    orig: fiche.org, tags: fiche.tags.slice(), canal: 'Téléphone', errJ: '', toast: null, tErr: false,
    jr: [{ d: '10 nov. 2026', c: 'Téléphone', r: 'Questions sur l’album 30 × 30 : je l’invite à faire la demande depuis son dossier.' },
      { d: '5 nov. 2026', c: 'Rendez-vous', r: 'Visite du château avec Camille et Hugo, repérage de la lumière vers 16 h.' }]
  };

  // ------------------------------------------------------------------ en-tête
  ecrire($('#eye'), 'Client · depuis le ' + DATES_014.soumisCourt);
  ecrire($('#h1'), fiche.nom + ',');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, 'mariage le ' + d014.date + '.'));
  texte($('#contact'), fiche.mail + ' · 0470 00 00 00 · Namur');
  animer($('#retour'), a.sig); animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#contact'), a.nt);
  animer($('#col1'), a.p1); animer($('#col2-verre'), a.p2); animer($('#col2'), a.p2);

  $('#np').value = 'Préfère être contactée par message après 18 h. ' + LIEU_014.nom + ' : lumière du parc idéale vers 17 h en juin.';
  $('#jd').value = '2026-11-11';
  $('#gerer').addEventListener('click', (e) => e.preventDefault()); // page « Origines et étiquettes » non dessinée

  // dossiers du client (calculés depuis data/dossiers.js)
  const libelle = (d) => d.srv;
  $('#dossiers').append(...dossiers.map((d) => {
    const e = ETAPES[d.et];
    const pt = el('i', { 'aria-hidden': 'true', style: `background:${e.c};box-shadow:${e.c === 'transparent' ? 'inset 0 0 0 1.5px #8C8E93' : 'none'}` });
    return el('a', { href: 'dossier.html', class: 'lien', style: 'display:flex;align-items:center;gap:16px;height:56px;box-shadow:inset 0 -1px 0 rgba(13,14,16,.08)' },
      el('span', { style: 'flex:1;display:flex;flex-direction:column' },
        el('span', { style: 'font:400 15px Inter,sans-serif' }, 'N° ' + d.num + ' · ' + libelle(d)),
        el('span', { class: 'note', style: 'font-size:12px;line-height:1.3' }, 'Shooting le ' + d.date + (d.dem ? ' · 1 demande en attente' : ''))),
      el('span', { class: 'etape' }, pt, e.t),
      el('span', { style: "font:500 13px 'IBM Plex Mono',monospace" }, eurC(d.c)));
  }));
  texte($('#sim-t'), SIM.t); texte($('#sim-v'), eurC(SIM.ttc));

  // ------------------------------------------------------------------ rendu
  function rendreToast() {
    voir($('#toast'), !!st.toast);
    if (!st.toast) return;
    const t = $('#toast');
    t.setAttribute('role', st.tErr ? 'alert' : 'status');
    $('#toast-trait').style.background = st.tErr ? '#7A1F33' : '#D9783A';
    texte($('#toast-t'), st.toast);
  }
  function rendreJournal() {
    const premiers = st.jr.slice(0, 2).map((j, i) => ({ j, i }));
    liste($('#journal'), premiers, (x) => x.i, () => el('div', { style: 'margin-top:14px;padding-bottom:10px;box-shadow:inset 0 -1px 0 rgba(13,14,16,.08)' },
      el('p', { class: 'mono', style: 'margin:0', 'data-c': 'dc' }), el('p', { style: 'margin:6px 0 0;font:400 14px/1.45 Inter,sans-serif', 'data-c': 'r' })), (n, x) => {
      texte(n.querySelector('[data-c="dc"]'), x.j.d + ' · ' + x.j.c);
      texte(n.querySelector('[data-c="r"]'), x.j.r);       // texte saisi : textContent uniquement
      animer(n, x.i === 0 && st.jr.length > 2 ? 'habille .5s ease both' : H(2 + x.i * .1));
    });
  }
  function rendre() {
    majPuces($('#f-orig'), ORIGINES.map((t) => ({ t, on: st.orig === t, go: () => { st.orig = t; st.toast = 'Origine : ' + t + '.'; st.tErr = false; rendre(); } })), 'radio');
    majPuces($('#f-tags'), ETIQUETTES.map((t) => ({ t, on: st.tags.includes(t), go: () => { st.tags = st.tags.includes(t) ? st.tags.filter((z) => z !== t) : st.tags.concat([t]); rendre(); } })));
    majPuces($('#f-canal'), ['Téléphone', 'Email', 'Rendez-vous', 'Message'].map((t) => ({ t, on: st.canal === t, go: () => { st.canal = t; rendre(); } })), 'radio', 'height:28px;padding:0 10px;font-size:12px');
    poserErreur($('#jrs-err'), st.errJ, $('#jrs'));
    rendreJournal();
    rendreToast();
  }

  $('#note').addEventListener('click', () => { st.toast = 'Note enregistrée. Elle reste privée.'; st.tErr = false; rendre(); });
  $('#ajouter').addEventListener('click', () => {
    const r = $('#jrs').value.trim();
    if (!r) { st.errJ = 'Le résumé de l’échange est obligatoire.'; rendre(); return; }
    st.jr = [{ d: dateJournal($('#jd').value), c: st.canal, r }].concat(st.jr);
    $('#jrs').value = '';
    st.errJ = ''; st.toast = 'Échange ajouté au journal.'; st.tErr = false;
    rendre();
  });
  rendre();
}

export function destroy() { if (vie) vie.nettoyer(); }
