// Simulateur de devis public (« A · frise directe », SimMix.dc.html) : page SANS compte.
//  - on règle la journée directement sur la frise du devis (poignées début / fin par prestation, minimum 2 h)
//  - une date par prestation, la ZONE (jamais d'adresse exacte avant inscription : règle de vie privée), les options en pastilles
//  - « + » ajoute la prestation directement (plus de panneau de configuration sur la page publique)
//  - prix « À partir de · TVAC » avec déplacement estimé par zone ; « Créer mon compte pour préciser » -> panneau de compte
//    -> « Votre brouillon est enregistré » (rien n'est envoyé au photographe)
// Le ruban de la journée et les adresses exactes vivent dans l'écran connecté « Préciser ma journée » (preciser.js).
// Prix, catalogue et distances : référence unique data/tarifs.js.
import { E } from '../lib/anim.js';
import { monterEntete, majEntete } from '../lib/entete.js';
import { $, el, svg, ecrire, animer, liste, voir } from '../lib/dom.js';
import { eurN as eur, hhmm as hh } from '../lib/format.js';
import { param } from '../lib/params.js';
import { CATEGORIES, SERVICES, OPTIONS, KM, COMMUNES, DUREE_MIN, DUREE_MAX, virgule, service, calculer } from '../../data/tarifs.js';
import { mesures } from '../lib/scene.js';
import { creerVie } from '../lib/vie.js';
import { emailValide, erreurMdp } from '../lib/validation.js';
import { memoriserFocus, clavierModale } from '../lib/modale.js';
import { lireBrouillonPublic, sauverBrouillonPublic, viderPrecision } from '../lib/brouillon.js';

let vie = null;

