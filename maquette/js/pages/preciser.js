// Espace client · Préciser ma journée. Traduit PPreciser.dc.html (ruban de la journée + adresses exactes, repris de l'ancien panneau « Configurer ce service »).
// Le client connecté reprend son brouillon du simulateur public, indique l'adresse exacte de chaque lieu (privée, visible du
// photographe seulement), règle les horaires au clavier ou sur le ruban, voit le prix complet et SOUMET depuis ici.
// Prix, catalogue et distances : référence unique data/tarifs.js. Rien n'est envoyé : formulaires factices.
import { E } from '../lib/anim.js';
import { monterEntete } from '../lib/entete.js';
import { $, el, svg, ecrire, animer, liste, voir, texte } from '../lib/dom.js';
import { eurN as eur, hhmm as hh } from '../lib/format.js';
import { CATEGORIES, SERVICES, OPTIONS, KM, COMMUNES, DUREE_MIN, DUREE_MAX, hm, virgule, service, calculer, ville } from '../../data/tarifs.js';
import { mesures } from '../lib/scene.js';
import { creerVie } from '../lib/vie.js';
import { emailValide, erreurMdp } from '../lib/validation.js';
import { lirePrecision, sauverPrecision, viderBrouillons } from '../lib/brouillon.js';

let vie = null;

