// Atelier · E39 Planning (vues mois, semaine, jour). Traduit ErpPlanning.dc.html.
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, svg, ecrire, animer, voir, texte } from '../lib/dom.js';
import {
  TODAY, STC, WDS, MOIS, GRID, EV, BLK, SUR, evDay, allDay, caseVide, DESC, majuscule, item, itemEcheance, hhmm
} from './atelier-planning-production-logique.js';

export function init() {

const { a } = monterAtelier('planning');

// ------------------------------------------------------------------ état
const st = { vue: 'mois', wk: 3, day: 20261128, pop: null };
const HATCH = 'repeating-linear-gradient(135deg, rgba(13,14,16,.06) 0 6px, transparent 6px 12px)';
const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);

// ------------------------------------------------------------------ en-tête
ecrire($('#eye'), 'Planning · comptent les dossiers acceptés et confirmés');
ecrire($('#h1'), 'Planning,');
ecrire($('#h2'), italique('vos jours et vos échéances.'));
animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
animer($('#vues'), a.p1); animer($('#legende'), a.nt);

// ------------------------------------------------------------------ vue mois (construite une fois)
// largeur de colonne de la planche : 1072 / 7 ; en fenêtre large : (1072 + dx) / 7 via calc()
const PAS = '(1072px + var(--dx)) / 7';
const caseJour = (g) => {
  const evs = evDay(g.k), al = allDay(g.k), blk = BLK[g.k], libre = caseVide(g.k);
  const its = evs.map(item).concat(al.map(itemEcheance)).slice(0, 3);
  const aria = DESC(g.k) + (blk ? ', bloqué : ' + blk : '') + (SUR[g.k] ? ', surchargé' : '') + (libre ? ', libre, bloquer cette date' : ', voir la journée');
  const c = el('div', { style: `position:absolute;left:calc(304px + ${g.wd} * ${PAS});top:${236 + Math.floor(g.i / 7) * 106}px;width:calc(${PAS} - 6px);height:100px;border-radius:12px;background:${blk ? HATCH : 'transparent'};box-shadow:inset 0 0 0 1px rgba(13,14,16,.07)` },
    el('button', { type: 'button', class: 'cell', 'aria-label': aria, on: { click: () => (libre ? ouvrirPop(g.k) : allerJour(g.k)) } }),
    g.k === TODAY && el('span', { 'aria-hidden': 'true', style: 'position:absolute;left:4px;top:3px;width:26px;height:26px;border-radius:13px;box-shadow:inset 0 0 0 1.5px #3AA6B5' }),
    el('span', { 'aria-hidden': 'true', style: `position:absolute;left:4px;top:8px;width:26px;text-align:center;font:400 13px Inter,sans-serif;color:${g.m !== 11 ? '#9A9CA1' : '#0D0E10'};pointer-events:none` }, String(g.d)),
    SUR[g.k] && el('span', { class: 'mono', 'aria-hidden': 'true', style: 'position:absolute;right:8px;top:9px;color:#7A1F33;font-size:9.5px;pointer-events:none' }, 'surchargé'),
    blk && el('span', { class: 'note', 'aria-hidden': 'true', style: 'position:absolute;left:10px;top:36px;font-size:12px;pointer-events:none' }, 'Bloqué · ' + blk),
    ...its.map((it, j) => el('a', { href: 'dossier.html', class: 'ev', 'aria-label': it.aria, title: it.hT + ' ' + it.t, style: `top:${30 + j * 22}px` },
      el('i', { 'aria-hidden': 'true', style: `background:${it.c};box-shadow:${it.sh}` }), el('span', null, it.hT + ' ' + it.t))));
  animer(c, a.p1);
  return c;
};
GRID.forEach((g) => $('#cases').append(caseJour(g)));

function ouvrirPop(k) { st.pop = k; rendu(); }
function fermerPop() { st.pop = null; rendu(); }
function allerJour(k) { st.vue = 'jour'; st.day = k; st.pop = null; rendu(); }
$('#pop-f').addEventListener('click', fermerPop);
$('#pop .lien').addEventListener('click', (e) => e.preventDefault());