export function init() {
  vie = creerVie();

  const d0De = (c) => Math.min(...c.lieux.map((z) => z.h));

  /** Bande de présence (foncée = heures incluses, claire = dépassement facturé) sur l'axe 10:00 → 24:00. */
  function bande(cfg, s, x0, sc) {
    const L = cfg.lieux.slice().sort((p, q) => p.h - q.h), st0 = L[0].h, inc = Math.min(cfg.dur, s.incl), ov = Math.max(0, cfg.dur - s.incl);
    const X = (h) => Math.round(x0 + (Math.min(24, Math.max(10, h)) - 10) * sc);
    return { L, st0, x0: X(st0), w1: X(st0 + inc) - X(st0), x1: X(st0 + inc), w2: X(st0 + inc + ov) - X(st0 + inc), rad: ov > 0 ? '8px 0 0 8px' : '8px', X };
  }

  // ------------------------------------------------------------------ état (équivalent du state de la planche)
  const EXEMPLE = [{ sid: 'mar', dur: 2, opts: [], lieux: [{ c: -3, h: 14, adr: '' }], date: '', zone: -1 }];
  const exemple = param('exemple', ['Vide', 'Mariage posé'], 'Vide');
  const sauver = () => sauverBrouillonPublic(st.lignes);   // « Votre composition reste gardée dans ce navigateur » : sessionStorage, jamais de mot de passe

  const st = { lignes: exemple === 'Vide' ? lireBrouillonPublic() : structuredClone(EXEMPLE), promo: false, n: 0, sub: 'off', subMode: 'create', subPh: 'form', subErr: '' };
  let tS = 0, rendreFocus = null;      // rendreFocus : rend le focus au bouton « Créer mon compte » à la fermeture du panneau

  function soumettre() {
    if (st.sub !== 'off') return;
    Object.assign(st, { sub: 'open', subPh: 'form', subMode: 'create', subErr: '' });
    $('#sub-mail').value = ''; $('#sub-mdp').value = '';
    rendreFocus = memoriserFocus();
    rendre();
    $('#sub-x').focus({ preventScroll: true });
  }
  function fermerSub() {
    if (st.sub !== 'open' || st.subPh === 'loading') return;
    st.sub = 'closing'; st.n += 1; rendre();
    vie.clearTimeout(tS);
    tS = vie.timeout(() => { st.sub = 'off'; st.subPh = 'form'; rendre(); if (rendreFocus) rendreFocus(); rendreFocus = null; }, 380);
  }
  function envoyer() {
    if (st.subPh !== 'form') return;
    const mail = $('#sub-mail').value.trim(), mdp = $('#sub-mdp').value;
    if (!emailValide(mail)) { st.subErr = 'Cette adresse email n’est pas valide.'; rendre(); return; }
    const errMdp = erreurMdp(mdp, st.subMode === 'create');
    if (errMdp) { st.subErr = errMdp; rendre(); return; }
    $('#sub-mdp').value = '';       // rien n'est conservé ni envoyé
    viderPrecision();               // « Préciser ma journée » repart de ce brouillon
    st.subPh = 'loading'; st.subErr = ''; rendre();
    vie.clearTimeout(tS);
    tS = vie.timeout(() => {
      st.subPh = 'done'; rendre();
      const O = (dl, d) => `wIn ${d}s ${E} ${dl}s both`;
      ecrire($('#done-1'), 'Votre brouillon est enregistré.'); animer($('#done-1'), { o: O(.1, .9), f: O(.26, .9) });
      ecrire($('#done-2'), 'Précisez maintenant vos lieux et vos horaires dans votre espace client.'); animer($('#done-2'), { o: O(.7, .7), f: O(.86, .7) });
      animer($('#done-l'), 'habille .6s ease 1.2s both');
    }, 1300);
  }

  // ------------------------------------------------------------------ frise : poignées, dates, zones, options
  /** Règles de la planche : le début est indépendant (la fin reste fixe), la fin règle la durée, minimum 2 h. */
  function surFrise(i, type, v) {
    const c = st.lignes[i]; if (!c || !c.lieux || !c.lieux.length) return;
    const d0 = d0De(c), fin = d0 + c.dur;
    if (type === 'd') {
      const v2 = Math.max(10, Math.min(fin - DUREE_MIN, v));
      c.lieux.forEach((z) => { if (z.h === d0 || z.h < v2) z.h = v2; });
      c.dur = Math.max(DUREE_MIN, Math.min(DUREE_MAX, fin - v2));
    } else c.dur = Math.max(DUREE_MIN, Math.min(DUREE_MAX, Math.min(24, v) - d0));
    sauver(); rendre(); syncR(document.activeElement);
  }
  /** Recopie l'état dans les poignées et les dates, sans écraser le champ manipulé. */
  function syncR(sauf) {
    document.querySelectorAll('#rows [data-r]').forEach((n) => {
      if (n === sauf) return;
      const c = st.lignes[Number(n.dataset.r.slice(1))]; if (!c || !c.lieux || !c.lieux.length) return;
      const d0 = d0De(c), v = n.dataset.r[0] === 'd' ? d0 : d0 + c.dur;
      if (Number(n.value) !== v) n.value = v;
    });
    document.querySelectorAll('#lz-in [data-dt]').forEach((n) => { const c = st.lignes[Number(n.dataset.dt)]; if (c && n !== document.activeElement && n.value !== (c.date || '')) n.value = c.date || ''; });
  }

  // ------------------------------------------------------------------ animations (rythme K = 0,62 ; rapide après la première interaction)
  const K = .62;
  function rythmes(again) {
    const T = (dl, d) => again ? { o: `wIn .3s ${E} ${(dl * .04).toFixed(2)}s both`, f: `wIn .3s ${E} ${(dl * .04 + .08).toFixed(2)}s both` }
      : { o: `wIn ${d * K}s ${E} ${(dl * K).toFixed(2)}s both`, f: `wIn ${d * K}s ${E} ${((dl + .25) * K).toFixed(2)}s both` };
    const H = (dl) => again ? 'habille .35s ease .1s both' : `habille 1s ease ${(dl * K).toFixed(2)}s both`;
    const a = {
      sep: `drawS ${.8 * K}s ${E} 0s both`, logo: T(.3, .8), sig: `wIn ${.5 * K}s ${E} ${1.35 * K}s both`,
      n0: T(.5, .45), n1: T(.6, .45), n2: T(.7, .45), n3: T(.8, .45), navU: `wIn ${.5 * K}s ${E} ${1.2 * K}s both`,
      hFl: `habille 1s ease ${.9 * K}s both`, hCta: T(1.3, .45),
      eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .6), h1: T(.9, .8), h2: T(1.1, 1), sub: T(1.4, 1.2),
      pillL: again ? 'none' : `drawS ${1 * K}s ${E} ${1.2 * K}s both`, pill: again ? 'habille .3s ease both' : `habille 1.8s ease-in-out ${2.1 * K}s both`,
      pillC: 'apparait 1.8s ease-in-out 6s both, comete 24s linear 6s infinite', catT: T(1.6, .4),
      devT: T(1.8, .5), devL: again ? 'none' : `drawS ${1 * K}s ${E} ${1.8 * K}s both`, msg2: T(2.4, 1.2), promo: H(3.4),
      tL: again ? 'none' : `drawS ${1 * K}s ${E} ${2.0 * K}s both`, tB: again ? 'habille .3s ease both' : `habille 1.8s ease-in-out ${2.9 * K}s both`,
      totT: T(2.4, .4), axe: again ? 'none' : `drawS ${1.2 * K}s ${E} ${1.9 * K}s both`, tV: H(2.8), tVl: again ? 'none' : `drawS ${.6 * K}s ${E} ${2.8 * K}s both`
    };
    if (again) Object.assign(a, { sep: 'none', logo: T(0, .3), sig: 'none', n0: T(0, .3), n1: T(0, .3), n2: T(0, .3), n3: T(0, .3), hFl: 'none', hCta: T(0, .3) });
    return { a, T, H };
  }
  let R = rythmes(false);
  const entete = monterEntete($('#entete'), { cta: 'Créer mon devis', a: R.a });
  entete.ctaA.setAttribute('aria-current', 'page');
  vie.aFaire(() => entete.ctaA.removeAttribute('aria-current'));

  // Registre : (élément, fonction qui donne son animation courante), réappliqué à chaque rendu.
  const anims = [];
  const lier = (n, f) => { anims.push([n, f]); return n; };

  ecrire($('#eye'), 'Simulateur de devis');
  ecrire($('#h1'), 'Composez');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 48px/1 'Instrument Serif',serif" }, 'votre journée.'));
  ecrire($('#sub'), 'Prix en direct · HTVA, TVA, TVAC · sans compte · valeurs d’exemple');
  ecrire($('#cat-t'), 'Catalogue');
  ecrire($('#msg2'), 'Ajoutez une prestation pour voir votre prix.');
  ecrire($('#tot-t'), 'Totaux');
  [['eye-trait', 'eyeL'], ['eye', 'eye'], ['h1', 'h1'], ['h2', 'h2'], ['sub', 'sub'], ['cat-t', 'catT'], ['dev-l', 'devL'], ['msg2', 'msg2'], ['tot-t', 'totT'],
    ['axe', 'axe'], ['tvl', 'tVl'], ['pill', 'pill'], ['pill-c', 'pillC'], ['promo', 'promo'], ['appliquer', 'promo'], ['tot-verre', 'tB'], ['soumettre', 'tV'], ['t-ttc', 'tV']]
    .forEach(([id, k]) => lier($('#' + id), () => R.a[k]));
  document.querySelectorAll('.pill-l').forEach((n) => lier(n, () => R.a.pillL));
  document.querySelectorAll('.tot-l').forEach((n) => lier(n, () => R.a.tL));
  document.querySelectorAll('.tv').forEach((n) => { if (n.id !== 'soumettre' && n.id !== 't-ttc') lier(n, () => R.a.tV); });
  ecrire($('#dev-t'), 'Votre devis · vide');
  lier($('#dev-t'), () => R.a.devT);

  // ------------------------------------------------------------------ catalogue (colonne gauche) : « + » ajoute directement la prestation
  function monterCatalogue() {
    let y = 300;
    CATEGORIES.forEach((titre, ci) => {
      const h = el('p', { class: 'cat-h mono', style: `top:${y}px;margin:0;color:#0D0E10` }, el('span', { class: 'w' }));
      ecrire(h.firstChild, titre); lier(h.firstChild, () => R.T(1.7 + ci * .3, .5));
      $('#cats').append(h); y += 26;
      SERVICES.filter((s) => s.cat === ci).forEach((s, k) => {
        const dl = 1.8 + ci * .3 + k * .12;
        const t = el('span', { class: 'w' }), p = el('span', { class: 'w' });
        ecrire(t, s.t); ecrire(p, 'dès ' + eur(s.mode === 'P3' ? s.base : s.unit * s.min));
        const plus = el('span', { class: 'plus', 'aria-hidden': 'true', style: 'opacity:0' }, svg('svg', { viewBox: '0 0 24 24' }, svg('path', { d: 'M12 5 V19 M5 12 H19' })));
        lier(t, () => R.T(dl, .6)); lier(p, () => R.T(dl + .1, .5)); lier(plus, () => R.H(dl + .5));
        const ajouter = () => {
          const cfg = s.mode === 'P3' ? { sid: s.id, dur: s.incl, opts: [], lieux: [{ c: -3, h: 14, adr: '' }], date: '', zone: -1 } : { sid: s.id, qty: 10, opts: [], lieux: [] };
          st.lignes = st.lignes.concat([cfg]); st.n += 1; sauver(); rendre(); vie.timeout(syncR, 30);
        };
        $('#srvs').append(el('button', { type: 'button', class: 'srv', 'aria-label': 'Ajouter ' + s.t + ' au devis', style: `top:${y}px`, on: { click: ajouter } },
          el('span', { class: 't' }, t), el('span', { class: 'p' }, p), plus));
        y += 60;
      });
      y += 18;
    });
  }
  monterCatalogue();

  const ticks = [10, 12, 14, 16, 18, 20, 22, 24].map((h, i) => {
    const n = el('span', { class: 'tick', style: 'opacity:0' }, String(h).padStart(2, '0') + ':00');
    $('#ticks').append(n); lier(n, () => R.H(1.9 + i * .06));
    return { h, n };
  });

  // ------------------------------------------------------------------ rendu
  const dotsEl = () => el('span', { 'aria-hidden': 'true', style: 'position:absolute;width:10px;height:10px;box-sizing:border-box;border-radius:50%;border:1.5px solid #0D0E10;background:#FFFFFF;transition:left .6s cubic-bezier(.45,0,.2,1);animation:habille .4s ease 1s both' });

  function creerRang() {
    const lab = el('p', { class: 'mono rangee', style: 'position:absolute;left:440px;margin:0;color:#0D0E10;white-space:nowrap' });
    const b1 = el('span', { class: 'bande', 'aria-hidden': 'true', style: 'background:#0D0E10;box-shadow:0 10px 16px -8px rgba(13,14,16,.5);animation:wIn .9s cubic-bezier(.45,0,.2,1) .1s both' });
    const b2 = el('span', { class: 'bande', 'aria-hidden': 'true', style: 'border-radius:0 8px 8px 0;background:rgba(13,14,16,.28);animation:wIn .4s cubic-bezier(.45,0,.2,1) .95s both' });
    const inD = el('input', { type: 'range', class: 'jr', min: '10', max: '23.5', step: '0.25', style: 'left:431px;height:24px' });
    const inF = el('input', { type: 'range', class: 'jr', min: '12', max: '24', step: '0.25', style: 'left:431px;height:24px' });
    const dots = el('div', { style: 'display:contents' });
    const g = el('div', { style: 'display:contents' }, lab, b1, b2, inD, inF, dots);
    g._r = { lab, b1, b2, inD, inF, dots, i: 0 };
    inD.addEventListener('input', () => surFrise(g._r.i, 'd', Number(inD.value)));
    inF.addEventListener('input', () => surFrise(g._r.i, 'f', Number(inF.value)));
    return g;
  }
  function majRang(g, r, i) {
    const { lab, b1, b2, inD, inF, dots } = g._r;
    g._r.i = i;
    lab.textContent = r.lab; lab.style.top = r.y + 'px';
    Object.assign(b1.style, { left: r.x0 + 'px', top: r.by + 'px', width: r.w1 + 'px', borderRadius: r.rad });
    Object.assign(b2.style, { left: r.x1 + 'px', top: r.by + 'px', width: r.w2 + 'px' });
    inD.hidden = inF.hidden = !r.drag;
    if (r.drag) {
      for (const [n, k, aria, vt] of [[inD, 'd' + i, r.ariaD, r.debT], [inF, 'f' + i, r.ariaF, r.finT]]) {
        n.dataset.r = k; n.style.top = r.ty + 'px'; n.style.width = (578 + mesures.dx) + 'px';
        n.setAttribute('aria-label', aria); n.setAttribute('aria-valuetext', vt);
      }
    }
    liste(dots, r.dots, (d, j) => j, dotsEl, (n, d) => { n.style.left = d.x + 'px'; n.style.top = d.y + 'px'; });
  }

  const ZONES = COMMUNES;
  function creerLigne() {
    const o = el('span', { class: 'o mono' }), t = el('span');
    const dte = el('input', { type: 'date', class: 'dte' });
    const ret = el('button', { type: 'button', class: 'mini' }, 'Retirer');
    const ligneAct = el('span', { style: 'display:flex;gap:16px;margin-top:4px' }, dte, ret);
    const zones = el('span', { role: 'radiogroup', 'aria-label': 'Zone du shooting', style: 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px' },
      el('span', { class: 'mono', style: 'margin-right:4px' }, 'Zone'));
    const zb = ZONES.map((zt, zi) => {
      const b = el('button', { type: 'button', role: 'radio', class: 'chip', 'aria-checked': 'false', style: 'height:26px;padding:0 10px;font-size:12px' }, zt);
      b.addEventListener('click', () => { st.lignes[n._r.gi].zone = zi; sauver(); rendre(); });
      zones.append(b); return b;
    });
    const chips = el('span', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px' });
    const act = el('span', null, ligneAct, zones, chips);
    const v = el('span', { class: 'v' });
    const n = el('div', { class: 'ligne rangee' }, el('span', { class: 'g' }, o, el('span', null, t, act)), v);
    n._r = { o, t, act, zones, zb, chips, dte, v, gi: 0 };
    dte.addEventListener('input', () => { const c = st.lignes[n._r.gi]; if (c) { c.date = dte.value; sauver(); } });
    ret.addEventListener('click', () => { st.lignes = st.lignes.filter((_, i) => i !== n._r.gi); st.n += 1; sauver(); rendre(); });
    return n;
  }
  function creerChip(n) {
    const b = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', style: 'height:26px;padding:0 10px;font-size:12px' });
    b.addEventListener('click', () => {
      const c = st.lignes[n._r.gi], k = b._k; if (!c) return;
      c.opts = c.opts.includes(k) ? c.opts.filter((x) => x !== k) : c.opts.concat(k); sauver(); rendre();
    });
    return b;
  }
  function majLigne(n, l) {
    const r = n._r, c = st.lignes[l.gi];
    r.o.textContent = l.o; r.t.className = l.cls; r.t.textContent = l.t; r.v.textContent = l.v; r.gi = l.gi;
    n.style.top = l.y + 'px'; n.style.animationDelay = l.dl;
    r.act.hidden = !l.act;
    if (!l.act || !c) return;
    r.dte.dataset.dt = String(l.gi); r.dte.setAttribute('aria-label', 'Date du shooting · ' + service(c.sid).t);
    r.zones.hidden = !l.zOn;
    r.zb.forEach((b, zi) => { const on = c.zone === zi; b.className = on ? 'chip on' : 'chip'; b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    liste(r.chips, service(c.sid).opts, (k) => k, () => creerChip(n), (b, k) => {
      const on = c.opts.includes(k); b._k = k;
      b.className = on ? 'chip on' : 'chip'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = (on ? '✓ ' : '+ ') + OPTIONS[k][0] + ' · ' + OPTIONS[k][1] + ' €';
    });
  }

  function rendre() {
    const again = st.n > 0;
    R = rythmes(again);
    if (again) majEntete(entete, R.a);    // l'en-tête persistant ne rejoue rien avant la première interaction
    anims.forEach(([n, f]) => animer(n, f()));

    // largeur de l'axe des heures : 560 px à 1440, + dx au-delà (la journée occupe toute la place libre)
    const axeW = 560 + mesures.dx;
    $('#axe').setAttribute('d', `M440 320 L${440 + axeW} 320`);
    document.querySelectorAll('#contenu .geo-l').forEach((n) => n.setAttribute('d', `M0 1 L${axeW} 1`));
    ticks.forEach((t) => { t.n.style.left = (440 + (t.h - 10) * axeW / 14) + 'px'; });

    // calculs
    const res = st.lignes.map(calculer);
    const rows = [];
    st.lignes.forEach((c, i) => {
      const s = service(c.sid), y = 334 + i * 60;
      if (s.mode !== 'P3') { rows.push({ y, drag: false, lab: s.t + ' · en studio, horaire à fixer ensemble', x0: 440, w1: 0, x1: 440, w2: 0, rad: '8px', by: y + 18, dots: [], arc: 'M0 0', aArc: 'none' }); return; }
      const b = bande(c, s, 440, axeW / 14), connus = b.L.filter((z) => z.c >= 0), manqueL = b.L.some((z) => z.c === -1);
      let loin = null; connus.forEach((z) => { if (!loin || KM[z.c] > KM[loin.c]) loin = z; });
      const tr = (c.zone >= 0 && b.L.every((z) => z.c === -3)) ? ` · zone ${COMMUNES[c.zone]}` : manqueL ? ' · adresse requise' : loin ? ` · ${COMMUNES[loin.c]} ${virgule(KM[loin.c])} km` : '';
      const fx = loin ? b.X(loin.h) : 0;
      rows.push({ y, by: y + 18, ty: y + 13, drag: true, debT: hh(b.st0), finT: hh(b.st0 + c.dur), ariaD: 'Début · ' + s.t, ariaF: 'Fin · ' + s.t,
        lab: `${s.t} · ${hh(b.st0)} → ${hh(b.st0 + c.dur)}${tr}`, x0: b.x0, w1: b.w1, x1: b.x1, w2: b.w2, rad: b.rad, dots: [],
        arc: loin ? `M440 ${y + 36} Q ${Math.round((440 + fx) / 2)} ${y + 58} ${fx} ${y + 36}` : 'M0 0', aArc: loin ? `drawS 1.1s ${E} .9s both` : 'none' });
    });
    const lz0 = 334 + Math.max(1, st.lignes.length) * 60 + 16;
    const lignes = []; let ly = 0, k = 0;
    res.forEach((r, gi) => r.lignes.forEach((l) => {
      lignes.push({ gi, o: l.o, t: l.t, cls: 'l', v: l.ht === null ? '—' : eur(l.ht), y: ly, dl: (k * .05).toFixed(2) + 's', act: !!l.act, zOn: !!(l.act && r.s.tech) });
      ly += l.act ? (r.s.tech ? 204 : 70) : 30; k++;
      if (l.sub) { lignes.push({ gi, o: '', t: l.sub, cls: 'l s', v: '', y: ly - 6, dl: (k * .05).toFixed(2) + 's', act: false }); ly += 24; }
    }));
    const ht = Math.round(res.reduce((t, r) => t + r.ht, 0) * 100) / 100, tva = Math.round(ht * 21 + 1e-9) / 100, manque = res.some((r) => r.manque);
    const ok = res.length > 0 && !manque;

    // centre
    const nb = st.lignes.length ? st.lignes.length + (st.lignes.length > 1 ? ' prestations' : ' prestation') : 'vide';
    const devMot = $('#dev-t');
    devMot.querySelectorAll('.o,.f').forEach((n) => { n.textContent = 'Votre devis · ' + nb; });
    voir($('#msg-vide'), !st.lignes.length);
    liste($('#rows'), rows, (r, i) => i, creerRang, majRang);
    liste($('#arcs'), rows, (r, i) => i, () => svg('path', { pathLength: '100', style: { stroke: '#3AA6B5', strokeWidth: '1.2px' } }), (n, r) => { n.setAttribute('d', r.arc); animer(n, r.aArc); });
    liste($('#lz-in'), lignes, (l, i) => i, creerLigne, majLigne);
    const noAlbum = st.lignes.findIndex((c) => { const s = service(c.sid); return s.opts.includes('album') && !c.opts.includes('album'); });
    const sugOn = noAlbum >= 0 && st.sub === 'off';
    // La liste a sa hauteur d'origine (jusqu'à y = 680, la suggestion d'album occupe y = 690). Seulement si le contenu la dépasse,
    // elle descend jusqu'à y = 686 avec la suggestion affichée, ou dans le vide du panneau (y = 820) sans elle : plus de ligne coupée.
    const bas = sugOn ? 686 : 820, haut = ly + 10 > 680 - lz0 ? Math.min(ly + 10, bas - lz0) : 680 - lz0;
    Object.assign($('#lz').style, { top: lz0 + 'px', height: Math.max(60, haut) + 'px' });
    $('#lz-in').style.height = (ly + 10) + 'px';
    voir($('#sug'), sugOn);
    $('#sug-b').onclick = () => { st.lignes[noAlbum].opts = st.lignes[noAlbum].opts.concat('album'); sauver(); rendre(); };
    voir($('#promo-msg'), st.promo);

    // totaux : « À partir de · TVAC »
    $('#t-ht').textContent = eur(ht); $('#t-tva').textContent = eur(tva); $('#t-ttc').textContent = eur(Math.round((ht + tva) * 100) / 100);
    $('#soum-enc').style.opacity = ok ? '1' : '0';
    const sb = $('#soumettre'); sb.className = ok ? 'btn tv' : 'btn off tv'; sb.setAttribute('aria-disabled', ok ? 'false' : 'true');
    sb.onclick = () => { if (ok) soumettre(); };

    rendreSub(rows, Math.round((ht + tva) * 100) / 100);
    animer($('#page'), st.sub === 'open' ? `wOut .4s ${E} both` : (again ? `wIn .5s ${E} .05s both` : 'none'));
  }

  // ------------------------------------------------------------------ panneau de compte : enregistrer mon brouillon
  function rendreSub(rows, ttc) {
    voir($('#sub-pan'), st.sub !== 'off');
    const cr = st.subMode === 'create', busy = st.subPh === 'loading', ferme = st.sub === 'closing';
    animer($('#sub-verre'), ferme ? 'devOut .3s ease-out forwards' : 'habille .7s ease .35s both');
    animer($('#sub-trait'), ferme ? `undrawS .35s ${E} both` : `drawS .55s ${E} both`);
    animer($('#sub-ct'), ferme ? 'devOut .2s ease-out forwards' : 'habille .45s ease .5s both');
    voir($('#sub-form'), st.subPh !== 'done'); voir($('#sub-done'), st.subPh === 'done');
    const titre = cr ? 'Créez votre compte' : 'Connectez-vous';
    $('#sub-titre').textContent = titre; $('#sub-f').setAttribute('aria-label', titre);
    $('#sub-mdp').setAttribute('autocomplete', cr ? 'new-password' : 'current-password');
    $('#sub-mdp').placeholder = cr ? '8 caractères minimum' : '';
    $('#sub-aide').textContent = cr ? 'Un e-mail et un mot de passe suffisent. Rien n’est enregistré si vous arrêtez ici.' : 'Votre dossier sera rattaché à ce compte.';
    liste($('#sub-recap'), rows, (r, i) => i, () => el('p', { style: 'margin:0 0 10px;font:400 13.5px/1.5 Inter,sans-serif;color:#0D0E10' }), (n, r) => { n.textContent = r.lab; });
    $('#sub-ttc').textContent = eur(ttc);
    voir($('#sub-err-d'), !!st.subErr); $('#sub-err').textContent = st.subErr;
    const b = $('#sub-ok');
    b.className = busy ? 'btn off' : 'btn'; b.setAttribute('aria-disabled', busy ? 'true' : 'false');
    b.textContent = busy ? 'Enregistrement…' : (cr ? 'Créer mon compte et continuer' : 'Me connecter et continuer');
    $('#sub-enc').style.opacity = busy ? '0' : '1';
    $('#sub-autre').textContent = cr ? 'J’ai déjà un compte' : 'Créer un compte';
  }
  $('#sub-ok').addEventListener('click', envoyer);
  $('#sub-non').addEventListener('click', fermerSub);
  $('#sub-x').addEventListener('click', fermerSub);
  $('#sub-autre').addEventListener('click', () => { st.subMode = st.subMode === 'create' ? 'login' : 'create'; st.subErr = ''; rendre(); });
  $('#appliquer').addEventListener('click', () => { st.promo = true; rendre(); });

  vie.ecouter(document, 'keydown', (e) => { if (st.sub === 'open') clavierModale(e, $('#sub-pan'), fermerSub); });
  vie.ecouter(window, 'scene:resize', () => { rendre(); syncR(); });
  rendre();
  vie.timeout(syncR, 60);
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
