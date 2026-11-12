// Atelier · E10 Tableau de bord. Traduit ErpAtelier.dc.html (états : Données, Chargement, Vide, Erreur).
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, svg, mot, ecrire, animer, liste, voir } from '../lib/dom.js';
import { DOSSIERS, SHOOTINGS, AUJOURDHUI, ETAPES } from '../../data/dossiers.js';
import { REQ } from '../../data/demandes.js';
import { posf, larg } from '../lib/scene.js';

export function init() {
  const atelier = monterAtelier('tableau-de-bord', { nDemandes: Object.keys(REQ).length });
  const { a, T, H, ok, charge, vide, erreur } = atelier;

  // ------------------------------------------------------------------ en-tête
  const MOTS = ['aucun', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const nSoumis = DOSSIERS.filter((d) => d.et === 'soumis').length;
  const phrase = (nSoumis === 1 ? 'un dossier attend' : (MOTS[nSoumis] || String(nSoumis)) + ' dossiers attendent') + ' votre regard.';
  const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);

  ecrire($('#eye'), 'Tableau de bord · mercredi 11 novembre 2026');
  ecrire($('#h1'), 'Bonjour Ernest,');
  ecrire($('#h2'), italique(phrase));
  animer($('#eye-trait'), a.eyeL);
  animer($('#eye'), a.eye);
  animer($('#h1'), a.h1);
  animer($('#h2'), a.h2);
  animer($('#tous-dossiers'), a.sig);

  // ------------------------------------------------------------------ état « Données »
  const compte = (et) => DOSSIERS.filter((d) => d.et === et).length;
  const COMPTEURS = [
    { lab: 'Soumis', s: 'à examiner', n: compte('soumis'), c: ETAPES.soumis.c },
    { lab: 'Acceptés', s: 'en attente de confirmation', n: compte('accepte'), c: ETAPES.accepte.c },
    { lab: 'Confirmés', s: 'prêts pour le jour J', n: compte('confirme'), c: ETAPES.confirme.c }
  ];

  const DEMANDES = [
    { num: REQ.r1.num, cli: REQ.r1.cli, t: REQ.r1.titre, q: 'il y a 2 jours' },
    { num: REQ.r2.num, cli: REQ.r2.cli, t: REQ.r2.titre, q: 'il y a 5 h' }
  ];

  // Prochains shootings des 30 jours à venir (dossiers acceptés ou confirmés), du plus proche au plus lointain.
  const J30 = 20261211, MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const SHOOTS = DOSSIERS
    .filter((d) => SHOOTINGS[d.num] && (d.et === 'accepte' || d.et === 'confirme') && d.k >= AUJOURDHUI && d.k <= J30)
    .sort((x, y) => x.k - y.k || SHOOTINGS[x.num].h.localeCompare(SHOOTINGS[y.num].h))
    .slice(0, 4)
    .map((d) => {
      const y = Math.floor(d.k / 10000), m = Math.floor(d.k / 100) % 100, j = d.k % 100;
      return { j: String(j), mo: MOIS[m - 1], wd: JOURS[new Date(y, m - 1, j).getDay()], srv: d.srv, lieu: SHOOTINGS[d.num].lieu, num: d.num, h: SHOOTINGS[d.num].h };
    });

  function carteCompteur(c, i) {
    const an = T(1.6 + i * .2, .6), ac = H(1.4 + i * .2);
    const lab = mot(c.lab, an), n = mot(String(c.n), an);
    const lien = el('a', { href: 'dossiers.html', class: 'carte', 'aria-label': c.n + ' dossiers ' + c.lab.toLowerCase() + ', voir la liste',
      style: `left:${posf(304 + i * 364, i / 3)};top:176px;width:${larg(340, 1 / 3)};height:168px` },
      el('span', { class: 'mono', style: 'position:absolute;left:28px;top:26px;display:flex;align-items:center;gap:10px' },
        el('i', { 'aria-hidden': 'true', style: `display:block;width:8px;height:8px;border-radius:4px;background:${c.c}` }), lab),
      el('span', { style: 'position:absolute;left:24px;top:46px;font:200 72px/1 Inter,sans-serif;letter-spacing:-.04em' }, n),
      el('span', { class: 'note', style: 'position:absolute;left:28px;top:128px'}, c.s),
      svg('svg', { 'aria-hidden': 'true', viewBox: '0 0 24 24', style: 'position:absolute;right:24px;top:124px;width:20px;height:20px;fill:none;stroke:#0D0E10;stroke-width:1.6;stroke-linecap:round' },
        svg('path', { d: 'M5 12 L19 12 M13 6 L19 12 L13 18' })));
    const verre = el('div', { class: 'verre', 'aria-hidden': 'true', style: `left:${posf(304 + i * 364, i / 3)};top:176px;width:${larg(340, 1 / 3)};height:168px;opacity:0` });
    animer(verre, ac);
    animer(lien.querySelector('.note'), ac);
    animer(lien.querySelector('svg'), ac);
    return el('div', { style: 'display:contents' }, verre, lien);
  }

  function ligneDemande(d, i) {
    const at = T(2.2 + i * .2, .5), ac = H(2.2 + i * .2);
    const l = el('a', { href: 'demandes.html', class: 'lig', 'aria-label': 'Demande sur le dossier ' + d.num + ', ' + d.cli + ' : ' + d.t,
      style: `left:318px;top:${440 + i * 100}px;width:${larg(494, .5)};height:92px` },
      el('span', { class: 'mono', style: 'position:absolute;left:14px;top:16px' }, mot('N° ' + d.num + ' · ' + d.cli, at)),
      el('span', { style: 'position:absolute;left:14px;top:38px;font:400 16px Inter,sans-serif;white-space:nowrap' }, mot(d.t, at)),
      el('span', { class: 'note', style: 'position:absolute;left:14px;top:64px' }, d.q),
      el('span', { style: 'position:absolute;right:14px;top:34px;font:500 13px Inter,sans-serif;text-decoration:underline;text-underline-offset:4px' }, 'Traiter'));
    animer(l.children[2], ac); animer(l.children[3], ac);
    return l;
  }

  function ligneShooting(d, i) {
    const at = T(2.4 + i * .15, .5), ac = H(2.4 + i * .15);
    const l = el('a', { href: 'dossiers.html', class: 'lig', 'aria-label': d.wd + ' ' + d.j + ' ' + d.mo + ', ' + d.srv + ' à ' + d.lieu + ', dossier ' + d.num,
      style: `left:${posf(864, .5)};top:${440 + i * 92}px;width:${larg(494, .5)};height:84px` },
      el('span', { style: 'position:absolute;left:14px;top:14px;width:56px;text-align:center;font:200 34px/1 Inter,sans-serif' }, d.j),
      el('span', { class: 'mono', style: 'position:absolute;left:14px;top:54px;width:56px;text-align:center' }, d.wd + ' ' + d.mo),
      el('span', { style: 'position:absolute;left:92px;top:18px;font:400 16px Inter,sans-serif;white-space:nowrap' }, mot(d.srv, at)),
      el('span', { class: 'note', style: 'position:absolute;left:92px;top:44px' }, d.h + ' · ' + d.lieu + ' · n° ' + d.num));
    animer(l.children[0], ac); animer(l.children[1], ac); animer(l.children[3], ac);
    return l;
  }

  ecrire($('#t1'), 'Demandes en attente · ' + DEMANDES.length);
  ecrire($('#t2'), 'Prochains shootings · 30 jours');
  animer($('#t1'), a.t1); animer($('#t2'), a.t2);
  animer($('#l1'), a.l1); animer($('#l2'), a.l2);
  animer($('#p1-verre'), H(1.9));
  animer($('#p2-verre'), H(2.1));
  animer($('#toutes-demandes'), H(1.9));

  // ------------------------------------------------------------------ états annexes
  const SQUELETTES = [
    { l: 304, t: 176, w: 340, h: 168, r: 24, f: 0, g: 1 / 3 }, { l: 668, t: 176, w: 340, h: 168, r: 24, f: 1 / 3, g: 1 / 3 }, { l: 1032, t: 176, w: 340, h: 168, r: 24, f: 2 / 3, g: 1 / 3 },
    { l: 304, t: 376, w: 522, h: 440, r: 24, f: 0, g: .5 }, { l: 850, t: 376, w: 522, h: 440, r: 24, f: .5, g: .5 }
  ];
  SQUELETTES.forEach((s) => $('#squelettes').append(el('span', { class: 'sk', style: `left:${posf(s.l, s.f)};top:${s.t}px;width:${larg(s.w, s.g)};height:${s.h}px;border-radius:${s.r}px` })));

  ecrire($('#vide-t'), 'Aucun dossier pour le moment.');
  animer($('#vide-t'), a.vT); animer($('#vide-n'), a.nt); animer($('#vide-l'), a.nt);
  ecrire($('#err-t'), 'Le tableau de bord n’a pas pu être chargé.');
  animer($('#err-t'), a.vT); animer($('#err-r'), a.nt);

  // ------------------------------------------------------------------ rendu
  liste($('#compteurs'), COMPTEURS, (c) => c.lab, carteCompteur);
  liste($('#demandes'), DEMANDES, (d) => d.num, ligneDemande);
  liste($('#shootings'), SHOOTS, (d) => d.num, ligneShooting);
  voir($('#vue-ok'), ok);
  voir($('#vue-charge'), charge);
  voir($('#vue-vide'), vide);
  voir($('#vue-erreur'), erreur);
}

export function destroy() {}
