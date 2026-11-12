// Atelier · E18 Types de fiches techniques (UC02.2) : liste + « Dupliquer ». Traduit ErpFiches.dc.html.
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, animer, liste } from '../lib/dom.js';
import { TYPES } from '../../data/catalogue.js';
import { monterToast } from './atelier-catalogue2-logique.js';
import { creerVie } from '../lib/vie.js';

let vie = null;

export function init(racine) {
  vie = creerVie();
  const { a, H } = monterAtelier('fiches');

  const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);
  ecrire($('#eye'), 'Catalogue · fiches techniques');
  ecrire($('#h1'), 'Types de fiches,');
  ecrire($('#h2'), italique('ce que le client vous raconte.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#nouveau'), a.p1); animer($('#l1'), a.l1);

  const st = { types: TYPES.map((t) => ({ ...t, neuf: false })), n: TYPES.length };
  const toast = monterToast(racine, { left: 304, top: 620, width: 'calc(1072px + var(--dx))' });

  function dupliquer(k) {
    const i = st.types.findIndex((x) => x.k === k);
    st.n += 1;
    const copie = { ...st.types[i], k: 't' + st.n, t: st.types[i].t + ' (copie)', svc: 'aucun service relié', mod: 'aujourd’hui', neuf: true };
    st.types.splice(i + 1, 0, copie);
    toast.montrer('« ' + copie.t + ' » est créé : modifiez-le sans toucher à l’original.');
    rendre();
  }

  function creerLigne(t) {
    const anim = t.neuf ? 'habille .6s ease both' : null; // calculé à la création, comme la planche
    const lien = el('a', { href: 'fiche.html', class: 'lig sep', style: 'left:290px;width:calc(960px + var(--dx));height:60px' },
      el('span', { class: 'nom', style: 'position:absolute;left:14px;top:20px;font:400 16px Inter,sans-serif;white-space:nowrap' }),
      el('span', { class: 'nb', style: 'position:absolute;left:calc(300px + var(--dx) * 0.25);top:21px;font:400 14px Inter,sans-serif;white-space:nowrap' }),
      el('span', { class: 'note svc', style: 'position:absolute;left:calc(460px + var(--dx) * 0.35);top:20px;width:calc(390px + var(--dx) * 0.4);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }),
      el('span', { class: 'note mod', style: 'position:absolute;left:calc(870px + var(--dx) * 0.8);top:20px;font-size:13px;white-space:nowrap' }));
    const dup = el('button', { type: 'button', class: 'mini', style: 'position:absolute;left:calc(1290px + var(--dx));margin-top:21px', on: { click: () => dupliquer(t.k) } }, 'Dupliquer');
    const w = el('div', { style: 'display:contents' }, lien, dup);
    w._v = { lien, dup, anim };
    return w;
  }
  function majLigne(w, t, i) {
    const { lien, dup, anim } = w._v;
    const y = 248 + i * 64, ac = anim || H(1.5 + i * .08);
    lien.style.top = y + 'px'; dup.style.top = y + 'px';
    lien.style.background = t.neuf ? 'rgba(58,166,181,.08)' : 'transparent';
    animer(lien, ac); animer(dup, ac);
    lien.setAttribute('aria-label', 'Modifier ' + t.t);
    dup.setAttribute('aria-label', 'Dupliquer ' + t.t);
    lien.querySelector('.nom').textContent = t.t;
    lien.querySelector('.nb').textContent = t.n;
    lien.querySelector('.svc').textContent = t.svc;
    lien.querySelector('.mod').textContent = t.mod;
  }
  function rendre() { liste($('#lignes'), st.types, (t) => t.k, creerLigne, majLigne); }
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
