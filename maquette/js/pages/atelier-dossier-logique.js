// Logique commune à Dossier (E12) et Demandes (E24) : les trois panneaux
//   E12.a « Traiter la demande » (avant / après, Valider ou Refuser avec motif obligatoire),
//   E12.b « Retirer une ligne » (frais de retrait facultatifs),
//   E12.c « Changer l'étape » (transitions R06.8 seulement, motif si refus, frais si annulation).
// À l'ouverture le fond (#fond) se résorbe en clip ; le panneau se trace puis s'habille ; à la fermeture le fond revient.
import { el, svg, mot, ecrire, animer, texte, liste, voir, $ } from '../lib/dom.js';
import { E } from '../lib/anim.js';
import { eurC } from '../lib/format.js';
import { ETAPES, TRANSITIONS } from '../../data/dossiers.js';

export const TRL = {
  accepte: ['Accepter le dossier', 'Les échéances de paiement sont créées.'],
  refuse: ['Refuser le dossier', 'Un motif est obligatoire : il sera affiché au client.'],
  confirme: ['Confirmer le dossier', 'Acompte ou contrat reçu.'],
  realise: ['Clore le dossier', 'Le shooting a eu lieu.'],
  annule: ['Annuler le dossier', 'Avec ou sans frais d’annulation, au cas par cas.']
};
export const PROCH = { soumis: 'Accepter ou refuser ce dossier', accepte: 'Confirmer dès l’acompte reçu', confirme: 'Clore après le jour J', realise: 'Dossier clos', refuse: 'Dossier clos', annule: 'Dossier clos' };
export const clos = (k) => k === 'refuse' || k === 'annule';

/** Montant saisi (« 30 », « 30,5 », « 1 200.25 ») -> centimes, ou null si invalide / nul. */
export function lireMontant(v) {
  const s = String(v).replace(/\s/g, '').replace(',', '.');
  return /^\d{1,5}(\.\d{1,2})?$/.test(s) && Number(s) > 0 ? Math.round(Number(s) * 100) : null;
}
const totaux = (ls) => { const ht = ls.reduce((s, l) => s + l.ht, 0), tva = Math.round(ht * .21); return { ht, tva, ttc: ht + tva }; };
export { totaux };