export function init() {
  vie = creerVie();


  // ------------------------------------------------------------------ catalogue et calculs : référence unique data/tarifs.js

  /** Bande de présence (foncée = heures incluses, claire = dépassement facturé) sur l'axe 10:00 → 24:00. */
  function bande(cfg, s, x0, sc) {
    const L = cfg.lieux.slice().sort((p, q) => p.h - q.h), st0 = L[0].h, inc = Math.min(cfg.dur, s.incl), ov = Math.max(0, cfg.dur - s.incl);
    const X = (h) => Math.round(x0 + (Math.min(24, Math.max(10, h)) - 10) * sc);
    return { L, st0, x0: X(st0), w1: X(st0 + inc) - X(st0), x1: X(st0 + inc), w2: X(st0 + inc + ov) - X(st0 + inc), rad: ov > 0 ? '8px 0 0 8px' : '8px', X };
  }

  // ------------------------------------------------------------------ état (équivalent du state de la planche)
  // Brouillon : précisions déjà saisies, sinon brouillon du simulateur public, sinon l'exemple de la planche (lib/brouillon.js).
  const sauver = () => sauverPrecision(st.lignes);

  const st = { lignes: lirePrecision(), pan: null, ph: 'off', promo: false, n: 0, sub: 'off', subMode: 'create', subPh: 'form', subErr: '' };
  let tP = 0, tS = 0, retour = null;      // retour : élément qui a ouvert le panneau (le focus y revient à la fermeture)

  function ouvrir(cfg, idx) {
    if (st.ph !== 'off') return;
    st.pan = { cfg: structuredClone(cfg), idx }; st.ph = 'open';
    retour = document.activeElement;
    rendre();
    sync();
    $('#pan-x').focus({ preventScroll: true });
  }
  function fermer(garder) {
    if (st.ph !== 'open') return;
    if (garder) { if (st.pan.idx === null) st.lignes.push(st.pan.cfg); else st.lignes[st.pan.idx] = st.pan.cfg; sauver(); }
    st.ph = 'closing'; st.n += 1; rendre();
    vie.clearTimeout(tP);
    tP = vie.timeout(() => { st.ph = 'off'; st.pan = null; rendre(); if (retour && retour.isConnected && !retour.hidden) retour.focus({ preventScroll: true }); retour = null; }, 380);
  }
  function maj(f, sauf) { st.pan = structuredClone(st.pan); f(st.pan.cfg); rendre(); sync(sauf); }
  function soumettre() {
    if (st.ph !== 'off' || st.sub !== 'off') return;
    Object.assign(st, { sub: 'open', subPh: 'form', subMode: 'create', subErr: '' });
    $('#sub-mail').value = ''; $('#sub-mdp').value = '';
    retour = document.activeElement;
    rendre();
    $('#sub-x').focus({ preventScroll: true });
  }
  function fermerSub() {
    if (st.sub !== 'open' || st.subPh === 'loading') return;
    st.sub = 'closing'; st.n += 1; rendre();
    vie.clearTimeout(tS);
    tS = vie.timeout(() => { st.sub = 'off'; st.subPh = 'form'; rendre(); if (retour && retour.isConnected) retour.focus({ preventScroll: true }); retour = null; }, 380);
  }
  function envoyer() {
    if (st.subPh !== 'form') return;
    const mail = $('#sub-mail').value.trim(), mdp = $('#sub-mdp').value;
    if (!emailValide(mail)) { st.subErr = 'Cette adresse email n’est pas valide.'; rendre(); return; }
    const errMdp = erreurMdp(mdp, st.subMode === 'create');
    if (errMdp) { st.subErr = errMdp; rendre(); return; }
    $('#sub-mdp').value = '';       // rien n'est conservé ni envoyé
    st.subPh = 'loading'; st.subErr = ''; rendre();
    vie.clearTimeout(tS);
    tS = vie.timeout(() => {
      st.subPh = 'done'; viderBrouillons(); rendre();
      const O = (dl, d) => `wIn ${d}s ${E} ${dl}s both`;
      ecrire($('#done-1'), 'Merci, votre dossier est en cours d’examen.'); animer($('#done-1'), { o: O(.1, .9), f: O(.26, .9) });
      ecrire($('#done-2'), 'Le photographe l’examine ; vous suivez tout dans votre dossier.'); animer($('#done-2'), { o: O(.7, .7), f: O(.86, .7) });
      animer($('#done-l'), 'habille .6s ease 1.2s both');
    }, 1300);
  }

  // ------------------------------------------------------------------ animations (rythme K = 0,62 ; rapide après la première interaction)
  const K = .62;
  function rythmes(again) {
    const T = (dl, d) => again ? { o: `wIn .3s ${E} ${(dl * .04).toFixed(2)}s both`, f: `wIn .3s ${E} ${(dl * .04 + .08).toFixed(2)}s both` }
      : { o: `wIn ${d * K}s ${E} ${(dl * K).toFixed(2)}s both`, f: `wIn ${d * K}s ${E} ${((dl + .25) * K).toFixed(2)}s both` };
    const H = (dl) => again ? 'habille .35s ease .1s both' : `habille 1s ease ${(dl * K).toFixed(2)}s both`;
    const a = {
      sep: `drawS ${.8 * K}s ${E} 0s both`, logo: T(.3, .8), sig: `wIn ${.5 * K}s ${E} ${1.35 * K}s both`,
      n0: T(.5, .45), n1: T(.6, .45), n2: T(.7, .45), n3: T(.8, .45), n4: T(.9, .45), navU: `wIn ${.5 * K}s ${E} ${1.2 * K}s both`,
      hFl: `habille 1s ease ${.9 * K}s both`, hCta: T(1.3, .45),
      eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .6), h1: T(.9, .8), h2: T(1.1, 1), sub: T(1.4, 1.2),
      pillL: again ? 'none' : `drawS ${1 * K}s ${E} ${1.2 * K}s both`, pill: again ? 'habille .3s ease both' : `habille 1.8s ease-in-out ${2.1 * K}s both`,
      pillC: 'apparait 1.8s ease-in-out 6s both, comete 24s linear 6s infinite', catT: T(1.6, .4),
      devT: T(1.8, .5), devL: again ? 'none' : `drawS ${1 * K}s ${E} ${1.8 * K}s both`, msg2: T(2.4, 1.2), promo: H(3.4),
      tL: again ? 'none' : `drawS ${1 * K}s ${E} ${2.0 * K}s both`, tB: again ? 'habille .3s ease both' : `habille 1.8s ease-in-out ${2.9 * K}s both`,
      totT: T(2.4, .4), axe: again ? 'none' : `drawS ${1.2 * K}s ${E} ${1.9 * K}s both`, tV: H(2.8), tVl: again ? 'none' : `drawS ${.6 * K}s ${E} ${2.8 * K}s both`
    };
    if (again) Object.assign(a, { sep: 'none', logo: T(0, .3), sig: 'none', n0: T(0, .3), n1: T(0, .3), n2: T(0, .3), n3: T(0, .3), n4: T(0, .3), hFl: 'none', hCta: T(0, .3) });
    return { a, T, H };
  }
  // Rythme d'entrée figé : après la première interaction seul le CONTENU change, rien de la page déjà dessinée ne se rejoue.
  const R = rythmes(false), Rq = rythmes(true);
  let panneauOuvert = false;     // un panneau était ouvert au rendu précédent (la page ne revient qu'à sa fermeture)
  const entete = monterEntete($('#entete'), { actif: 'dossiers', cta: 'Simuler un devis', avecDossiers: true, a: R.a });

  // Registre : (élément, fonction qui donne son animation courante), réappliqué à chaque rendu.
  const anims = [];
  const lier = (n, f) => { anims.push([n, f]); return n; };

  ecrire($('#eye'), 'Brouillon · à soumettre au photographe');
  ecrire($('#h1'), 'Précisez');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 48px/1 'Instrument Serif',serif" }, 'votre journée.'));
  ecrire($('#sub'), 'Repris de votre simulation · adresses privées, visibles du photographe seulement');
  ecrire($('#cat-t'), 'Catalogue');
  ecrire($('#msg2'), 'Ajoutez une prestation pour voir votre prix.');
  ecrire($('#tot-t'), 'Totaux');
  [['eye-trait', 'eyeL'], ['eye', 'eye'], ['h1', 'h1'], ['h2', 'h2'], ['sub', 'sub'], ['cat-t', 'catT'], ['dev-l', 'devL'], ['msg2', 'msg2'], ['tot-t', 'totT'],
    ['axe', 'axe'], ['tvl', 'tVl'], ['pill', 'pill'], ['pill-c', 'pillC'], ['promo', 'promo'], ['appliquer', 'promo'], ['tot-verre', 'tB'], ['soumettre', 'tV'], ['t-ttc', 'tV']]
    .forEach(([id, k]) => lier($('#' + id), () => (k === 'msg2' && st.n > 0 ? Rq.a : R.a)[k]));   // le message « vide » revient vite quand on retire tout
  document.querySelectorAll('.pill-l').forEach((n) => lier(n, () => R.a.pillL));
  document.querySelectorAll('.tot-l').forEach((n) => lier(n, () => R.a.tL));
  document.querySelectorAll('.tv').forEach((n) => { if (n.id !== 'soumettre' && n.id !== 't-ttc') lier(n, () => R.a.tV); });
  ecrire($('#dev-t'), 'Votre devis · vide');
  lier($('#dev-t'), () => R.a.devT);

  // ------------------------------------------------------------------ catalogue (colonne gauche)
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
        const cfg = s.mode === 'P3' ? { sid: s.id, dur: s.incl, opts: [], lieux: [{ c: -1, h: 14, adr: '' }] } : { sid: s.id, qty: 10, opts: [], lieux: [] };
        $('#srvs').append(el('button', { type: 'button', class: 'srv', 'aria-label': 'Ajouter ' + s.t + ' au devis', style: `top:${y}px`, on: { click: () => ouvrir(cfg, null) } },
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
  const dotsEl = (c) => el('span', { 'aria-hidden': 'true', style: 'position:absolute;width:10px;height:10px;box-sizing:border-box;border-radius:50%;border:1.5px solid #0D0E10;background:#FFFFFF;transition:left .6s cubic-bezier(.45,0,.2,1);animation:habille .4s ease 1s both' });

  function creerRang() {
    const lab = el('p', { class: 'mono rangee', style: 'position:absolute;left:440px;margin:0;color:#0D0E10;white-space:nowrap' });
    const b1 = el('span', { class: 'bande', 'aria-hidden': 'true', style: 'background:#0D0E10;box-shadow:0 10px 16px -8px rgba(13,14,16,.5);animation:wIn .9s cubic-bezier(.45,0,.2,1) .1s both' });
    const b2 = el('span', { class: 'bande', 'aria-hidden': 'true', style: 'border-radius:0 8px 8px 0;background:rgba(13,14,16,.28);animation:wIn .4s cubic-bezier(.45,0,.2,1) .95s both' });
    const dots = el('div', { style: 'display:contents' });
    const g = el('div', { style: 'display:contents' }, lab, b1, b2, dots);
    g._r = { lab, b1, b2, dots };
    return g;
  }
  function majRang(g, r) {
    const { lab, b1, b2, dots } = g._r;
    lab.textContent = r.lab; lab.style.top = r.y + 'px';
    Object.assign(b1.style, { left: r.x0 + 'px', top: r.by + 'px', width: r.w1 + 'px', borderRadius: r.rad });
    Object.assign(b2.style, { left: r.x1 + 'px', top: r.by + 'px', width: r.w2 + 'px' });
    liste(dots, r.dots, (d, i) => i, dotsEl, (n, d) => { n.style.left = d.x + 'px'; n.style.top = d.y + 'px'; });
  }

  function creerLigne() {
    const o = el('span', { class: 'o mono' }), t = el('span'), modif = el('button', { type: 'button', class: 'mini' }, 'Préciser lieux et horaires'), ret = el('button', { type: 'button', class: 'mini' }, 'Retirer');
    const actions = el('span', { style: 'display:flex;gap:16px;margin-top:4px' }, modif, ret);
    const v = el('span', { class: 'v' });
    const n = el('div', { class: 'ligne rangee' }, el('span', { class: 'g' }, o, el('span', null, t, actions)), v);
    n._r = { o, t, actions, v, gi: 0 };
    modif.addEventListener('click', () => ouvrir(st.lignes[n._r.gi], n._r.gi));
    ret.addEventListener('click', () => { st.lignes = st.lignes.filter((_, i) => i !== n._r.gi); st.n += 1; sauver(); rendre(); });
    return n;
  }
  function majLigne(n, l) {
    const r = n._r;
    r.o.textContent = l.o; r.t.className = l.cls; r.t.textContent = l.t; r.v.textContent = l.v; r.gi = l.gi;
    n.style.top = l.y + 'px'; n.style.animationDelay = l.dl; r.actions.hidden = !l.act;
  }

  function rendre() {
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
      if (s.mode !== 'P3') { rows.push({ y, lab: s.t + ' · en studio, horaire à fixer ensemble', x0: 440, w1: 0, x1: 440, w2: 0, rad: '8px', by: y + 18, dots: [], arc: 'M0 0', aArc: 'none' }); return; }
      const b = bande(c, s, 440, (560 + mesures.dx) / 14), connus = b.L.filter((z) => z.c >= 0);
      let loin = null; connus.forEach((z) => { if (!loin || KM[z.c] > KM[loin.c]) loin = z; });
      const tr = b.L.some((z) => z.c === -1) ? ' · adresse requise' : loin ? ` · ${COMMUNES[loin.c]} ${virgule(KM[loin.c])} km` : '';
      const fx = loin ? b.X(loin.h) : 0;
      rows.push({ y, by: y + 18, lab: `${s.t} · ${hh(b.st0)} → ${hh(b.st0 + c.dur)}${tr}`, x0: b.x0, w1: b.w1, x1: b.x1, w2: b.w2, rad: b.rad,
        dots: b.L.map((z) => ({ x: b.X(z.h) - 5, y: y + 21 })),
        arc: loin ? `M440 ${y + 36} Q ${Math.round((440 + fx) / 2)} ${y + 58} ${fx} ${y + 36}` : 'M0 0', aArc: loin ? `drawS 1.1s ${E} .9s both` : 'none' });
    });
    const lz0 = 334 + Math.max(1, st.lignes.length) * 60 + 16;
    const lignes = []; let ly = 0, k = 0;
    res.forEach((r, gi) => r.lignes.forEach((l) => {
      lignes.push({ gi, o: l.o, t: l.t, cls: 'l', v: l.ht === null ? '—' : eur(l.ht), y: ly, dl: (k * .05).toFixed(2) + 's', act: !!l.act });
      ly += l.act ? 50 : 30; k++;
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
    Object.assign($('#lz').style, { top: lz0 + 'px', height: Math.max(60, 680 - lz0) + 'px' });
    $('#lz-in').style.height = (ly + 10) + 'px';

    const noAlbum = st.lignes.findIndex((c) => { const s = service(c.sid); return s.opts.includes('album') && !c.opts.includes('album'); });
    voir($('#sug'), noAlbum >= 0 && st.ph === 'off');
    $('#sug-b').onclick = () => ouvrir(st.lignes[noAlbum], noAlbum);
    voir($('#promo-msg'), st.promo);

    // totaux
    $('#t-ht').textContent = eur(ht); $('#t-tva').textContent = eur(tva); $('#t-ttc').textContent = eur(Math.round((ht + tva) * 100) / 100);
    $('#t-lab').textContent = 'Total TVAC' + (manque ? ' · incomplet' : '');
    voir($('#t-manque'), manque);
    $('#soum-enc').style.opacity = ok ? '1' : '0';
    const sb = $('#soumettre'); sb.className = ok ? 'btn tv' : 'btn off tv'; sb.setAttribute('aria-disabled', ok ? 'false' : 'true');
    sb.onclick = () => { if (ok) soumettre(); };

    rendrePanneau();
    rendreSub(rows, Math.round((ht + tva) * 100) / 100);
    // la page s'efface pendant qu'un panneau est ouvert et ne revient qu'à sa fermeture ; une simple mise à jour ne l'anime pas
    const ouvert = st.ph === 'open' || st.sub === 'open', retourPage = panneauOuvert && !ouvert;
    panneauOuvert = ouvert;
    animer($('#page'), ouvert ? `wOut .4s ${E} both` : (retourPage ? `wIn .5s ${E} .05s both` : 'none'));
  }

  // ------------------------------------------------------------------ panneau E01.a
  // ------------------------------------------------------------------ ruban de la journée (06:00 → 24:00), heures et adresses
  const J0 = 6, JW = 560, JX = (h) => Math.round((Math.min(24, Math.max(J0, h)) - J0) * JW / 18);
  const d0De = (cfg) => (cfg.lieux && cfg.lieux.length ? Math.min(...cfg.lieux.map((z) => z.h)) : 14);
  [6, 9, 12, 15, 18, 21, 24].forEach((hr) => $('#jr-ticks').append(el('span', { 'aria-hidden': 'true', style: `position:absolute;left:${JX(hr) - 16}px;top:62px;width:32px;text-align:center;font:500 9.5px 'IBM Plex Mono',monospace;color:#8C8E93` }, String(hr).padStart(2, '0') + ':00')));

  /** Règles du ruban : début indépendant (la fin reste fixe), fin règle la durée, chaque lieu par sa poignée. */
  function surRuban(k, v) {
    if (st.ph !== 'open') return;
    maj((c) => {
      const L = c.lieux, d0 = Math.min(...L.map((z) => z.h));
      if (k === 'fin') c.dur = Math.max(DUREE_MIN, Math.min(DUREE_MAX, v - d0));
      else if (k === 'debut') { const fin = d0 + c.dur, v2 = Math.max(6, Math.min(fin - DUREE_MIN, v)); L.forEach((z) => { if (z.h === d0 || z.h < v2) z.h = v2; }); c.dur = Math.max(DUREE_MIN, Math.min(DUREE_MAX, fin - v2)); }
      else if (k[0] === 'l') L[Number(k.slice(1))].h = v;
    }, k);
  }
  $('#jr-debut').addEventListener('input', (e) => surRuban('debut', Number(e.target.value)));
  $('#jr-fin').addEventListener('input', (e) => surRuban('fin', Number(e.target.value)));

  /** Recopie l'état dans les champs (poignées, heures, adresses) sans écraser celui que l'on est en train de manipuler. */
  function sync(sauf) {
    if (!st.pan || !st.pan.cfg.lieux) return;
    const c = st.pan.cfg, d0 = d0De(c), act = document.activeElement;
    const poser = (n, v) => { if (n && !(n === act && sauf) && Number(n.value) !== v) n.value = v; };
    poser($('#jr-debut'), d0); poser($('#jr-fin'), d0 + c.dur);
    document.querySelectorAll('#jr-pins .jr.lieu').forEach((n, i) => poser(n, (c.lieux[i] || {}).h));
    const dte = $('#sim-date'); if (dte && dte !== act && dte.value !== (c.date || '')) dte.value = c.date || '';
    document.querySelectorAll('#pan-lieux [data-heure]').forEach((n) => { const z = c.lieux[Number(n.dataset.heure)]; if (z && n !== act && n.value !== hh(z.h)) n.value = hh(z.h); });
    if (sauf !== 'adr') document.querySelectorAll('#pan-lieux [data-adr]').forEach((n) => { const z = c.lieux[Number(n.dataset.adr)]; if (z && n !== act && n.value !== (z.adr || '')) n.value = z.adr || ''; });
  }

  // poignées cyan : une par lieu, avec son numéro au-dessus et son heure en cyan dessous
  function creerPin() {
    const n = el('span', { 'aria-hidden': 'true', style: "position:absolute;top:-16px;width:12px;text-align:center;font:500 9.5px 'IBM Plex Mono',monospace;color:#3AA6B5" });
    const hl = el('span', { 'aria-hidden': 'true', style: "position:absolute;top:42px;width:40px;text-align:center;font:500 10.5px 'IBM Plex Mono',monospace;color:#3AA6B5" });
    const inp = el('input', { type: 'range', class: 'jr lieu', min: '6', max: '23.5', step: '0.25', style: 'top:-1px;width:560px;height:24px' });
    const w = el('div', { style: 'display:contents' }, n, hl, inp);
    inp.addEventListener('input', () => surRuban('l' + w._r.i, Number(inp.value)));
    w._r = { n, hl, inp, i: 0 };
    return w;
  }
  function majPin(w, z, i) {
    const r = w._r; r.i = i;
    r.n.style.left = (JX(z.h) - 6) + 'px'; texte(r.n, String(i + 1));
    r.hl.style.left = (JX(z.h) - 20) + 'px'; texte(r.hl, hh(z.h));
    r.inp.setAttribute('aria-label', 'Heure d’arrivée au lieu ' + (i + 1)); r.inp.setAttribute('aria-valuetext', hh(z.h));
  }

  // lieux : heure (input time, pas de 15 min), adresse libre, état du transport
  const lieuxL = el('div', { style: 'display:contents' });
  $('#pan-lieux').prepend(lieuxL);
  function creerLieu() {
    const lab = el('label', { class: 'mono', style: 'color:#3AA6B5' });
    const heure = el('input', { class: 'heure', type: 'time', step: '900', min: '06:00', max: '23:30' });
    const retirer = el('button', { type: 'button', class: 'mini', style: 'margin-left:auto' }, 'Retirer ce lieu');
    const adr = el('input', { type: 'text', autocomplete: 'street-address', maxlength: '200', placeholder: 'N° et rue, code postal, commune' });
    const point = el('span', { 'aria-hidden': 'true', style: 'display:block;width:6px;height:6px;border-radius:3px' });
    const etat = document.createTextNode('');
    const n = el('div', { class: 'rangee', style: 'position:absolute;left:0;width:560px' },
      el('div', { style: 'display:flex;align-items:baseline;gap:12px' }, lab, heure, retirer),
      el('div', { class: 'champ adr', style: 'width:520px;margin-top:2px' }, adr),
      el('p', { class: 'note', style: 'margin:6px 0 0;display:flex;align-items:center;gap:8px;font-size:12px' }, point, etat));
    n._r = { lab, heure, retirer, adr, point, etat, i: 0 };
    heure.addEventListener('input', () => {   // une heure tapée est arrondie au quart d'heure
      const m = /^(\d{1,2}):(\d{2})/.exec(heure.value || ''); if (!m || st.ph !== 'open') return;
      const k = n._r.i, hr = Math.max(6, Math.min(23.5, Math.round((Number(m[1]) + Number(m[2]) / 60) * 4) / 4));
      maj((c) => { c.lieux[k].h = hr; }, 'heure');
    });
    adr.addEventListener('input', () => { if (st.ph !== 'open') return; const k = n._r.i, v = adr.value; maj((c) => { c.lieux[k].adr = v; c.lieux[k].c = ville(v); }, 'adr'); });
    retirer.addEventListener('click', () => maj((c) => { c.lieux.splice(n._r.i, 1); }));
    return n;
  }
  function majLieu(n, z, i) {
    const r = n._r; r.i = i;
    n.style.top = (i * 86) + 'px';
    r.heure.id = 'heure-' + i; r.heure.dataset.heure = String(i); r.heure.setAttribute('aria-label', 'Heure d’arrivée au lieu ' + (i + 1));
    r.adr.id = 'adr-' + i; r.adr.dataset.adr = String(i); r.adr.setAttribute('aria-label', 'Adresse exacte du lieu ' + (i + 1));
    r.lab.htmlFor = 'heure-' + i; texte(r.lab, 'Lieu ' + (i + 1) + ' :');
    r.retirer.hidden = i === 0;
    const zone = st.pan.cfg.zone;
    const e = z.c === -1 ? [zone >= 0 ? 'Adresse à indiquer · zone choisie : ' + COMMUNES[zone] : 'Adresse à indiquer pour calculer le transport', '#7A1F33']
      : z.c === -2 ? ['Adresse notée · distance confirmée par le photographe', '#D9783A']
        : ['Distance calculée : ' + COMMUNES[z.c] + ' · ' + virgule(KM[z.c]) + ' km', '#3AA6B5'];
    if (r.etat.nodeValue !== e[0]) r.etat.nodeValue = e[0];
    r.point.style.background = e[1];
  }
  function creerOption() {
    const t = document.createTextNode(''), v = el('span', { class: 'v' });
    const n = el('button', { type: 'button', class: 'opt', 'aria-pressed': 'false' },
      el('span', { class: 'c' }, el('span', { class: 'bx', 'aria-hidden': 'true' }, svg('svg', { viewBox: '0 0 24 24' }, svg('path', { d: 'M5 12 L10 17 L19 7' }))), t), v);
    n._r = { t, v, k: '' };
    n.addEventListener('click', () => { const k = n._r.k; maj((c) => { c.opts = c.opts.includes(k) ? c.opts.filter((x) => x !== k) : c.opts.concat(k); }); });
    return n;
  }
  function creerPrix() { const a = el('span'), b = el('span', { style: "font:500 12.5px 'IBM Plex Mono',monospace;white-space:nowrap" }); const n = el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:6px 0;font:400 13.5px Inter,sans-serif' }, a, b); n._r = { a, b }; return n; }

  function rendrePanneau() {
    voir($('#pan'), !!st.pan);
    if (!st.pan) return;
    const cfg = st.pan.cfg, r = calculer(cfg), s = r.s, fermeture = st.ph === 'closing', P3 = s.mode === 'P3';
    $('#pan').setAttribute('aria-label', 'Configurer ' + s.t);
    $('#sim-date').setAttribute('aria-label', 'Date du shooting · ' + s.t);
    animer($('#pan-verre'), fermeture ? 'devOut .3s ease-out forwards' : 'habille .7s ease .35s both');
    animer($('#pan-trait'), fermeture ? `undrawS .35s ${E} both` : `drawS .55s ${E} both`);
    animer($('#pan-ct'), fermeture ? 'devOut .2s ease-out forwards' : 'habille .45s ease .5s both');
    $('#pan-svc').textContent = s.t;
    const note = P3
      ? (cfg.dur <= 2 ? 'Durée minimale : 2 h.' : cfg.dur >= 14 ? 'La durée maximale est de 14 h.' : cfg.dur <= s.incl ? `Facturé au forfait : ${hm(s.incl)} incluses.` : 'Au-delà du forfait, chaque demi-heure entamée est facturée.')
      : (cfg.qty <= s.min || cfg.qty >= s.max ? `La quantité est comprise entre ${s.min} et ${s.max}.` : `${s.unit},00 € par plat.`);
    voir($('#pan-ruban'), s.tech); voir($('#pan-studio-blk'), !s.tech);
    if (P3) {
      const d0 = d0De(cfg), incl = Math.min(cfg.dur, s.incl), ov = Math.max(0, cfg.dur - s.incl);
      $('#pan-jlab').textContent = 'La journée · ' + hh(d0) + ' → ' + hh(d0 + cfg.dur) + ' · ' + hm(cfg.dur);
      Object.assign($('#jr-b1').style, { left: JX(d0) + 'px', width: (JX(d0 + incl) - JX(d0)) + 'px', borderRadius: ov > 0 ? '8px 0 0 8px' : '8px' });
      Object.assign($('#jr-b2').style, { left: JX(d0 + incl) + 'px', width: (JX(d0 + incl + ov) - JX(d0 + incl)) + 'px' });
      $('#jr-deb').style.left = (JX(d0) - 20) + 'px'; texte($('#jr-deb'), hh(d0));
      $('#jr-finh').style.left = (JX(d0 + cfg.dur) - 20) + 'px'; texte($('#jr-finh'), hh(d0 + cfg.dur));
      $('#jr-debut').setAttribute('aria-valuetext', hh(d0)); $('#jr-fin').setAttribute('aria-valuetext', hh(d0 + cfg.dur));
      liste($('#jr-pins'), cfg.lieux || [], (z, i) => i, creerPin, majPin);
      $('#pan-jnote').textContent = note + ' Glissez les poignées : début et fin en noir, arrivée à chaque lieu en cyan.';
    } else {
      $('#pan-plab').textContent = 'Nombre de plats';
      $('#pan-pval').textContent = String(cfg.qty);
      $('#pan-pnote').textContent = note;
      $('#pan-moins').onclick = () => maj((c) => { c.qty = Math.max(s.min, c.qty - 1); });
      $('#pan-plus').onclick = () => maj((c) => { c.qty = Math.min(s.max, c.qty + 1); });
    }
    voir($('#pan-tech'), s.tech); voir($('#pan-studio'), !s.tech);
    liste(lieuxL, cfg.lieux || [], (z, i) => i, creerLieu, majLieu);
    const btnPlus = $('#pan-ajlieu');
    voir(btnPlus, s.tech && cfg.lieux.length < 12);
    btnPlus.style.top = (cfg.lieux.length * 86) + 'px';
    $('#pan-lieux').style.height = (cfg.lieux.length * 86 + 36) + 'px';
    btnPlus.onclick = () => maj((c) => { c.lieux.push({ c: -1, h: Math.min(23.5, c.lieux[c.lieux.length - 1].h + 2), adr: '' }); });
    liste($('#pan-opts'), s.opts, (k) => k, creerOption, (n, k) => {
      const on = cfg.opts.includes(k);
      n._r.k = k; n._r.t.nodeValue = OPTIONS[k][0]; n._r.v.textContent = eur(OPTIONS[k][1]);
      n.className = on ? 'opt on' : 'opt'; n.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    liste($('#pan-prix'), r.lignes, (l, i) => i, creerPrix, (n, l) => {
      n.style.color = l.ht === null ? '#4B4D52' : '#0D0E10'; n._r.a.textContent = l.t; n._r.b.textContent = l.ht === null ? 'Adresse requise' : eur(l.ht);
    });
    $('#pan-st').textContent = eur(r.ht);
    $('#pan-ok').textContent = st.pan.idx === null ? 'Ajouter au devis' : 'Enregistrer';
  }
  $('#sim-date').addEventListener('input', (e) => { if (st.ph === 'open') maj((c) => { c.date = e.target.value.slice(0, 10); }, 'date'); });
  $('#pan-ok').addEventListener('click', () => fermer(true));
  $('#pan-non').addEventListener('click', () => fermer(false));
  $('#pan-x').addEventListener('click', () => fermer(false));

  // ------------------------------------------------------------------ panneau E01.b
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
    b.textContent = busy ? 'Soumission…' : (cr ? 'Créer mon compte et soumettre' : 'Me connecter et soumettre');
    $('#sub-enc').style.opacity = busy ? '0' : '1';
    $('#sub-autre').textContent = cr ? 'J’ai déjà un compte' : 'Créer un compte';
  }
  $('#sub-ok').addEventListener('click', envoyer);
  $('#sub-non').addEventListener('click', fermerSub);
  $('#sub-x').addEventListener('click', fermerSub);
  $('#sub-autre').addEventListener('click', () => { st.subMode = st.subMode === 'create' ? 'login' : 'create'; st.subErr = ''; rendre(); });
  $('#appliquer').addEventListener('click', () => { st.promo = true; rendre(); });

  vie.ecouter(document, 'keydown', (e) => { if (e.key !== 'Escape') return; if (st.ph === 'open') fermer(false); else if (st.sub === 'open') fermerSub(); });
  vie.ecouter(window, 'scene:resize', () => rendre());
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
