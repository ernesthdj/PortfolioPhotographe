// Atelier · E29 Modèles de production (UC09) : étapes ordonnées (Livraison toujours dernière), services reliés avec délai en jours.
// Traduit ErpModeles.dc.html.
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, animer, liste, texte, voir } from '../lib/dom.js';
import { MOD0, SVC_P } from '../../data/catalogue.js';
import { monterToast, majErr, etatEnregistrer, boutonIcone, desactiver, caseACocher, cocher, deplacer, n2 } from './atelier-catalogue2-logique.js';
import { creerVie } from '../lib/vie.js';

let vie = null;

export function init(racine) {
  vie = creerVie();
  const { a, H } = monterAtelier('modeles');

  // ------------------------------------------------------------------ en-tête
  const italique = (s) => () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, s);
  ecrire($('#eye'), 'Catalogue · modèles de production');
  ecrire($('#h1'), 'Modèles de production,');
  ecrire($('#h2'), italique('du tri à la livraison.'));
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#nouveau'), a.p1); animer($('#p2-verre'), a.p2); animer($('#mnom-champ'), a.p2);
  animer($('#livraison'), a.p2); animer($('#l1'), a.l1);

  // ------------------------------------------------------------------ état
  let seq = 0;
  const etape = (t) => ({ k: 'e' + (++seq), t });
  const st = {
    mods: MOD0.map((m) => ({ k: m.k, t: m.t, et: m.et.map(etape), sv: { ...m.sv } })),
    sel: 'm1', busy: false, errM: ''
  };
  const toast = monterToast(racine, { left: 'calc(920px + var(--dx))', top: 818, width: 440 });
  const nomModele = $('#mnom'), nouvelleEtape = $('#net');
  const courant = () => st.mods.find((m) => m.k === st.sel);

  // Les champs de saisie gardent leur valeur d'un rendu à l'autre ; on les remplit au choix d'un modèle.
  const delais = {};
  function remplirChamps(m) {
    nomModele.value = m.t; nouvelleEtape.value = '';
    SVC_P.forEach(([s]) => { delais[s].value = m.sv[s] == null ? '' : String(m.sv[s]); });
  }

  // ------------------------------------------------------------------ services reliés (7 lignes fixes)
  SVC_P.forEach(([k, t], i) => {
    const y = 330 + i * 50;
    const inp = el('input', { id: 'd-' + k, type: 'text', inputmode: 'numeric', 'aria-label': 'Délai de livraison pour ' + t + ', en jours', 'aria-describedby': 'mod-err' });
    const champ = el('div', { class: 'champ', style: `position:absolute;left:${'calc(1262px + var(--dx))'};top:${y}px;margin-top:-12px;width:50px` }, inp);
    const jours = el('span', { class: 'note', style: `position:absolute;left:${'calc(1318px + var(--dx))'};top:${y}px;font-size:12.5px` }, 'jours');
    const c = caseACocher(t, { left: 'calc(1040px + var(--dx))', top: y, taille: 14, onClick: () => {
      const m = courant();
      if (m.sv[k] != null) delete m.sv[k]; else { m.sv[k] = 30; inp.value = '30'; }
      rendre();
    } });
    c.style.top = y + 'px';
    delais[k] = inp;
    $('#services').append(c, champ, jours);
    c._lien = [champ, jours];
  });

  // ------------------------------------------------------------------ actions
  function choisir(k) { st.sel = k; st.errM = ''; toast.cacher(); remplirChamps(courant()); rendre(); }
  function ajouterEtape() {
    const t = nouvelleEtape.value.trim();
    if (!t) { st.errM = 'Indiquez le nom de l’étape.'; return rendre(); }
    nouvelleEtape.value = ''; st.errM = '';
    courant().et.push(etape(t)); rendre();
  }
  function enregistrer() {
    const m = courant(), t = nomModele.value.trim();
    if (!t) { st.errM = 'Le nom du modèle est obligatoire.'; toast.cacher(); return rendre(); }
    if (!m.et.length) { st.errM = 'Un modèle de production demande au moins une étape.'; toast.cacher(); return rendre(); }
    const mauvais = Object.keys(m.sv).some((s) => { const v = n2(delais[s].value); return v === null || Number.isNaN(v) || v < 0 || v % 1; });
    if (mauvais) { st.errM = 'Indiquez le délai de livraison en jours entiers pour chaque service relié.'; toast.cacher(); return rendre(); }
    st.errM = '';
    m.t = t; Object.keys(m.sv).forEach((s) => { m.sv[s] = n2(delais[s].value); });
    st.busy = true; rendre();
    vie.timeout(() => { st.busy = false; toast.montrer('Modèle enregistré. Il s’applique aux shootings qui n’ont pas encore commencé.'); rendre(); }, 900);
  }

  // ------------------------------------------------------------------ listes
  function creerModele(m, i) {
    const ac = H(1.5 + i * .1);
    const verre = el('div', { class: 'verre', 'aria-hidden': 'true', style: 'left:304px;width:300px;height:80px;opacity:0' });
    const bouton = el('button', { type: 'button', class: 'opt', style: 'left:304px;width:300px;height:80px', on: { click: () => choisir(m.k) } },
      el('span', { class: 't', style: 'position:absolute;left:22px;top:18px;font:400 16px Inter,sans-serif' }),
      el('span', { class: 'note s', style: 'position:absolute;left:22px;top:44px;font-size:12.5px' }));
    animer(verre, ac); animer(bouton, ac);
    const w = el('div', { style: 'display:contents' }, verre, bouton);
    w._v = { verre, bouton };
    return w;
  }
  function majModele(w, m, i) {
    const { verre, bouton } = w._v, y = (176 + i * 96) + 'px', on = m.k === st.sel, n = Object.keys(m.sv).length;
    verre.style.top = y; bouton.style.top = y;
    bouton.style.boxShadow = on ? 'inset 0 0 0 2px #0D0E10' : 'none';
    bouton.setAttribute('aria-pressed', on ? 'true' : 'false');
    texte(bouton.querySelector('.t'), m.t);
    texte(bouton.querySelector('.s'), (m.et.length + 1) + ' étapes · ' + n + ' service' + (n > 1 ? 's' : ''));
  }

  function creerEtape(e) {
    const num = el('span', { class: 'mono n', style: 'position:absolute;left:0;top:14px;color:#0D0E10' });
    const haut = boutonIcone('haut', '', 'calc(254px + var(--dx))', 7, () => { const m = courant(); m.et = deplacer(m.et, e.k, -1); rendre(); });
    const bas = boutonIcone('bas', '', 'calc(282px + var(--dx))', 7, () => { const m = courant(); m.et = deplacer(m.et, e.k, 1); rendre(); });
    const retirer = boutonIcone('retirer', '', 'calc(312px + var(--dx))', 7, () => { const m = courant(); m.et = m.et.filter((z) => z.k !== e.k); rendre(); });
    const li = el('li', { class: 'sep', style: 'position:absolute;left:656px;width:calc(340px + var(--dx));height:40px' }, num,
      el('span', { class: 'lib', style: 'position:absolute;left:28px;top:10px;font:400 15px Inter,sans-serif' }), haut, bas, retirer);
    animer(li, a.p2);
    li._v = { num, haut, bas, retirer };
    return li;
  }
  function majEtape(li, e, i) {
    const { num, haut, bas, retirer } = li._v, n = courant().et.length;
    li.style.top = (330 + i * 44) + 'px';
    texte(num, i + 1); texte(li.querySelector('.lib'), e.t);
    haut.setAttribute('aria-label', 'Monter ' + e.t); desactiver(haut, i === 0);
    bas.setAttribute('aria-label', 'Descendre ' + e.t); desactiver(bas, i === n - 1);
    retirer.setAttribute('aria-label', 'Retirer ' + e.t);
  }

  function rendre() {
    const m = courant(), n = m.et.length;
    liste($('#modeles'), st.mods, (x) => x.k, creerModele, majModele);
    // les étapes se rangent avant la ligne « Livraison », qui reste dans la même liste <ol>
    const ol = $('#etapes'), liv = $('#livraison');
    liste(ol, m.et, (e) => e.k, creerEtape, majEtape);
    if (ol.lastElementChild !== liv) ol.append(liv); // Livraison reste la dernière (déplacer un nœud relance son animation : seulement si besoin)
    liv.style.top = (330 + n * 44) + 'px';
    texte($('#liv-n'), n + 1);
    const addY = (330 + (n + 1) * 44 + 12) + 'px';
    $('#net-champ').style.top = addY; $('#ajouter-etape').style.top = addY;
    SVC_P.forEach(([k], i) => {
      const lie = m.sv[k] != null, c = $('#services').children[i * 3];
      cocher(c, lie); voir(c._lien[0], lie); voir(c._lien[1], lie);
    });
    majErr($('#mod-err'), st.errM);
    etatEnregistrer($('#enregistrer-encre'), $('#enregistrer'), st.busy, 'Enregistrer le modèle', 'Enregistrement…');
  }

  $('#ajouter-etape').addEventListener('click', ajouterEtape);
  $('#enregistrer').addEventListener('click', enregistrer);
  remplirChamps(courant());
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