const ABS = 'position:absolute;';
const X = () => el('button', { type: 'button', class: 'x', 'aria-label': 'Fermer', style: 'right:18px;top:18px' },
  svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', style: 'width:18px;height:18px;fill:none;stroke:#0D0E10;stroke-width:1.8;stroke-linecap:round' }, svg('path', { d: 'M6 6 L18 18 M18 6 L6 18' })));
const encre = (l, t, w, h) => el('span', { class: 'encre', 'aria-hidden': 'true', style: `${ABS}left:${l}px;top:${t}px;width:${w}px;height:${h}px;border-radius:${h / 2}px` });
const bouton = (l, t, w, h) => el('button', { type: 'button', class: 'btn', style: `left:${l}px;top:${t}px;width:${w}px;height:${h}px;border-radius:${h / 2}px` });
const mini = (l, t, doux, txt) => el('button', { type: 'button', class: 'mini' + (doux ? ' doux' : ''), style: `${ABS}left:${l}px;top:${t}px` }, txt);
const erreur = (id, top) => el('p', { id, role: 'alert', style: `${ABS}left:40px;top:${top}px;margin:0;display:flex;align-items:center;gap:8px;font:400 13px Inter,sans-serif;color:#0D0E10` });
const case_ = (l, t, txt) => el('button', { type: 'button', class: 'case', role: 'checkbox', 'aria-checked': 'false', style: `left:${l}px;top:${t}px` },
  el('span', { class: 'bx', 'aria-hidden': 'true' }, svg('svg', { viewBox: '0 0 12 12' }, svg('path', { d: 'M2 6.5 L5 9 L10 3' }))), txt);
const champTexte = (id, lib, l, t, w, aria) => el('div', { class: 'champ', style: `${ABS}left:${l}px;top:${t}px;width:${w}px` },
  el('label', { class: 'mono', for: id }, lib), el('textarea', { id, 'aria-invalid': 'false', 'aria-describedby': aria }));
const champMontant = (id, l, t, aria) => el('div', { class: 'champ', style: `${ABS}left:${l}px;top:${t}px;width:240px` },
  el('label', { class: 'mono', for: id }, 'Montant des frais, HTVA (€)'),
  el('input', { id, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: '30,00', 'aria-invalid': 'false', 'aria-describedby': aria }));

/** Bloc « fait » commun aux trois panneaux. */
function blocFait(idTitre, yBtn, a) {
  const k = el('p', { class: 'mono', style: 'margin:0;display:flex;align-items:center;gap:12px' }, el('span', { class: 'trait', 'aria-hidden': 'true', style: 'display:block;width:20px;height:1px' }), el('span', { class: 'k' }));
  const t = mot(' ');
  const titre = el('p', { id: idTitre, role: 'status', style: 'margin:16px 0 0;font:300 30px/1.2 Inter,sans-serif;letter-spacing:-.02em' }, t);
  animer(t, a.dn);
  const s = el('p', { class: 'note', style: 'margin:12px 0 0;font-size:14px' });
  const zone = el('div', { style: `${ABS}left:40px;top:60px;right:40px` }, k, titre, s);
  const enc = encre(40, yBtn, 240, 48), btn = bouton(40, yBtn, 240, 48);
  btn.setAttribute('aria-disabled', 'false'); enc.style.opacity = '1';
  const bloc = el('div', { style: 'display:contents' }, zone, enc, btn);
  return { bloc, btn, maj(res, back) {
    const ok = !!res.ok;
    zone.querySelector('.trait').style.background = ok ? '#D9783A' : '#7A1F33';
    texte(zone.querySelector('.k'), ok ? 'C’est fait' : 'Enregistré');
    [t.querySelector('.o'), t.querySelector('.f')].forEach((n) => texte(n, res.t));
    texte(s, res.s); texte(btn, back);
  } };
}

/**
 * Monte les panneaux dans la scène.
 * @param {object} p
 *   vie : creerVie() de la page (minuteries, nœuds ajoutés hors de #contenu) ; atelier : retour de monterAtelier ; page : 'dossier' | 'demandes' ;
 *   contexte : { lignes(), etape(), reqs(), surChange(), valider(r), refuser(r, motif), retirer(ligne, frais), changer(choix, motif, frais) }
 *   (valider/refuser/retirer/changer modifient l'état de la page et renvoient { ok, t, s }).
 */
export function monterPanneaux({ atelier, page, contexte: C, panneauInitial = null, REQ, vie }) {
  const { a, fond } = atelier;
  const scene = $('#scene');
  const dem = page === 'demandes';
  const S = { pan: panneauInitial || 'off', ph: 'form', bz: '', err: '', sel: null, choix: null, frais: false, cl: false, n: 0, res: null, req: 'r1', t: null };
  const back = dem ? 'Revenir aux demandes' : 'Revenir au dossier';

  // ---------------------------------------------------------------- E12.a : Traiter la demande
  const dV = el('div', { class: 'verre ac', 'aria-hidden': 'true', style: 'left:360px;top:140px;width:960px;height:620px;opacity:0' });
  const dT = svg('path', { pathLength: '100', d: 'M0 24 A24 24 0 0 1 24 0 L936 0 A24 24 0 0 1 960 24 L960 596 A24 24 0 0 1 936 620 L24 620 A24 24 0 0 1 0 596 Z' });
  const dTrait = svg('svg', { class: 'ln ac', 'aria-hidden': 'true', style: 'left:360px;top:140px;width:960px;height:620px' }, dT);
  const dSous = el('p', { class: 'mono', style: `${ABS}left:40px;top:34px;margin:0` });
  const dTitre = el('p', { id: 'dem-t', style: `${ABS}left:40px;top:58px;margin:0;font:300 30px Inter,sans-serif;letter-spacing:-.02em;white-space:nowrap` });
  const dNote = el('p', { class: 'note', style: `${ABS}left:40px;top:102px;margin:0` });
  const dAv = el('div', { style: 'display:contents' }), dAp = el('div', { style: 'display:contents' });
  const dTotA = el('span', { style: `${ABS}right:0;font:300 22px Inter,sans-serif` }), dTotB = el('span', { style: `${ABS}right:0;font:300 22px Inter,sans-serif` });
  const dDiff = el('span', { class: 'note', style: `${ABS}left:500px;top:408px;width:420px;text-align:right;font-size:12.5px` });
  const dTot = el('div', { style: 'display:contents' },
    el('span', { style: `${ABS}left:40px;top:378px;width:420px;font:500 15px Inter,sans-serif;color:#4B4D52` }, 'Total TVAC', dTotA),
    el('span', { style: `${ABS}left:500px;top:378px;width:420px;font:500 15px Inter,sans-serif` }, 'Total TVAC', dTotB), dDiff);
  const dNoTot = el('p', { class: 'note', style: `${ABS}left:40px;top:378px;margin:0` }, 'Prix inchangé : la demande ne touche pas au devis.');
  const dMotif = champTexte('motif', 'Motif du refus · visible par le client', 40, 426, 880, 'dem-err');
  const dErr = erreur('dem-err', 516);
  const dEnc = encre(40, 548, 250, 48), dBtnV = bouton(40, 548, 250, 48);
  const dRefuser = mini(322, 563, false, 'Refuser…'), dAnnuler = mini(410, 563, true, 'Annuler');
  const dEnc2 = encre(40, 548, 250, 48), dBtnR = bouton(40, 548, 250, 48), dRetour = mini(322, 563, true, 'Retour');
  const dD1 = el('div', { style: 'display:contents' }, dEnc, dBtnV, dRefuser, dAnnuler);
  const dD2 = el('div', { style: 'display:contents' }, dEnc2, dBtnR, dRetour);
  const dX = X();
  const dFait = blocFait('dem-t-ok', 516, a);
  const dForm = el('div', { style: 'display:contents' }, dX, dSous, dTitre, dNote,
    el('p', { class: 'mono', style: `${ABS}left:40px;top:148px;margin:0` }, 'Avant'),
    el('p', { class: 'mono', style: `${ABS}left:500px;top:148px;margin:0;color:#0D0E10` }, 'Après'),
    svg('svg', { class: 'ln', 'aria-hidden': 'true', style: 'left:0;top:0;width:960px;height:620px' },
      svg('path', { pathLength: '100', d: 'M40 170 L460 170', style: { strokeWidth: '1px', stroke: 'rgba(13,14,16,.25)', animation: 'drawS .5s ease .6s both' } }),
      svg('path', { pathLength: '100', d: 'M500 170 L920 170', style: { strokeWidth: '1px', stroke: 'rgba(13,14,16,.25)', animation: 'drawS .5s ease .7s both' } })),
    dAv, dAp, dTot, dNoTot, dMotif, dErr, dD1, dD2);
  const dDialog = el('div', { class: 'ac', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dem-t', style: `${ABS}left:360px;top:140px;width:960px;height:620px;opacity:0` }, dForm, dFait.bloc);
  const rootD = el('div', { style: 'display:contents' }, dV, dTrait, dDialog);

  // ---------------------------------------------------------------- E12.b : Retirer une ligne
  const rV = el('div', { class: 'verre ac', 'aria-hidden': 'true', style: 'left:540px;top:200px;width:600px;height:500px;opacity:0' });
  const rT = svg('path', { pathLength: '100', d: 'M0 24 A24 24 0 0 1 24 0 L576 0 A24 24 0 0 1 600 24 L600 476 A24 24 0 0 1 576 500 L24 500 A24 24 0 0 1 0 476 Z' });
  const rTrait = svg('svg', { class: 'ln ac', 'aria-hidden': 'true', style: 'left:540px;top:200px;width:600px;height:500px' }, rT);
  const rTitre = el('p', { id: 'ret-t', style: `${ABS}left:40px;top:58px;margin:0;font:300 26px Inter,sans-serif;letter-spacing:-.02em;white-space:nowrap` });
  const rNote = el('p', { class: 'note', style: `${ABS}left:40px;top:100px;width:500px;margin:0` });
  const rCase = case_(40, 176, 'Appliquer des frais de retrait');
  const rFrais = champMontant('fr', 72, 216, 'ret-err');
  const rErr = erreur('ret-err', 296);
  const rPrev = el('p', { class: 'note', style: `${ABS}left:40px;top:326px;margin:0` });
  const rEnc = encre(40, 396, 250, 48), rBtn = bouton(40, 396, 250, 48), rAnnuler = mini(322, 411, true, 'Annuler');
  const rX = X();
  const rFait = blocFait('ret-t-ok', 396, a);
  const rForm = el('div', { style: 'display:contents' }, rX, el('p', { class: 'mono', style: `${ABS}left:40px;top:34px;margin:0` }, 'Retirer une ligne'),
    rTitre, rNote, rCase, rFrais, rErr, rPrev, rEnc, rBtn, rAnnuler);
  const rDialog = el('div', { class: 'ac', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ret-t', style: `${ABS}left:540px;top:200px;width:600px;height:500px;opacity:0` }, rForm, rFait.bloc);
  const rootR = el('div', { style: 'display:contents' }, rV, rTrait, rDialog);

  // ---------------------------------------------------------------- E12.c : Changer l'étape
  const eV = el('div', { class: 'verre ac', 'aria-hidden': 'true', style: 'left:520px;top:150px;width:640px;height:600px;opacity:0' });
  const eT = svg('path', { pathLength: '100', d: 'M0 24 A24 24 0 0 1 24 0 L616 0 A24 24 0 0 1 640 24 L640 576 A24 24 0 0 1 616 600 L24 600 A24 24 0 0 1 0 576 Z' });
  const eTrait = svg('svg', { class: 'ln ac', 'aria-hidden': 'true', style: 'left:520px;top:150px;width:640px;height:600px' }, eT);
  const eSous = el('p', { class: 'mono', style: `${ABS}left:40px;top:34px;margin:0` });
  const eNote = el('p', { class: 'note', style: `${ABS}left:40px;top:102px;margin:0` });
  const eOpts = el('div', { role: 'radiogroup', 'aria-labelledby': 'eta-t' });
  const eMotif = champTexte('motif-e', 'Motif du refus · visible par le client', 40, 368, 560, 'eta-err');
  const eCase = case_(40, 372, 'Appliquer des frais d’annulation');
  const eFrais = champMontant('fa', 72, 408, 'eta-err');
  const eAnn = el('div', { style: 'display:contents' }, eCase, eFrais);
  const eErr = erreur('eta-err', 478);
  const eEnc = encre(40, 510, 220, 48), eBtn = bouton(40, 510, 220, 48), eAnnuler = mini(292, 525, true, 'Annuler');
  const eX = X();
  const eFait = blocFait('eta-t-ok', 496, a);
  const eForm = el('div', { style: 'display:contents' }, eX, eSous,
    el('p', { id: 'eta-t', style: `${ABS}left:40px;top:58px;margin:0;font:300 30px Inter,sans-serif;letter-spacing:-.02em` }, 'Où en est ce dossier ?'),
    eNote, eOpts, eMotif, eAnn, eErr, eEnc, eBtn, eAnnuler);
  const eDialog = el('div', { class: 'ac', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'eta-t', style: `${ABS}left:520px;top:150px;width:640px;height:600px;opacity:0` }, eForm, eFait.bloc);
  const rootE = el('div', { style: 'display:contents' }, eV, eTrait, eDialog);

  const racines = { dem: rootD, ret: rootR, eta: rootE };
  const kinds = dem ? ['dem'] : ['dem', 'ret', 'eta'];
  for (const k of kinds) { racines[k].hidden = true; scene.append(vie.noeud(racines[k])); }
  const set = { dem: { v: dV, t: dT, d: dDialog }, ret: { v: rV, t: rT, d: rDialog }, eta: { v: eV, t: eT, d: eDialog } };

  // ---------------------------------------------------------------- comportement
  let tP = null;
  const val = (id) => { const n = document.getElementById(id); return n ? String(n.value || '').trim() : ''; };
  const vider = (...ids) => ids.forEach((id) => { const n = document.getElementById(id); if (n) n.value = ''; });

  function ouvrir(pan, ex) {
    if (S.pan !== 'off' && !S.cl) return;
    vie.clearTimeout(tP);
    Object.assign(S, { pan, ph: 'form', bz: '', err: '', cl: false, choix: null, frais: false, res: null }, ex || {});
    vider('motif', 'motif-e', 'fr', 'fa');
    rendre();
  }
  function fermer() {
    if (S.pan === 'off' || S.cl || S.ph === 'busy') return;
    vie.clearTimeout(tP);
    S.cl = true; S.n++;
    rendre();
    tP = vie.timeout(() => { S.pan = 'off'; S.cl = false; rendre(); }, 380);
  }
  function plus(bz, fn) { S.ph = 'busy'; S.bz = bz; S.err = ''; rendre(); vie.clearTimeout(tP); tP = vie.timeout(fn, 1000); }
  function fin(res) { S.ph = 'done'; S.res = res; rendre(); C.surChange(); }

  function valider() {
    if (S.ph !== 'form') return;
    const r = REQ[S.req];
    plus('val', () => fin(C.valider(r)));
  }
  function refuser() {
    if (S.ph === 'form') { S.ph = 'refus'; S.err = ''; rendre(); return; }
    if (S.ph !== 'refus') return;
    const m = val('motif');
    if (!m) { S.err = 'Indiquez le motif du refus : il sera affiché au client.'; rendre(); return; }
    const r = REQ[S.req];
    plus('ref', () => fin(C.refuser(r, m)));
  }
  function retour() { if (S.ph === 'refus') { S.ph = 'form'; S.err = ''; rendre(); } }
  function retirer() {
    if (S.ph !== 'form') return;
    const l = C.lignes().find((x) => x.id === S.sel); if (!l) return;
    let fr = 0;
    if (S.frais) { fr = lireMontant(val('fr')); if (fr === null) { S.err = 'Indiquez un montant de frais valide.'; rendre(); return; } }
    plus('ret', () => fin(C.retirer(l, fr)));
  }
  function changer() {
    if (S.ph !== 'form') return;
    if (!S.choix) { S.err = 'Choisissez la nouvelle étape.'; rendre(); return; }
    let m = '', fr = 0;
    if (S.choix === 'refuse') { m = val('motif-e'); if (!m) { S.err = 'Indiquez le motif du refus : il sera affiché au client.'; rendre(); return; } }
    if (S.choix === 'annule' && S.frais) { fr = lireMontant(val('fa')); if (fr === null) { S.err = 'Indiquez un montant de frais valide.'; rendre(); return; } }
    const c = S.choix;
    plus('eta', () => fin(C.changer(c, m, fr)));
  }
  const basculer = () => { S.frais = !S.frais; S.err = ''; rendre(); };

  [dX, dAnnuler, rX, rAnnuler, eX, eAnnuler, dFait.btn, rFait.btn, eFait.btn].forEach((b) => b.addEventListener('click', fermer));
  dBtnV.addEventListener('click', valider); dRefuser.addEventListener('click', refuser); dBtnR.addEventListener('click', refuser); dRetour.addEventListener('click', retour);
  rBtn.addEventListener('click', retirer); eBtn.addEventListener('click', changer);
  rCase.addEventListener('click', basculer); eCase.addEventListener('click', basculer);

  // ---------------------------------------------------------------- rendu
  const ligneAvApres = (v, apres) => {
    const n = el('span', { style: `${ABS}left:${apres ? 500 : 40}px;width:420px;height:26px` });
    if (apres) n.append(el('i', { 'aria-hidden': 'true', style: `${ABS}left:-14px;top:2px;width:3px;height:18px;border-radius:2px` }));
    n.append(el('span', { class: 't', style: `${ABS}left:0;white-space:nowrap` }), el('span', { class: 'v', style: `${ABS}right:0;font:500 13px 'IBM Plex Mono',monospace` }));
    return n;
  };
  const majAvApres = (n, v, i, apres) => {
    n.style.top = (182 + i * 34) + 'px';
    if (apres) { n.style.font = `${v.fw} 14px Inter,sans-serif`; n.firstChild.style.background = v.mk; }
    else { n.style.font = '400 14px Inter,sans-serif'; n.style.color = '#4B4D52'; }
    texte(n.querySelector('.t'), v.t); texte(n.querySelector('.v'), v.v);
  };
  const setErr = (p, champs) => {
    p.replaceChildren();
    if (S.err) p.append(el('span', { 'aria-hidden': 'true', style: 'display:block;width:6px;height:6px;border-radius:3px;background:#7A1F33' }), S.err);
    champs.forEach((c) => c && c.setAttribute('aria-invalid', S.err ? 'true' : 'false'));
  };
  const setBtn = (enc, btn, busy, txt) => {
    enc.style.opacity = busy ? '0' : '1'; btn.className = busy ? 'btn off' : 'btn'; btn.setAttribute('aria-disabled', busy ? 'true' : 'false'); texte(btn, txt);
  };
  const coche = (c, on) => c.setAttribute('aria-checked', on ? 'true' : 'false');

  function rendre() {
    const on = S.pan !== 'off', cl = S.cl, busy = S.ph === 'busy';
    // fond : se résorbe à l'ouverture, revient à la fermeture
    animer(fond, on && !cl ? `wOut .4s ${E} both` : (S.n ? `wIn .5s ${E} .05s both` : 'none'));
    const fl = cl ? 'devOut .3s ease-out forwards' : 'habille .7s ease .35s both';
    const tr = cl ? `undrawS .35s ${E} both` : `drawS .55s ${E} both`;
    const ct = cl ? 'devOut .2s ease-out forwards' : 'habille .45s ease .5s both';
    for (const k of kinds) {
      const actif = on && S.pan === k;
      if (actif) { animer(set[k].v, fl); animer(set[k].t, tr); animer(set[k].d, ct); }
      voir(racines[k], actif);
    }
    if (!on) return;
    const form = S.ph !== 'done', done = S.ph === 'done';
    if (S.pan === 'dem') {
      const r = REQ[S.req];
      texte(dSous, 'Traiter la demande · ' + r.sous); texte(dTitre, r.titre); texte(dNote, 'N° ' + r.num + ' · ' + r.cli + ' · ' + r.type);
      const base = C.baseDemande();
      const row = (t, v, mk) => ({ t, v, mk: mk ? '#3AA6B5' : 'transparent', fw: mk ? '500' : '400' });
      const av = r.add ? base.map((l) => row(l.t, eurC(l.ht))) : r.avant.map((f) => row(f[0], f[1]));
      const ap = r.add ? base.concat([r.add]).map((l) => row(l.t, eurC(l.ht), l.id === r.add.id)) : r.apres.map((f) => row(f[0], f[1], f[2]));
      liste(dAv, av, (v, i) => i, (v, i) => ligneAvApres(v, false), (n, v, i) => majAvApres(n, v, i, false));
      liste(dAp, ap, (v, i) => i, (v, i) => ligneAvApres(v, true), (n, v, i) => majAvApres(n, v, i, true));
      const tA = totaux(base), tB = r.add ? totaux(base.concat([r.add])) : tA;
      voir(dTot, !!r.add); voir(dNoTot, !r.add);
      texte(dTotA, eurC(tA.ttc)); texte(dTotB, eurC(tB.ttc));
      texte(dDiff, r.add ? '+' + eurC(tB.ttc - tA.ttc) + ' TVAC · prix figé à la demande' : '');
      const refusVis = S.ph === 'refus' || (busy && S.bz === 'ref');
      voir(dMotif, refusVis);
      setErr(dErr, [document.getElementById('motif')]);
      voir(dD1, !refusVis); voir(dD2, refusVis);
      setBtn(dEnc, dBtnV, busy, busy && S.bz === 'val' ? 'Validation…' : 'Valider la demande');
      setBtn(dEnc2, dBtnR, busy, busy && S.bz === 'ref' ? 'Refus…' : 'Confirmer le refus');
      voir(dForm, form); voir(dFait.bloc, done);
      if (done && S.res) dFait.maj(S.res, back);
    } else if (S.pan === 'ret') {
      const ln = C.lignes().find((x) => x.id === S.sel) || C.lignes()[0] || { t: '', d: '', ht: 0 };
      texte(rTitre, 'Retirer « ' + ln.t + ' » ?');
      texte(rNote, eurC(ln.ht) + ' HTVA · ' + ln.d + '. Les autres lignes gardent leurs prix figés.');
      coche(rCase, S.frais); voir(rFrais, S.frais);
      setErr(rErr, [document.getElementById('fr')]);
      texte(rPrev, 'Nouveau total sans frais : ' + eurC(totaux(C.lignes().filter((x) => x.id !== ln.id)).ttc) + ' TVAC.');
      setBtn(rEnc, rBtn, busy, busy ? 'Retrait…' : 'Confirmer le retrait');
      voir(rForm, form); voir(rFait.bloc, done);
      if (done && S.res) rFait.maj(S.res, back);
    } else if (S.pan === 'eta') {
      const et = C.etape(), lib = ETAPES[et].t;
      texte(eSous, 'Changer l’étape · actuellement ' + lib);
      texte(eNote, 'Seules les étapes permises depuis « ' + lib + ' » sont proposées.');
      liste(eOpts, TRANSITIONS[et], (k) => k, (k, i) => {
        const b = el('button', { type: 'button', role: 'radio', class: 'opt', 'aria-checked': 'false', style: `left:40px;top:${140 + i * 70}px;width:560px;height:60px`, on: { click: () => { S.choix = k; S.err = ''; S.frais = false; rendre(); } } },
          el('i', { 'aria-hidden': 'true', style: `${ABS}left:22px;top:26px;width:8px;height:8px;border-radius:4px;background:${ETAPES[k].c};box-shadow:${clos(k) ? 'inset 0 0 0 1.5px #8C8E93' : 'none'}` }),
          el('span', { style: `${ABS}left:46px;top:11px;font:500 15px Inter,sans-serif` }, TRL[k][0]),
          el('span', { class: 'note', style: `${ABS}left:46px;top:32px;font-size:12.5px` }, TRL[k][1]));
        return b;
      }, (b, k) => { b.className = 'opt' + (S.choix === k ? ' on' : ''); b.setAttribute('aria-checked', S.choix === k ? 'true' : 'false'); });
      voir(eMotif, S.choix === 'refuse'); voir(eAnn, S.choix === 'annule');
      coche(eCase, S.frais); voir(eFrais, S.frais);
      setErr(eErr, [document.getElementById('motif-e'), document.getElementById('fa')]);
      setBtn(eEnc, eBtn, busy, busy ? 'Enregistrement…' : 'Confirmer');
      voir(eForm, form); voir(eFait.bloc, done);
      if (done && S.res) eFait.maj(S.res, back);
    }
  }
  // un panneau ouvert dès le chargement (?panneau=…)
  if (S.pan !== 'off') { S.sel = S.sel || (C.lignes()[1] || {}).id; }
  rendre();
  return { ouvrir, fermer, etat: S, rendre };
}

/**
 * Prépare le HTML statique d'une page : tout `.w[data-anim]` (texte vide de balises) devient un mot « écrit »,
 * puis chaque `[data-anim="clé"]` reçoit l'animation `a[clé]` (chaîne CSS, ou {o, f} pour un mot).
 */
export function preparer(racine, a) {
  racine.querySelectorAll('.w[data-anim]').forEach((w) => { if (!w.firstElementChild) ecrire(w, w.textContent); });
  racine.querySelectorAll('[data-anim]').forEach((n) => animer(n, a[n.dataset.anim]));
}
