// Galerie : filtres par service, flux de photos justifié groupé par événement, témoignage qui défile,
// photo agrandie (le fond se décompose, retour rapide). Traduit PGalerie.dc.html.
import { E } from '../lib/anim.js';
import { el, svg, mot, animer, liste, cheminSvg, cadrePhoto, setMot } from '../lib/dom.js';
import { monterEntete, majEntete, enteteMontee } from '../lib/entete.js';
import { creerVie } from '../lib/vie.js';
import { mesures } from '../lib/scene.js';
import { param } from '../lib/params.js';
import { memoriserFocus } from '../lib/modale.js';
import { creerPhotoAgrandie } from '../lib/photo-agrandie.js';
import { PHOTOS, habillePhoto } from '../../data/photos-site.js';
import { SVC, EVT } from '../../data/galerie-evenements.js';

let vie = null;

export function init(racine) {
vie = creerVie();
const dejaLa = enteteMontee();
const K = .62;
const FIGE = { o: 'wIn 0s both', f: 'wIn 0s both' };
// En-tête persistant : quand on arrive d'une autre page, il ne rejoue pas son entrée (sauf pendant la photo agrandie).
function enteteAnim(a, dissolve) {
  if (!dejaLa || dissolve || (S.retour && !S.out)) return a;
  return { ...a, sep: 'drawS 0s both', logo: FIGE, sig: 'wIn 0s both', n0: FIGE, n1: FIGE, n2: FIGE, n3: FIGE, navU: 'wIn 0s both', hFl: 'habille 0s both', hCta: FIGE };
}

// ---- contenus ----------------------------------------------------------------------------------------------
const TEM = ['« [Ce que le client a ressenti en découvrant les photos.] »', '« [Un moment qu’il revit grâce aux images.] »'];

// ---- lignes justifiées ------------------------------------------------------------------------------------
function justifie(list, W, rowH, gap, padTop, legende) {  // W = largeur utile du flux (980 + gain de la fenêtre)
  const out = []; let y = padTop, row = [], sum = 0;
  const flush = (last) => {
    if (!row.length) return;
    let h = (W - gap * (row.length - 1)) / sum;
    if (last && h > rowH * 1.25) h = rowH;
    let x = 0;
    row.forEach((it) => { const w = it.r * h; out.push({ ...it, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }); x += w + gap; });
    y += h + gap + legende; row = []; sum = 0;
  };
  list.forEach((it) => {
    const hNo = row.length ? (W - gap * (row.length - 1)) / sum : Infinity;
    const hWith = (W - gap * row.length) / (sum + it.r);
    if (hWith < rowH && row.length && Math.abs(hNo - rowH) < Math.abs(hWith - rowH)) { flush(false); row.push(it); sum = it.r; return; }
    row.push(it); sum += it.r;
    if (hWith < rowH) flush(false);
  });
  flush(true);
  return { items: out, H: Math.round(y) };
}

// ---- état --------------------------------------------------------------------------------------------------
// svc : filtre repris de l'adresse (?service=Mariages, liste blanche SVC), -1 = tout
const S = { svc: SVC.indexOf(param('service', SVC, '')), n: 0, lb: null, lbN: 0, lbSt: 'from', lbR: null, tq: 0, tqOut: false, out: false, retour: false, sh: 0, lbLast: null };
let rects = [], tLb, rendreFocus = null;   // rendreFocus : rend le focus à la vignette cliquée à la fermeture de la photo agrandie
const set = (patch) => { Object.assign(S, patch); render(); };

// ---- décor statique ----------------------------------------------------------------------------------------
const ent = monterEntete(racine, { actif: 'galerie', a: { sep: 'none', logo: { o: '', f: '' }, sig: 'none', n0: { o: '', f: '' }, n1: { o: '', f: '' }, n2: { o: '', f: '' }, n3: { o: '', f: '' }, hFl: 'none', hCta: { o: '', f: '' }, navU: 'none' } });
const eyeW = el('span', { class: 'w' }), eyeTrait = el('span', { 'aria-hidden': 'true', style: 'display:block;width:28px;height:1px;background:#D9783A' });
racine.append(el('p', { class: 'mono', style: 'position:absolute;left:80px;top:136px;margin:0;display:flex;align-items:center;gap:14px' }, eyeTrait, eyeW));
const h1W = el('span', { class: 'w' }), h2W = el('span', { class: 'w' });
racine.append(el('h1', { style: 'position:absolute;left:78px;top:164px;margin:0;font:300 34px/1.12 Inter,sans-serif;letter-spacing:-.03em;filter:drop-shadow(0 6px 9px rgba(20,18,16,.18))' }, h1W, el('br'), h2W));

const pastille = el('div', { class: 'verre', 'aria-hidden': 'true', style: 'left:64px;top:300px;width:268px;height:372px;opacity:0' });
const pl1 = cheminSvg('M0 186 L0 24 A24 24 0 0 1 24 0 L244 0 A24 24 0 0 1 268 24 L268 186'), pl2 = cheminSvg('M0 186 L0 348 A24 24 0 0 0 24 372 L244 372 A24 24 0 0 0 268 348 L268 186');
const plC = cheminSvg('M0 186 L0 24 A24 24 0 0 1 24 0 L244 0 A24 24 0 0 1 268 24 L268 348 A24 24 0 0 1 244 372 L24 372 A24 24 0 0 1 0 348 Z', { class: 'comete', style: 'stroke:#D9783A' });
const pillSvg = svg('svg', { class: 'ln', 'aria-hidden': 'true', style: 'left:64px;top:300px;width:268px;height:372px' }, pl1, pl2, plC);
const filtresNav = el('nav', { 'aria-label': 'Filtrer par service', style: 'position:absolute;left:88px;top:316px;width:220px;display:flex;flex-direction:column' });
const indic = el('span', { 'aria-hidden': 'true', style: 'position:absolute;left:88px;height:2px;border-radius:1px;background:#3AA6B5;transition:top .5s cubic-bezier(.45,0,.2,1),width .5s cubic-bezier(.45,0,.2,1) .12s' });
const repHote = el('div', { style: 'display:contents' }), temHote = el('div', { style: 'display:contents' }), vueHote = el('div', { style: 'display:contents' });
const inner = el('div', { style: 'position:relative;width:1004px' }, repHote, temHote, vueHote);
const zone = el('div', { class: 'zone', 'data-zone': '1' }, inner);
const dFl = el('span', { class: 'encre', 'aria-hidden': 'true', style: 'position:absolute;left:80px;top:712px;width:200px;height:44px;border-radius:22px' });
const dCtaW = mot('Demander un devis');
const dCta = el('a', { href: 'simulateur.html', class: 'btn', style: 'left:80px;top:712px;width:200px;height:44px;border-radius:22px' }, dCtaW);
const lbHote = el('div', { style: 'display:contents' });
racine.append(pastille, pillSvg, filtresNav, indic, zone, dFl, dCta, lbHote);

// ---- actions -----------------------------------------------------------------------------------------------
const vignetteRect = (i) => {
  const r = rects[i];
  return r ? { x: 372 + r.x, y: 120 + r.y - zone.scrollTop, w: r.w, h: r.h } : { x: 720, y: 440, w: 0, h: 0 };
};
function ouvrir(i) {
  if (S.lb !== null) return;
  rendreFocus = memoriserFocus();
  vie.clearTimeout(tLb); set({ lb: i, lbSt: 'from', lbN: 0, lbR: vignetteRect(i), lbLast: null });
  tLb = vie.timeout(() => set({ lbSt: 'to' }), 40);
}
function fermer() {
  if (S.lbSt !== 'to') return;
  set({ lbSt: 'closing', lbR: vignetteRect(S.lb), n: S.n + 1, retour: true, lbLast: S.lb });
  vie.clearTimeout(tLb); tLb = vie.timeout(() => { set({ lb: null, lbSt: 'from' }); if (rendreFocus) rendreFocus(); rendreFocus = null; }, 760);
}
function changer(i) {
  if (S.out || i === S.svc) return;
  set({ out: true, lb: null, retour: false, lbLast: null });
  vie.timeout(() => set({ svc: i, n: S.n + 1, sh: S.sh + 1, out: false }), 480);
  // le filtre est partageable : l'adresse porte ?service=… (sans entrée d'historique supplémentaire)
  history.replaceState(history.state, '', window.location.pathname + (i < 0 ? '' : '?service=' + encodeURIComponent(SVC[i])) + window.location.hash);
}
vie.interval(() => { set({ tqOut: true }); vie.timeout(() => set({ tq: S.tq + 1, tqOut: false }), 700); }, 7500);

// ---- helpers de rendu --------------------------------------------------------------------------------------
const italique = (s) => el('i', { style: "font:italic 400 40px/1 'Instrument Serif',serif" }, s);

// ---- rendu -------------------------------------------------------------------------------------------------
function render() {
  const T = (dl, d, alt) => ({ o: `${alt ? 'wIn2' : 'wIn'} ${d * K}s ${E} ${dl * K}s both`, f: `${alt ? 'wIn2' : 'wIn'} ${d * K}s ${E} ${(dl + .25) * K}s both` });
  const alt = S.n % 2 === 1, first = S.n === 0;
  const a = {
    sep: `drawS ${.8 * K}s ${E} 0s both`, logo: T(.3, .8), sig: `wIn ${.5 * K}s ${E} ${1.35 * K}s both`,
    n0: T(.5, .45), n1: T(.6, .45), n2: T(.7, .45), n3: T(.8, .45), navU: `wIn ${.5 * K}s ${E} ${1.2 * K}s both`,
    hFl: `habille 1s ease ${.9 * K}s both`, hCta: T(1.3, .45),
    eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .6, alt), h1: T(.9, .9, alt), h2: T(1.15, .9, alt),
    pillL: `drawS ${.9 * K}s ${E} ${1.1 * K}s both`, pill: `habille 1.8s ease-in-out ${2.0 * K}s both`,
    pillC: 'apparait 1.8s ease-in-out 5s both, comete 20s linear 5s infinite',
    indA: `wIn ${.5 * K}s ${E} ${2.6 * K}s both`, dFl: `habille 1.2s ease ${2.6 * K}s both`, dCta: T(3.0, .45)
  };
  const txt = S.svc < 0 ? { h1: 'Tous les', h2: 'instants.' } : { h1: SVC[S.svc], h2: 'en images.' };
  const counts = SVC.map((_, i) => EVT.filter((e) => e.svc === i).reduce((t, e) => t + e.ph.length, 0));
  const total = counts.reduce((t, c) => t + c, 0);
  const filtres = [{ t: 'Tout', i: -1 }].concat(SVC.map((t, i) => ({ t, i }))).map((f, k) => ({
    ...f, n: String(f.i < 0 ? total : counts[f.i]).padStart(2, '0'), on: S.svc === f.i, a: T(1.6 + k * .1, .45), ak: T(1.85 + k * .1, .35).o
  }));
  const fi = S.svc + 1, ind = { y: Math.round(316 + fi * 41 + 34), w: Math.round(filtres[fi].t.length * 9.2) };
  const D0 = first ? 1.6 * K : .1;

  // -- flux de photos : repères, témoignage, vignettes --
  const dx = mesures.dx, FW = 980 + dx;   // flux de photos : toute la largeur restante
  const evts = EVT.filter((e) => S.svc < 0 || e.svc === S.svc);
  const reperes = [], vues = [], flat = [], temoins = [];
  let y = 6, k = 0;
  evts.forEach((e, ei) => {
    const d0 = D0 + ei * .5, w2 = alt ? 'wIn2' : 'wIn';
    reperes.push({ y, tag: e.tag, txt: e.txt,
      a: { o: `${w2} .5s ${E} ${d0.toFixed(2)}s both`, f: `${w2} .5s ${E} ${(d0 + .16).toFixed(2)}s both` },
      b: { o: `${w2} .7s ${E} ${(d0 + .2).toFixed(2)}s both`, f: `${w2} .7s ${E} ${(d0 + .36).toFixed(2)}s both` },
      l: `drawS .9s ${E} ${(d0 + .1).toFixed(2)}s both` });
    y += 52;
    const items = e.ph.map((p) => ({ r: PHOTOS[p].r, p }));
    const seed = (ei * 7 + S.sh * 3 + 5) % 97, pos = 1 + (seed % items.length);
    items.splice(pos, 0, { r: 1.5, temoin: true });
    const L = justifie(items, FW, 220, 14, 0, 0);
    let j = 0;
    L.items.forEach((v) => {
      if (v.temoin) {
        const tb = d0 + .3 + e.ph.length * .1 + .4, qi = S.tq % TEM.length, qa = S.tq % 2 === 1;
        const wr = (dl, d) => S.tqOut
          ? { o: `wOut .35s ${E} .04s both`, f: `wOut .32s ${E} 0s both` }
          : S.tq === 0
            ? { o: `${w2} ${d}s ${E} ${(tb + dl).toFixed(2)}s both`, f: `${w2} ${d}s ${E} ${(tb + dl + .18).toFixed(2)}s both` }
            : { o: `${qa ? 'wIn2' : 'wIn'} ${d}s ${E} ${(dl * .5).toFixed(2)}s both`, f: `${qa ? 'wIn2' : 'wIn'} ${d}s ${E} ${(dl * .5 + .18).toFixed(2)}s both` };
        const pad = Math.round(Math.max(22, v.h * .12)), fs = Math.round(Math.max(17, Math.min(26, v.h * .095)));
        temoins.push({ x: v.x, y: v.y + y, w: v.w, h: v.h, p: pad, tw: v.w - pad * 2, fs: fs + 3,
          quote: TEM[qi], who: '— ' + (e.who || '[Prénom du client]'), pos: (qi + 1) + ' / ' + TEM.length, q: wr(1.2, 1.1), c: wr(1.7, .6) });
        return;
      }
      const dl = (d0 + .3 + j * .1).toFixed(2), nb = k % 4 === 2, idx = flat.length;
      flat.push({ p: v.p, tag: e.tag, x: v.x, y: v.y + y, w: v.w, h: v.h });
      vues.push({ ...v, nb, y: v.y + y, idx, label: 'Agrandir la photo ' + (idx + 1),
        anim: `${nb ? (alt ? 'devNB2' : 'devNB') : (alt ? 'dev2' : 'dev')} 2.4s ease-in-out ${dl}s both`,
        tr: `${alt ? 'trace2' : 'trace'} 2s ${E} ${dl}s both` });
      k++; j++;
    });
    y += L.H + 36;
  });
  const zoneH = Math.max(740, y + 20);
  const dissolve = S.lb !== null && S.lbSt !== 'closing';
  if (S.out || dissolve) {
    const wo = (k2) => ({ o: `wOut .3s ${E} ${(k2 * .02).toFixed(2)}s both`, f: `wOut .28s ${E} ${(k2 * .02).toFixed(2)}s both` });
    vues.forEach((v, i2) => { v.anim = `devOut .3s ease-out ${(i2 * .02).toFixed(2)}s forwards`; v.tr = 'none'; });
    reperes.forEach((r, i2) => { r.a = wo(i2); r.b = wo(i2); r.l = 'none'; });
    temoins.forEach((t, i2) => { t.q = wo(i2); t.c = wo(i2); });
    a.eye = { o: `wOut .3s ${E} .04s both`, f: `wOut .28s ${E} 0s both` }; a.h1 = a.eye; a.h2 = a.eye;
    if (dissolve) {
      const wo2 = { o: `wOut .3s ${E} .1s both`, f: `wOut .28s ${E} .06s both` };
      Object.assign(a, { sep: `undrawS .5s ${E} .1s both`, pillL: `undrawS .5s ${E} .15s both`, pill: 'devOut .35s ease-out 0s both',
        pillC: 'eteint .3s ease forwards', indA: `wOut .25s ${E} 0s both`, eyeL: `wOut .25s ${E} 0s both`,
        logo: wo2, n0: wo2, n1: wo2, n2: wo2, n3: wo2, navU: `wOut .25s ${E} 0s both`, sig: `wOut .25s ${E} 0s both`,
        hFl: 'devOut .3s ease-out 0s both', hCta: wo2, dFl: 'devOut .3s ease-out 0s both', dCta: wo2 });
      filtres.forEach((fl) => { fl.a = wo2; fl.ak = `wOut .25s ${E} 0s both`; });
    }
  }
  rects = flat.map((f) => ({ x: f.x, y: f.y, w: f.w, h: f.h }));
  if (S.retour && !S.out && !dissolve) {
    const q = (dl) => ({ o: `wIn .35s ${E} ${dl.toFixed(2)}s both`, f: `wIn .35s ${E} ${(dl + .1).toFixed(2)}s both` });
    vues.forEach((v, i2) => { v.anim = `${v.nb ? 'retourNB' : 'retourC'} .45s ease ${(i2 * .015).toFixed(2)}s both`; v.tr = 'none'; });
    // la photo qu'on vient de refermer rejoint sa place sans aucune animation par-dessus : elle est déjà là, nette
    if (S.lbLast !== null && vues[S.lbLast]) vues[S.lbLast].anim = 'none';
    reperes.forEach((r) => { r.a = q(.1); r.b = q(.15); r.l = `drawS .45s ${E} .1s both`; });
    temoins.forEach((t) => { t.q = q(.2); t.c = q(.25); });
    Object.assign(a, { sep: `drawS .45s ${E} 0s both`, pillL: `drawS .45s ${E} .05s both`, pill: `habille .5s ease .2s both`,
      pillC: `apparait .9s ease .7s both, comete 20s linear .7s infinite`, indA: `wIn .3s ${E} .3s both`, eyeL: `wIn .3s ${E} .05s both`,
      logo: q(.05), n0: q(.08), n1: q(.11), n2: q(.14), n3: q(.17), navU: `wIn .3s ${E} .25s both`, sig: `wIn .3s ${E} .25s both`,
      hFl: `habille .4s ease .1s both`, hCta: q(.15), dFl: `habille .4s ease .2s both`, dCta: q(.25), eye: q(.05), h1: q(.1), h2: q(.15) });
    filtres.forEach((fl, i2) => { fl.a = q(.1 + i2 * .02); fl.ak = q(.25 + i2 * .02).o; });
  }

  // -- application au DOM --
  majEntete(ent, enteteAnim(a, dissolve));
  animer(eyeTrait, a.eyeL); setMot(eyeW, 'Galerie', a.eye);
  setMot(h1W, txt.h1, a.h1); setMot(h2W, txt.h2, a.h2, italique);
  animer(pastille, a.pill); animer(pl1, a.pillL); animer(pl2, a.pillL); animer(plC, a.pillC);
  animer(dFl, a.dFl); animer(dCtaW, a.dCta);
  liste(filtresNav, filtres, (f, i) => i, (f) => {
    const b = el('button', { type: 'button', on: { click: () => changer(f.i) } }, mot(f.t), el('span', { class: 'k', style: 'display:inline-block' }, f.n));
    b._i = f.i; return b;
  }, (b, f) => {
    b._i = f.i;
    b.className = f.on ? 'filtre' : 'filtre off'; b.setAttribute('aria-pressed', f.on ? 'true' : 'false');
    setMot(b.children[0], f.t, f.a); if (b.children[1].textContent !== f.n) b.children[1].textContent = f.n; animer(b.children[1], f.ak);
  });
  // le gestionnaire de clic lit b._i : le filtre d'une position ne change jamais
  indic.style.top = ind.y + 'px'; indic.style.width = ind.w + 'px'; animer(indic, a.indA);
  inner.style.height = zoneH + 'px'; inner.style.width = (1004 + dx) + 'px';
  zone.style.overflowY = S.lb !== null ? 'hidden' : 'auto'; zone.style.scrollbarWidth = S.lb !== null ? 'none' : 'thin';

  liste(repHote, reperes, (r, i) => i, () => {
    const tag = el('span', { style: "font:500 11px 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#4B4D52" }, el('span', { class: 'w' }));
    const tx = el('span', { style: 'font:400 15px Inter,sans-serif;color:#0D0E10' }, el('span', { class: 'w' }));
    const filet = svg('svg', { class: 'ln', 'aria-hidden': 'true', style: 'left:0;top:30px;width:980px;height:2px' }, cheminSvg('M0 1 L980 1', { style: 'stroke-width:1px' }));
    return el('div', { style: 'position:absolute;left:0' }, el('p', { style: 'margin:0;display:flex;align-items:baseline;gap:14px;white-space:nowrap' }, tag, tx), filet);
  }, (n, r) => {
    n.style.top = r.y + 'px'; n.style.width = FW + 'px';
    n.lastElementChild.style.width = FW + 'px';
    const [tag, tx] = n.firstElementChild.children;
    setMot(tag.firstElementChild, r.tag, r.a); setMot(tx.firstElementChild, r.txt, r.b);
    n.lastElementChild.firstElementChild.setAttribute('d', `M0 1 L${FW} 1`); animer(n.lastElementChild.firstElementChild, r.l);
  });

  liste(temHote, temoins, (t, i) => i, () => {
    const q = el('span', { class: 'w', style: 'display:block;white-space:normal' });
    const bq = el('blockquote', { style: 'position:absolute;margin:0;color:#0D0E10;filter:drop-shadow(0 6px 9px rgba(20,18,16,.22)) drop-shadow(0 2px 2px rgba(20,18,16,.14))' }, q);
    const cap = el('figcaption', { style: "position:absolute;filter:drop-shadow(0 3px 4px rgba(20,18,16,.18));font:500 10.5px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#4B4D52" }, el('span', { class: 'w' }));
    const pos = el('span', { 'aria-hidden': 'true', style: "position:absolute;font:500 10.5px 'IBM Plex Mono',monospace;letter-spacing:.06em;color:#4B4D52" });
    return el('figure', { class: 'temoin' }, bq, cap, pos);
  }, (n, t) => {
    Object.assign(n.style, { left: t.x + 'px', top: t.y + 'px', width: t.w + 'px', height: t.h + 'px' });
    const [bq, cap, pos] = n.children, q = bq.firstElementChild;
    Object.assign(bq.style, { left: t.p + 'px', top: t.p + 'px', width: t.tw + 'px', font: `italic 400 ${t.fs}px/1.22 'Instrument Serif', serif` });
    q.style.width = t.tw + 'px';
    setMot(q, t.quote, t.q);
    q.querySelector(':scope > .f').style.width = t.tw + 'px';
    Object.assign(cap.style, { left: t.p + 'px', bottom: t.p + 'px' });
    setMot(cap.firstElementChild, t.who, t.c);
    Object.assign(pos.style, { right: t.p + 'px', bottom: t.p + 'px' }); animer(pos, t.c.o); if (pos.textContent !== t.pos) pos.textContent = t.pos;
  });

  liste(vueHote, vues, (v, i) => i, (v, i) => {
    const b = el('button', { type: 'button', class: 'vue', on: { click: () => ouvrir(i) } }, el('div', { class: 'ph' }, el('span')));
    const s = svg('svg', { class: 'ln', 'aria-hidden': 'true' }, cheminSvg(''));
    return el('div', { style: 'display:contents' }, b, s);
  }, (n, v) => {
    const [b, s] = n.children, ph = b.firstElementChild, p = PHOTOS[v.p];
    b.setAttribute('aria-label', v.label);
    Object.assign(b.style, { left: v.x + 'px', top: v.y + 'px', width: v.w + 'px', height: v.h + 'px' });
    ph.className = 'ph ton-' + p.ton; ph.firstElementChild.textContent = p.label; habillePhoto(ph, p); ph.title = p.label;   // légende tronquée par une ellipse : texte complet au survol
    animer(ph, v.anim);
    Object.assign(s.style, { left: (v.x - 1) + 'px', top: (v.y - 1) + 'px', width: (v.w + 2) + 'px', height: (v.h + 2) + 'px' });
    s.firstElementChild.setAttribute('d', cadrePhoto(v.w, v.h)); animer(s.firstElementChild, v.tr);
  });

  renderLb(flat, dx);
}

// ---- photo agrandie (module commun à toutes les pages) -----------------------------------------------------
const pa = creerPhotoAgrandie({ hote: lbHote, vie, fermer, aller: (dd, total) => { if (S.lbSt === 'to') set({ lb: (S.lb + dd + total) % total, lbN: S.lbN + 1 }); } });
function renderLb(flat, dx) {
  if (S.lb === null || !flat[S.lb]) { pa.vider(); return; }
  const f = flat[S.lb];
  pa.rendre({ p: PHOTOS[f.p], cap: f.tag, i: S.lb, total: flat.length, st: S.lbSt, rect: S.lbR, n: S.lbN, dx });
}

vie.ecouter(window, 'scene:resize', () => render());
vie.ecouter(document, 'keydown', (e) => { if (S.lb !== null) pa.touche(e); });
  render();
}

export function destroy() { if (vie) vie.nettoyer(); vie = null; }