// ------------------------------------------------------------------ vue semaine (reconstruite à chaque rendu, sans animation)
const HY = (h) => 270 + (h - 8) * 41;
function rendreSemaine() {
  const jours = GRID.slice(st.wk * 7, st.wk * 7 + 7), n = [];
  const dx = window.__scene ? window.__scene.dx : 0;
  const P7 = '(1008px + var(--dx)) / 7', X = (i) => `calc(364px + ${i} * ${P7})`;
  const traits = svg('svg', { class: 'ln', 'aria-hidden': 'true', style: 'left:0;top:0;width:1440px;height:900px' });
  for (let i = 0; i < 15; i++) {
    traits.append(svg('path', { d: `M364 ${HY(8 + i)} L${1372 + dx} ${HY(8 + i)}`, style: 'stroke-dasharray:none;stroke-dashoffset:0;stroke-width:1px;stroke:rgba(13,14,16,.07)' }));
  }
  n.push(traits);
  for (let i = 0; i < 15; i++) n.push(el('span', { class: 'mono', style: `position:absolute;left:304px;top:${HY(8 + i) - 7}px;font-size:9.5px` }, String(8 + i).padStart(2, '0') + ':00'));
  jours.forEach((g, i) => {
    const x = X(i), ech = allDay(g.k);
    n.push(el('span', { style: `position:absolute;left:${x};top:212px;width:calc(${P7} - 4px);font:400 14px Inter,sans-serif;color:${g.k === TODAY ? '#3AA6B5' : '#0D0E10'}` },
      WDS[i] + ' ' + g.d, SUR[g.k] && el('span', { class: 'mono', style: 'margin-left:8px;color:#7A1F33;font-size:9.5px' }, 'surchargé')));
    if (ech.length) n.push(el('span', { class: 'note', style: `position:absolute;left:${x};top:236px;width:calc(${P7} - 8px);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis` }, ech.map((e) => e.t.replace(' · n° ', ' ')).join(' · ')));
  });
  jours.forEach((g, i) => {
    if (BLK[g.k]) n.push(el('div', { style: `position:absolute;left:${X(i)};top:266px;width:calc(${P7} - 4px);height:580px;border-radius:10px;background:${HATCH}` },
      el('span', { class: 'note', style: 'position:absolute;left:10px;top:10px;font-size:12px' }, 'Bloqué · ' + BLK[g.k])));
  });
  EV.filter((e) => jours.some((g) => g.k === e.k)).forEach((e) => {
    const i = jours.findIndex((g) => g.k === e.k), it = item(e);
    n.push(el('a', { href: 'dossier.html', class: 'evb', 'aria-label': it.aria,
      style: `left:calc(${X(i)} + 4px);top:${HY(e.h)}px;width:calc(${P7} - 8px);height:${e.d * 41 - 4}px;background:${e.ty === 'soumis' ? 'rgba(58,166,181,.10)' : STC[e.ty]};color:${e.ty === 'soumis' ? '#0D0E10' : '#FFFFFF'};box-shadow:${it.sh}` },
    it.hT, el('br'), it.t));
  });
  $('#vue-semaine').replaceChildren(...n);
}

// ------------------------------------------------------------------ vue jour (reconstruite à chaque rendu)
function rendreJour() {
  const n = [], evs = evDay(st.day), al = allDay(st.day);
  if (SUR[st.day]) n.push(el('p', { class: 'etape', role: 'status', style: 'position:absolute;left:304px;top:232px;margin:0' },
    el('i', { 'aria-hidden': 'true', style: 'background:#7A1F33;box-shadow:none' }), 'Jour surchargé : la capacité est dépassée, il reste réservable (réglage « avertir »).'));
  if (BLK[st.day]) n.push(el('p', { class: 'note', style: 'position:absolute;left:304px;top:232px;margin:0;font-size:15px' }, 'Date bloquée · ' + BLK[st.day]));
  evs.forEach((e, i) => {
    const it = item(e), y = 300 + i * 92;
    const etT = e.ty === 'soumis' ? 'Soumis · signalé, ne compte pas encore' : e.ty === 'accepte' ? 'Accepté' : 'Confirmé';
    n.push(el('div', { class: 'verre', 'aria-hidden': 'true', style: `left:304px;top:${y}px;width:calc(720px + var(--dx));height:78px;animation:habille .5s ease both` }),
      el('a', { href: 'dossier.html', class: 'lien', 'aria-label': it.aria, style: `position:absolute;left:304px;top:${y}px;width:calc(720px + var(--dx));height:78px` },
        el('span', { style: 'position:absolute;left:24px;top:16px;font:300 24px Inter,sans-serif' }, e.hT + ' – ' + hhmm(e.h + e.d)),
        el('span', { style: 'position:absolute;left:200px;top:14px;font:400 16px Inter,sans-serif' }, e.t),
        el('span', { class: 'etape', style: 'position:absolute;left:200px;top:42px;color:#4B4D52;font-size:12.5px' },
          el('i', { 'aria-hidden': 'true', style: `background:${it.c};box-shadow:${it.sh}` }), etT),
        el('span', { class: 'mini', style: 'position:absolute;right:24px;top:30px' }, 'Ouvrir le dossier →')));
  });
  al.forEach((e, i) => n.push(el('p', { class: 'note', style: `position:absolute;left:328px;top:${300 + evs.length * 92 + i * 44}px;margin:0;font-size:14px` }, e.t)));
  if (caseVide(st.day)) {
    const lien = el('a', { role: 'link', tabindex: '0', 'aria-disabled': 'true', title: 'Bientôt disponible', class: 'lien mini', style: 'position:absolute;left:304px;top:336px', on: { click: (e) => e.preventDefault() } }, 'Bloquer cette date →');
    n.push(el('p', { style: 'position:absolute;left:304px;top:290px;margin:0;font:300 26px Inter,sans-serif' }, 'Rien ce jour-là.'), lien);
  }
  $('#vue-jour').replaceChildren(...n);
}

