// Espace client · Mes dossiers (E02) + panneau E02.a « Supprimer mon compte » (UC06.7).
// Traduit PMesDossiers.dc.html. États : ?etat=Avec dossiers (défaut) | Chargement | Vide.
import { rythme, E } from '../lib/anim.js';
import { monterEntete, animationsEntete } from '../lib/entete.js';
import { $, el, svg, mot, ecrire, animer, liste, voir } from '../lib/dom.js';
import { param } from '../lib/params.js';
import { eurC } from '../lib/format.js';
import { DOSSIERS, CLIENT_CONNECTE } from '../../data/dossiers.js';
import { mesures } from '../lib/scene.js';
import { creerVie } from '../lib/vie.js';

let vie = null;

export function init() {
  vie = creerVie();


  const R = rythme(.62), { T, H, DR, DV, K } = R;
  const etat = param('etat', ['Avec dossiers', 'Chargement', 'Vide'], 'Avec dossiers');

  // ------------------------------------------------------------------ en-tête (menu, « Mes dossiers » actif)
  monterEntete($('#entete'), { actif: 'dossiers', cta: 'Simuler un devis', avecDossiers: true, a: animationsEntete(R) });

  // ------------------------------------------------------------------ animations propres à la page
  const a = {
    eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .8), h1: T(.9, .8), h2: T(1.15, 1.3),
    nt: `wIn ${.9 * K}s ${E} ${(1.7 * K).toFixed(2)}s both`, cta: H(1.9), ctaT: T(2.1, .45), sup: H(3.6), vT: T(1.8, .9)
  };
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dateLongue = (k) => `${k % 100 === 1 ? '1' : k % 100} ${MOIS[Math.floor(k / 100) % 100 - 1]} ${Math.floor(k / 10000)}`;
  // libellé, couleur, rang (1-4) de l'étape côté client
  const ET = { soumis: ['Soumis · en examen', '#3AA6B5', 1], accepte: ['Accepté · date réservée', '#D9783A', 2], confirme: ['Confirmé', '#7A1F33', 3], realise: ['Réalisé · photos livrées', '#0D0E10', 4] };
  const TONS = ['ton-3', 'ton-2', 'ton-1'];

  const dossiers = CLIENT_CONNECTE.dossiers.map((num, i) => {
    const d = DOSSIERS.find((x) => x.num === num), e = ET[d.et];
    return { num, srv: d.srv, date: dateLongue(d.k), e, tot: eurC(d.c), ton: TONS[i % TONS.length], i,
      aria: `Dossier n° ${num}, ${d.srv}, ${dateLongue(d.k)}, ${e[0]}, ${eurC(d.c)} TVAC` };
  });

  ecrire($('#eye'), 'Espace client · ' + CLIENT_CONNECTE.nom);
  ecrire($('#h1'), 'Vos dossiers');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 54px/1.05 'Instrument Serif',serif" }, 'au même endroit.'));
  ecrire($('#cta-t'), 'Simuler un nouveau devis');
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#aide'), a.nt); animer($('#cta-fl'), a.cta); animer($('#cta-t'), a.ctaT); animer($('#ouvrir-sup'), a.sup);

  // ------------------------------------------------------------------ registre
  const nSoumis = dossiers.filter((d) => d.e[2] === 1).length;
  $('#compteur').textContent = `${dossiers.length} dossiers · ${nSoumis} en cours d’examen`;
  animer($('#compteur'), a.nt); animer($('#entete-reg'), a.nt);
  animer($('#reg-trait'), DR(1.9, 1.2)); animer($('#fin'), `wIn ${.9 * K}s ${E} ${(3.4 * K).toFixed(2)}s both`);

  function creerRang(d) {
    const i = d.i, y = 176 + i * 150;
    const at = T(2.6 + i * .25, .6), ac = `habille 1.4s ease-in-out ${((2.2 + i * .25) * K).toFixed(2)}s both`;
    const photo = el('div', { class: 'ph ' + d.ton, role: 'img', 'aria-label': 'Photo du dossier ' + d.num, style: 'left:16px;top:20px;width:96px;height:96px' }, el('span', null, 'Photo'));
    animer(photo, DV(2.5 + i * .25));
    const pas = el('span', { 'aria-hidden': 'true', style: 'position:absolute;left:calc(456px + var(--dx));top:44px;display:flex;gap:6px' },
      ...[1, 2, 3, 4].map((k) => el('i', { style: `display:block;width:22px;height:6px;border-radius:3px;box-sizing:border-box;background:${k <= d.e[2] ? d.e[1] : 'transparent'};border:1.2px solid ${k <= d.e[2] ? d.e[1] : 'rgba(13,14,16,.35)'}` })));
    const etape = el('span', { style: 'position:absolute;left:calc(456px + var(--dx));top:64px' }, el('span', { class: 'etape' }, el('i', { 'aria-hidden': 'true', style: 'background:' + d.e[1] }), d.e[0]));
    const date = el('span', { style: 'position:absolute;left:136px;top:88px;font:400 14px Inter,sans-serif;color:#4B4D52' }, d.date);
    const tot = el('span', { style: 'position:absolute;right:56px;top:50px;font:300 24px Inter,sans-serif;letter-spacing:-.02em' }, d.tot);
    const fleche = svg('svg', { 'aria-hidden': 'true', viewBox: '0 0 24 24', style: 'position:absolute;right:18px;top:56px;width:20px;height:20px;fill:none;stroke:#0D0E10;stroke-width:1.6;stroke-linecap:round' }, svg('path', { d: 'M5 12 L19 12 M13 6 L19 12 L13 18' }));
    [pas, etape, date, tot, fleche].forEach((n) => animer(n, ac));
    const lien = el('a', { href: 'dossier.html', class: 'rang', 'aria-label': d.aria, style: `top:${y}px` },
      photo,
      el('span', { class: 'mono', style: 'position:absolute;left:136px;top:30px' }, mot('N° ' + d.num, at)),
      el('span', { style: 'position:absolute;left:136px;top:50px;font:300 24px Inter,sans-serif;letter-spacing:-.01em;white-space:nowrap' }, mot(d.srv, at)),
      date, pas, etape, tot, fleche);
    const trait = svg('path', { class: 'reg-l', pathLength: '100', d: 'M0 1 L800 1', style: { strokeWidth: '1px', stroke: 'rgba(13,14,16,.22)' } });
    animer(trait, DR(2.9 + i * .25, .8));
    const filet = svg('svg', { class: 'ln', 'aria-hidden': 'true', style: `left:560px;top:${y + 143}px;width:calc(800px + var(--dx));height:2px` }, trait);
    return el('div', { style: 'display:contents' }, lien, filet);
  }
  liste($('#rangs'), dossiers, (d) => d.num, creerRang);

  // ------------------------------------------------------------------ chargement et vide
  [176, 326, 476].forEach((s) => {
    [[560, 20, 96, 96, 12], [680, 32, 90, 10, 8], [680, 54, 220, 20, 8], [1000, 44, 106, 8, 8, 1], [1220, 50, 140, 24, 8, 1]].forEach(([l, t, w, h, r, d]) =>
      $('#squelettes').append(el('span', { class: 'sk', style: `left:${d ? `calc(${l}px + var(--dx))` : l + 'px'};top:${s + t}px;width:${w}px;height:${h}px;border-radius:${r}px` })));
  });
  ecrire($('#vide-t'), 'Vous n’avez pas encore de dossier.');
  animer($('#vide-t'), a.vT); animer($('#vide-n'), a.nt);
  voir($('#vue-liste'), etat === 'Avec dossiers');
  voir($('#vue-charge'), etat === 'Chargement');
  voir($('#vue-vide'), etat === 'Vide');

  // ------------------------------------------------------------------ panneau de suppression du compte
  const sup = { phase: 'off', ph: 'form', err: false, n: 0 };   // phase : off | open | closing ; ph : form | loading | done
  let tS = 0;
  const fond = $('#page'), panneau = $('#sup'), champ = $('#sup-mdp'), bouton = $('#sup-ok');

  function rendreSup() {
    const ferme = sup.phase === 'closing', busy = sup.ph === 'loading';
    voir(panneau, sup.phase !== 'off');
    animer(fond, sup.phase === 'open' ? `wOut .4s ${E} both` : (sup.n ? `wIn .5s ${E} .05s both` : 'none'));
    animer($('#sup-verre'), ferme ? 'devOut .3s ease-out forwards' : 'habille .7s ease .35s both');
    animer($('#sup-trait'), ferme ? `undrawS .35s ${E} both` : `drawS .55s ${E} both`);
    animer($('#sup-ct'), ferme ? 'devOut .2s ease-out forwards' : 'habille .45s ease .5s both');
    voir($('#sup-form'), sup.ph !== 'done');
    voir($('#sup-done'), sup.ph === 'done');
    champ.setAttribute('aria-invalid', sup.err ? 'true' : 'false');
    voir($('#sup-err-d'), sup.err);
    $('#sup-err-t').textContent = sup.err ? 'Mot de passe incorrect.' : '';
    bouton.className = busy ? 'btn off' : 'btn';
    bouton.setAttribute('aria-disabled', busy ? 'true' : 'false');
    bouton.textContent = busy ? 'Suppression…' : 'Confirmer la suppression';
    $('#sup-enc').style.opacity = busy ? '0' : '1';
  }
  function ouvrirSup() {
    if (sup.phase !== 'off') return;
    Object.assign(sup, { phase: 'open', ph: 'form', err: false });
    champ.value = '';
    rendreSup();
  }
  function fermerSup() {
    if (sup.phase !== 'open' || sup.ph !== 'form') return;
    sup.phase = 'closing'; sup.n += 1; rendreSup();
    vie.clearTimeout(tS);
    tS = vie.timeout(() => { sup.phase = 'off'; sup.err = false; rendreSup(); }, 380);
  }
  function confirmerSup() {
    if (sup.ph !== 'form') return;
    if (!champ.value) { sup.err = true; rendreSup(); champ.focus(); return; }
    champ.value = '';          // le mot de passe n'est ni conservé ni envoyé
    sup.ph = 'loading'; sup.err = false; rendreSup();
    vie.clearTimeout(tS);
    tS = vie.timeout(() => {
      sup.ph = 'done'; rendreSup();
      const O = (dl, d) => `wIn ${d}s ${E} ${dl}s both`;
      ecrire($('#done-1'), 'Votre compte a été supprimé.'); animer($('#done-1'), { o: O(.1, .9), f: O(.26, .9) });
      ecrire($('#done-2'), 'Vos données personnelles ont été effacées.'); animer($('#done-2'), { o: O(.6, .7), f: O(.76, .7) });
      animer($('#done-l'), 'habille .6s ease 1s both');
    }, 1200);
  }
  $('#ouvrir-sup').addEventListener('click', ouvrirSup);
  $('#sup-x').addEventListener('click', fermerSup);
  $('#sup-non').addEventListener('click', fermerSup);
  bouton.addEventListener('click', confirmerSup);
  champ.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmerSup(); } });
  rendreSup();

  // Registre pleine largeur : la géométrie des filets suit la largeur de la scène.
  const filets = () => document.querySelectorAll('#contenu .reg-l').forEach((p) => p.setAttribute('d', `M0 1 L${800 + mesures.dx} 1`));
  filets();
  vie.ecouter(window, 'scene:resize', filets);
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
