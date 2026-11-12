// Atelier · E19 Type de fiche (UC02.1) : nom, champs ordonnés (poignée + flèches), nouveau champ ou groupe répétable.
// Traduit ErpFiche.dc.html.
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, svg, ecrire, majMot, animer, liste, texte, voir } from '../lib/dom.js';
import { CH0, TYPES, TYPES_F } from '../../data/catalogue.js';
import { monterToast, majErr, invalide, etatEnregistrer, boutonIcone, desactiver, caseACocher, cocher, deplacer, dossiersDuType } from './atelier-catalogue2-logique.js';
import { creerVie } from '../lib/vie.js';

let vie = null;

export function init(racine) {
  vie = creerVie();
  const { a } = monterAtelier('fiche');

  // ------------------------------------------------------------------ état
  const NOM = 'Fiche mariage';
  const st = { ch: CH0.map((c) => ({ ...c })), n: CH0.length, nt: 'texte', no: false, mode: 'champ', errC: '', errNom: '', busy: false };
  const toast = monterToast(racine, { left: 'calc(848px + var(--dx))', top: 136, width: 528, droite: true });
  const nom = $('#nom'), nl = $('#nl'), nv = $('#nv'), ng = $('#ng');
  nom.value = NOM;

  // ------------------------------------------------------------------ en-tête
  const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);
  const sert = dossiersDuType(NOM);
  const eyebrow = () => 'Catalogue · type de fiche · ' + st.ch.length + ' champs · sert à ' + sert + ' dossiers';
  ecrire($('#eye'), eyebrow());
  ecrire($('#h1'), 'Fiche mariage,');
  ecrire($('#h2'), italique('les questions au client.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#retour'), a.sig); animer($('#intro'), a.nt);
  animer($('#nom-champ'), a.p1); animer($('#p2-verre'), a.p2); animer($('#panneau'), a.p2);

  // ------------------------------------------------------------------ panneau « nouveau champ »
  const chips = TYPES_F.map((t) => {
    const b = el('button', { type: 'button', role: 'radio', class: 'puce', 'aria-checked': 'false', on: { click: () => { st.nt = t; st.errC = ''; rendre(); } } }, t);
    $('#types').append(b);
    return [t, b];
  });
  const caseNo = caseACocher('Obligatoire', { relatif: true, onClick: () => { st.no = !st.no; rendre(); } });
  $('#no-bloc').append(caseNo);

  // ------------------------------------------------------------------ actions
  function ajouterChamp() {
    if (st.mode === 'groupe') {
      const g = ng.value.trim();
      if (!g) { st.errC = 'Le nom du groupe est obligatoire.'; return rendre(); }
      ng.value = ''; st.n += 1; st.errC = '';
      st.ch.push({ k: 'f' + st.n, t: g, ty: 'groupe répétable', ob: false, sub: 'aucun champ pour l’instant', neuf: true });
      st.mode = 'champ';
      toast.montrer('Groupe « ' + g + ' » ajouté.');
      return rendre();
    }
    const t = nl.value.trim();
    if (!t) { st.errC = 'Le libellé du champ est obligatoire.'; return rendre(); }
    let sub = '';
    if (st.nt === 'liste') {
      const vs = nv.value.split('\n').map((s) => s.trim()).filter(Boolean);
      if (!vs.length) { st.errC = 'Une liste de choix demande au moins une valeur.'; return rendre(); }
      sub = vs.join(' · ');
    }
    nl.value = ''; nv.value = ''; st.n += 1; st.errC = '';
    st.ch.push({ k: 'f' + st.n, t, ty: st.nt, ob: st.no, sub, neuf: true });
    toast.montrer('Champ « ' + t + ' » ajouté en fin de fiche.');
    rendre();
  }
  function enregistrer() {
    const t = nom.value.trim();
    if (!t) { st.errNom = 'Le nom du type de fiche est obligatoire.'; toast.cacher(); return rendre(); }
    if (TYPES.some((x) => x.k !== 't1' && x.t.toLowerCase() === t.toLowerCase())) { st.errNom = 'Ce type de fiche existe déjà.'; toast.cacher(); return rendre(); }
    st.errNom = ''; st.busy = true; rendre();
    vie.timeout(() => { st.busy = false; toast.montrer('Type de fiche enregistré. Les fiches déjà remplies gardent leurs réponses.'); rendre(); }, 900);
  }

  // ------------------------------------------------------------------ une ligne de champ
  const POIGNEE = '<circle cx="2" cy="2" r="1.4"></circle><circle cx="8" cy="2" r="1.4"></circle><circle cx="2" cy="8" r="1.4"></circle><circle cx="8" cy="8" r="1.4"></circle><circle cx="2" cy="14" r="1.4"></circle><circle cx="8" cy="14" r="1.4"></circle>';
  function creerLigne(c) {
    const poignee = svg('svg', { 'aria-hidden': 'true', viewBox: '0 0 10 16', style: 'position:absolute;left:6px;top:13px;width:10px;height:16px;fill:#9A9CA1' });
    poignee.innerHTML = POIGNEE; // contenu statique, sans donnée saisie
    const sub = el('span', { class: 'note sub', style: 'font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' });
    const bloc = el('div', { style: 'position:absolute;left:28px;top:0;width:calc(262px + var(--dx) * 0.5);height:42px;display:flex;flex-direction:column;justify-content:center' },
      el('span', { class: 'lib', style: 'font:400 15px Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }), sub);
    const ob = caseACocher('obligatoire', { left: 'calc(446px + var(--dx))', top: 11, taille: 13, onClick: () => { const f = st.ch.find((z) => z.k === c.k); f.ob = !f.ob; rendre(); } });
    const haut = boutonIcone('haut', '', 'calc(560px + var(--dx))', 8, () => { st.ch = deplacer(st.ch, c.k, -1); rendre(); });
    const bas = boutonIcone('bas', '', 'calc(586px + var(--dx))', 8, () => { st.ch = deplacer(st.ch, c.k, 1); rendre(); });
    const retirer = boutonIcone('retirer', '', 'calc(612px + var(--dx))', 8, () => { st.ch = st.ch.filter((z) => z.k !== c.k); rendre(); });
    const li = el('li', { class: 'sep', style: 'position:absolute;left:304px;width:calc(624px + var(--dx));height:42px;border-radius:10px' },
      poignee, bloc, el('span', { class: 'mono ty', style: 'position:absolute;left:calc(298px + var(--dx) * 0.5);top:15px;font-size:9.5px' }), ob, haut, bas, retirer);
    animer(li, a.p1);
    li._v = { sub, ob, haut, bas, retirer };
    return li;
  }
  function majLigne(li, c, i) {
    const { sub, ob, haut, bas, retirer } = li._v, n = st.ch.length;
    li.style.top = (300 + i * 46) + 'px';
    li.style.background = c.neuf ? 'rgba(58,166,181,.08)' : 'transparent';
    texte(li.querySelector('.lib'), c.t);
    texte(sub, c.sub || ''); voir(sub, !!c.sub);
    texte(li.querySelector('.ty'), c.ty);
    cocher(ob, c.ob); ob.setAttribute('aria-label', c.t + ' obligatoire');
    haut.setAttribute('aria-label', 'Monter ' + c.t); desactiver(haut, i === 0);
    bas.setAttribute('aria-label', 'Descendre ' + c.t); desactiver(bas, i === n - 1);
    retirer.setAttribute('aria-label', 'Retirer ' + c.t);
  }

  // ------------------------------------------------------------------ rendu
  function rendre() {
    liste($('#champs'), st.ch, (c) => c.k, creerLigne, majLigne);
    const addY = 300 + st.ch.length * 46 + 14;
    $('#plus-champ').style.top = addY + 'px'; $('#plus-groupe').style.top = addY + 'px';
    majMot($('#eye'), eyebrow());
    // panneau de droite
    voir($('#m-champ'), st.mode === 'champ'); voir($('#m-groupe'), st.mode === 'groupe');
    chips.forEach(([t, b]) => { b.className = 'puce' + (st.nt === t ? ' on' : ''); b.setAttribute('aria-checked', st.nt === t ? 'true' : 'false'); });
    cocher(caseNo, st.no);
    voir($('#bloc-liste'), st.nt === 'liste'); voir($('#bloc-adresse'), st.nt === 'adresse'); voir($('#bloc-lien'), st.nt === 'lien');
    majErr($('#nc-err'), st.mode === 'champ' ? st.errC : ''); majErr($('#ng-err'), st.mode === 'groupe' ? st.errC : '');
    const e = !!st.errC;
    invalide(nl, e); invalide(nv, e); invalide(ng, e);
    majErr($('#nom-err'), st.errNom); invalide(nom, !!st.errNom);
    etatEnregistrer($('#enregistrer-encre'), $('#enregistrer'), st.busy, 'Enregistrer', 'Enregistrement…');
  }

  $('#plus-champ').addEventListener('click', () => { st.mode = 'champ'; st.errC = ''; rendre(); });
  $('#plus-groupe').addEventListener('click', () => { st.mode = 'groupe'; st.errC = ''; rendre(); });
  $('#retour-champ').addEventListener('click', () => { st.mode = 'champ'; st.errC = ''; rendre(); });
  $('#ajouter-champ').addEventListener('click', ajouterChamp);
  $('#creer-groupe').addEventListener('click', ajouterChamp);
  $('#enregistrer').addEventListener('click', enregistrer);
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