// ------------------------------------------------------------------ commandes
const VUES = [['mois', 'Mois'], ['semaine', 'Semaine'], ['jour', 'Jour']];
VUES.forEach(([k, t]) => $('#vues').append(el('button', { type: 'button', role: 'radio', 'data-vue': k, class: 'puce', 'aria-checked': 'false',
  on: { click: () => { st.vue = k; st.pop = null; rendu(); } } }, t)));
const idx = () => GRID.findIndex((g) => g.k === st.day);
$('#prec').addEventListener('click', () => {
  if (st.vue === 'semaine' && st.wk > 0) st.wk -= 1;
  else if (st.vue === 'jour' && idx() > 0) st.day = GRID[idx() - 1].k;
  else return;
  rendu();
});
$('#suiv').addEventListener('click', () => {
  if (st.vue === 'semaine' && st.wk < 5) st.wk += 1;
  else if (st.vue === 'jour' && idx() < 41) st.day = GRID[idx() + 1].k;
  else return;
  rendu();
});

function rendu() {
  const jours = GRID.slice(st.wk * 7, st.wk * 7 + 7);
  $('#vues').querySelectorAll('.puce').forEach((b) => {
    const on = b.dataset.vue === st.vue;
    b.className = 'puce' + (on ? ' on' : ''); b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  texte($('#titre'), st.vue === 'mois' ? 'Novembre 2026'
    : st.vue === 'semaine' ? 'Du ' + jours[0].d + ' ' + MOIS[jours[0].m] + ' au ' + jours[6].d + ' ' + MOIS[jours[6].m]
      : majuscule(DESC(st.day)));
  const fin = st.vue === 'mois' || (st.vue === 'semaine' ? st.wk === 5 : idx() === 41);
  const debut = st.vue === 'mois' || (st.vue === 'semaine' ? st.wk === 0 : idx() === 0);
  $('#prec').setAttribute('aria-disabled', debut ? 'true' : 'false');
  $('#suiv').setAttribute('aria-disabled', fin ? 'true' : 'false');
  voir($('#vue-mois'), st.vue === 'mois'); voir($('#vue-semaine'), st.vue === 'semaine'); voir($('#vue-jour'), st.vue === 'jour');
  if (st.vue === 'semaine') rendreSemaine();
  if (st.vue === 'jour') rendreJour();
  voir($('#pop'), st.vue === 'mois' && !!st.pop);
  if (st.vue === 'mois' && st.pop) {
    const i = GRID.findIndex((g) => g.k === st.pop);
    const x = `min(304px + ${GRID[i].wd} * ${PAS} + 20px, 1076px + var(--dx))`, y = Math.min(236 + Math.floor(i / 7) * 106 + 56, 900 - 116 - 16); // plafonné : le popover de la dernière rangée n'est pas coupé (la planche le coupait)
    [$('#pop-verre'), $('#pop-dlg')].forEach((n) => { n.style.left = `calc(${x})`; n.style.top = y + 'px'; if (n.id === 'pop-verre') { n.style.position = 'absolute'; } });
    texte($('#pop-t'), majuscule(DESC(st.pop)));
  }
}
rendu();

}

export function destroy() {
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
