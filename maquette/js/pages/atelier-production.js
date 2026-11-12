// Atelier · E28 Production + E12.f étapes. Traduit ErpProduction.dc.html (états : Données, Vide).
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, majMot, animer, liste, voir, texte } from '../lib/dom.js';
import { param } from '../lib/params.js';
import { productionInitiale, repere } from './atelier-planning-production-logique.js';

export function init() {

const { a, H } = monterAtelier('production');
// Option de planche « etat » : Données (défaut) ou Vide.
const vide = param('etat', ['Données', 'Vide'], 'Données') === 'Vide';

const st = { prods: productionInitiale(), sel: 'p2026-019', errLiv: '', toast: null };
const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);

// ------------------------------------------------------------------ en-tête (écrit une fois ; le compteur se met à jour sans relancer l'animation)
ecrire($('#eye'), 'Production · 0 shootings à livrer');
ecrire($('#h1'), 'Production,');
ecrire($('#h2'), italique('la plus urgente d’abord.'));
ecrire($('#vide-t'), 'Aucune production en cours.');
animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
animer($('#vide-t'), a.vT);
animer($('#d-verre'), a.p2); animer($('#d-trait-a'), a.l1); animer($('#d-trait-v'), a.l2);

// ------------------------------------------------------------------ lignes
function creerLigne(p) {
  const verre = el('div', { class: 'verre', 'aria-hidden': 'true', style: 'left:304px;width:calc(572px + var(--dx));height:80px;opacity:0' });
  const mark = el('i', { 'aria-hidden': 'true' });
  const bouton = el('button', { type: 'button', role: 'option', class: 'opt', style: 'left:304px;width:calc(572px + var(--dx));height:80px', on: { click: () => choisir(p.k) } },
    el('span', { class: 'etape', style: 'position:absolute;left:20px;top:12px;font-size:12.5px' }, mark, el('span', { 'data-r': 'mT' })),
    el('span', { class: 'mono', style: 'position:absolute;right:20px;top:14px;color:#0D0E10' }, 'Échéance ' + p.ech),
    el('span', { style: 'position:absolute;left:20px;top:34px;font:400 16px Inter,sans-serif;white-space:nowrap' }, p.cli + ' · ' + p.srv),
    el('span', { class: 'note', style: 'position:absolute;left:20px;top:56px;font-size:12px;white-space:nowrap', 'data-r': 'etT' }),
    el('span', { 'aria-hidden': 'true', style: 'position:absolute;right:20px;top:42px;display:flex;gap:6px', 'data-r': 'dots' }));
  return el('div', { style: 'display:contents', 'data-verre': '' }, verre, bouton);
}
function majLigne(n, p, i) {
  const [verre, b] = n.children, m = repere(p), on = p.k === st.sel;
  const ac = H(1.5 + i * .08), y = 196 + i * 92 + 'px';
  verre.style.top = y; b.style.top = y; animer(verre, ac); animer(b, ac);
  b.style.boxShadow = on ? 'inset 0 0 0 2px #0D0E10' : 'none';
  b.setAttribute('aria-selected', on ? 'true' : 'false');
  b.setAttribute('aria-label', p.cli + ', ' + p.srv + ', échéance ' + p.ech + ', ' + m[0].toLowerCase() + ', étape ' + p.st[p.cur]);
  const mark = b.querySelector('i'); mark.style.cssText = `display:block;width:8px;height:8px;border-radius:4px;background:${m[1]};box-shadow:${m[2]}`;
  texte(b.querySelector('[data-r="mT"]'), m[0]);
  texte(b.querySelector('[data-r="etT"]'), 'N° ' + p.num + ' · shooting du ' + p.sh + ' · ' + p.st[p.cur] + ' · ' + (p.cur + 1) + ' sur ' + p.st.length);
  const dots = b.querySelector('[data-r="dots"]');
  dots.replaceChildren(...p.st.map((s, j) => el('i', { style: `display:block;width:8px;height:8px;border-radius:4px;background:${j < p.cur ? '#0D0E10' : j === p.cur ? '#3AA6B5' : 'transparent'};box-shadow:${j > p.cur ? 'inset 0 0 0 1.5px #8C8E93' : 'none'}` })));
}

