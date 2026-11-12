// Espace client · dossier à onglets (E03). Traduit PDossier.dc.html.
// Données : dossier 2027-014 de data/dossiers.js (mêmes lignes et mêmes totaux que l'atelier).
import { rythme, E } from '../lib/anim.js';
import { monterEntete, animationsEntete } from '../lib/entete.js';
import { $, el, mot, ecrire, animer, liste, voir } from '../lib/dom.js';
import { eurC, totaux } from '../lib/format.js';
import { LIGNES_014, DATES_014, dossier } from '../../data/dossiers.js';
import { mesures } from '../lib/scene.js';
import { creerVie } from '../lib/vie.js';

let vie = null;

export function init() {
  vie = creerVie();


  const R = rythme(.62), { T, H, DR, K } = R;
  monterEntete($('#entete'), { actif: 'dossiers', cta: 'Simuler un devis', avecDossiers: true, a: animationsEntete(R) });

  const d = dossier('2027-014');
  const a = {
    eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .7), h1: T(.9, .8), h2: T(1.1, 1), in: T(1.5, 1.2),
    fil: DR(1.8, 1.2), etT: T(2.8, .6), lim: H(2.4),
    pill: `habille 1.8s ease-in-out ${(3.0 * K).toFixed(2)}s both`, pillL: DR(2.6, 1),
    pillC: 'apparait 1.8s ease-in-out 6s both, comete 26s linear 6s infinite', tabs: H(3.2)
  };

  // ------------------------------------------------------------------ titre
  ecrire($('#eye'), 'Mes dossiers / Dossier n° ' + d.num);
  ecrire($('#h1'), 'Votre mariage,');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 48px/1 'Instrument Serif',serif" }, 'en cours d’examen.'));
  ecrire($('#intro'), `Samedi ${d.date} · soumis le ${DATES_014.soumis} · le photographe vous répond par e-mail.`);
  ecrire($('#et-actuelle'), 'Étape actuelle · soumis');
  $('#limite').textContent = DATES_014.limite;
  $('#doc-t').textContent = 'Soumission du dossier · 09/11/2026';
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#intro'), a.in); animer($('#fil'), a.fil); animer($('#et-actuelle'), a.etT);
  ['lim-verre', 'lim-ct', 'ajout-verre', 'ajout'].forEach((id) => animer($('#' + id), a.lim));
  animer($('#pill'), a.pill); animer($('#pill-l'), a.pillL); animer($('#pill-c'), a.pillC); animer($('#onglets'), a.tabs);

  // ------------------------------------------------------------------ étapes Soumis → Accepté → Confirmé → Réalisé
  const ETAPES = ['Soumis', 'Accepté', 'Confirmé', 'Réalisé'].map((t, i) => ({ t, i }));
  liste($('#etapes'), ETAPES, (e) => e.t, (e) => {
    const dot = el('span', { class: 'd', 'aria-hidden': 'true', style: 'opacity:0' });
    animer(dot, H(1.9 + e.i * .2));
    return el('div', { class: e.i === 0 ? 'etape ici' : 'etape', style: `left:${80 + e.i * 220}px` }, dot,
      el('span', { class: 't' }, mot(e.t, T(2.0 + e.i * .2, .5))));
  });

  // ------------------------------------------------------------------ onglets
  const ONGLETS = [['Devis', ''], ['Fiches techniques', '1 à compléter'], ['Demandes', '0'], ['Documents', '1'], ['Parrainage', '']];
  const VUES = ['v-devis', 'v-fiches', 'v-demandes', 'v-docs', 'v-parr'];
  let onglet = 0;
  const boutons = ONGLETS.map(([t, nb], i) => {
    const b = el('button', { type: 'button', role: 'tab', class: 'onglet', 'aria-selected': 'false', on: { click: () => { onglet = i; rendreOnglets(); } } },
      t, el('span', { class: 'nb' }, nb), el('span', { class: 'u', 'aria-hidden': 'true' }));
    $('#onglets').append(b);
    return b;
  });
  function rendreOnglets() {
    boutons.forEach((b, i) => { b.className = onglet === i ? 'onglet on' : 'onglet'; b.setAttribute('aria-selected', onglet === i ? 'true' : 'false'); });
    VUES.forEach((id, i) => voir($('#' + id), onglet === i));
  }
  rendreOnglets();

  // ------------------------------------------------------------------ devis : frise de la journée, lignes, totaux
  // La frise est proportionnelle à la largeur disponible (800 px à 1440, + dx au-delà) et se recalcule au redimensionnement.
  const DEBUT = 13, INCL = 15, FIN = 22.25;                    // 2 h incluses (foncé), le reste facturé en plus (clair)
  $('#jr-titre').textContent = 'La journée · 13:00 → 22:15';
  const jr = $('#jr');
  voir($('#jr-b2'), true);
  const points = [13, 14.5, 18].map((h) => ({ h, n: jr.appendChild(el('span', { 'aria-hidden': 'true', style: 'position:absolute;top:19px;width:10px;height:10px;box-sizing:border-box;border-radius:50%;border:1.5px solid #0D0E10;background:#FFFFFF' })) }));
  const geometrie = () => {
    const X = (h) => Math.round((h - 10) * (800 + mesures.dx) / 14);     // 10:00 → 0 px, 24:00 → largeur
    Object.assign($('#jr-b1').style, { left: X(DEBUT) + 'px', width: (X(INCL) - X(DEBUT)) + 'px', borderRadius: '8px 0 0 8px' });
    Object.assign($('#jr-b2').style, { left: X(INCL) + 'px', width: (X(FIN) - X(INCL)) + 'px' });
    points.forEach((p) => { p.n.style.left = (X(p.h) - 5) + 'px'; });
    const w = 820 + mesures.dx, d = `M0 28 A28 28 0 0 1 28 0 L${w - 28} 0 A28 28 0 0 1 ${w} 28 A28 28 0 0 1 ${w - 28} 56 L28 56 A28 28 0 0 1 0 28`;
    document.querySelectorAll('#contenu .pill-d').forEach((n) => n.setAttribute('d', n.id === 'pill-c' ? d + ' Z' : d));
  };
  geometrie();
  vie.ecouter(window, 'scene:resize', geometrie);

  const libelle = (l) => l.o === 'Service' ? l.t + ' · ' + l.d.split(' · ')[0].replace(/ à \d+ € \/ h$/, '') : l.o === 'Transport' ? l.d.split(' · ')[0] : l.t;
  liste($('#lignes'), LIGNES_014, (l) => l.id, (l) =>
    el('div', { class: 'ligne' }, el('span', { style: 'display:flex;gap:14px;align-items:baseline' }, el('span', { class: 'o mono' }, l.o), libelle(l)), el('span', { class: 'v' }, eurC(l.ht))));
  const t = totaux(LIGNES_014);
  $('#ttc').textContent = eurC(t.ttc);
  $('#ht-tva').textContent = `HTVA ${eurC(t.ht)} · TVA 21 % ${eurC(t.tva)}`;

  // ------------------------------------------------------------------ parrainage : « Copier » (libellé seulement, rien n'est copié ni envoyé)
  $('#copier').addEventListener('click', (e) => { e.currentTarget.textContent = 'Copié'; });

  // Lien vers une page non dessinée : sans effet
  document.querySelectorAll('[data-sans-effet]').forEach((n) => n.addEventListener('click', (e) => e.preventDefault()));

}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