// ------------------------------------------------------------------ actions
const lien = $('#lien');
function choisir(k) { st.sel = k; st.errLiv = ''; st.toast = null; rendu(); }
function suivante() {
  const p = st.prods.find((x) => x.k === st.sel);
  if (!p || p.cur >= p.st.length - 1) return;
  p.cur += 1; p.dt.push('aujourd’hui');
  st.toast = 'Étape suivante : ' + p.st[p.cur].toLowerCase() + '. Le client la voit dans son dossier.'; st.errLiv = '';
  rendu();
}
function livrer() {
  const v = lien.value.trim();
  if (!/^https:\/\/[^\s/]+\.[^\s]+$/.test(v)) { st.errLiv = 'Collez un lien de livraison commençant par https://'; rendu(); return; }
  const reste = st.prods.filter((x) => x.k !== st.sel);
  lien.value = ''; st.prods = reste; st.sel = reste.length ? reste[0].k : null; st.errLiv = '';
  st.toast = 'Livré. Le client reçoit l’email « Vos photos sont prêtes » et voit le lien.';
  rendu();
}
$('#d-suiv-btn').addEventListener('click', suivante);
$('#d-livrer-btn').addEventListener('click', livrer);

// ------------------------------------------------------------------ rendu
function rendu() {
  const prods = vide ? [] : st.prods.slice().sort((p, q) => p.ek - q.ek);
  majMot($('#eye'), 'Production · ' + prods.length + ' shootings à livrer');
  liste($('#liste'), prods, (p) => p.k, creerLigne, majLigne);
  voir($('#liste'), prods.length > 0);
  voir($('#vide'), prods.length === 0);

  const sp = st.prods.find((p) => p.k === st.sel), on = !!sp && !vide;
  voir($('#detail'), on);
  if (on) {
    const le = (d) => (d === 'aujourd’hui' ? d : 'le ' + d);
    const dernier = sp.cur === sp.st.length - 1, livY = 330 + sp.st.length * 58 + 10;
    texte($('#d-num'), 'Production du shooting · N° ' + sp.num);
    texte($('#d-cli'), sp.cli);
    texte($('#d-s'), sp.srv + ' · shooting du ' + sp.sh + ' · livraison prévue le ' + sp.ech);
    $('#d-trait-a').setAttribute('d', 'M1012 337 L1012 ' + (337 + (sp.st.length - 1) * 58));
    $('#d-trait-v').setAttribute('d', 'M1012 337 L1012 ' + (337 + Math.max(sp.cur, 0) * 58));
    liste($('#d-etapes'), sp.st.map((s, j) => ({ s, j })), (e) => sp.k + e.j,
      () => el('li', { style: 'position:absolute;left:1000px;width:360px;height:48px' },
        el('span', { 'aria-hidden': 'true', style: 'position:absolute;left:0;top:0;width:24px;height:24px;border-radius:12px' }),
        el('span', { style: 'position:absolute;left:40px;top:1px;font-size:15px;font-family:Inter,sans-serif' }),
        el('span', { class: 'note', style: 'position:absolute;left:40px;top:22px;font-size:12.5px' })),
      (li, { s, j }) => {
        li.style.top = 330 + j * 58 + 'px';
        const [pt, t, n] = li.children;
        pt.style.background = j < sp.cur ? '#0D0E10' : j === sp.cur ? '#3AA6B5' : '#FFFFFF';
        pt.style.border = '1.5px solid ' + (j <= sp.cur ? (j < sp.cur ? '#0D0E10' : '#3AA6B5') : 'rgba(13,14,16,.35)');
        t.style.fontWeight = j === sp.cur ? '500' : '400'; texte(t, s);
        texte(n, j < sp.cur ? 'terminée ' + le(sp.dt[j + 1]) : j === sp.cur ? 'en cours depuis ' + le(sp.dt[j]) : 'à venir');
      });
    voir($('#d-suivante'), !dernier);
    voir($('#d-livrer'), dernier);
    $('#d-suiv-enc').style.top = livY + 'px'; $('#d-suiv-btn').style.top = livY + 'px';
    texte($('#d-suiv-btn'), 'Passer à « ' + (sp.st[sp.cur + 1] || '') + ' »');
    $('#d-livrer').style.top = livY + 'px';
    const err = $('#lien-err');
    lien.setAttribute('aria-invalid', st.errLiv ? 'true' : 'false');
    err.replaceChildren(...(st.errLiv ? [el('i', { 'aria-hidden': 'true' }), st.errLiv] : []));
  }

  const t = $('#toast');
  voir(t, !!st.toast);
  if (st.toast) { texte($('#toast-t'), st.toast); t.setAttribute('role', 'status'); }
}
rendu();

}

export function destroy() {
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
