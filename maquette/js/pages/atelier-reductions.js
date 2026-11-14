// Atelier · E20 Réductions (liste, variante B « cartes en phrases »). Traduit E20-liste-B.dc.html.
// Chaque réduction se lit « Si … alors … sur … » : la phrase est générée depuis data/reductions.js.
// L'interrupteur bascule l'état, « Supprimer » ouvre une confirmation (modale.js) ; rien n'est envoyé (sessionStorage seulement).
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, svg, ecrire, animer, texte, liste, voir } from '../lib/dom.js';
import { creerVie } from '../lib/vie.js';
import { memoriserFocus, clavierModale } from '../lib/modale.js';
import { charger, sauver, phraseNoeuds, badge, detail, jaugePct, jaugeLabel, animerPanneau } from './atelier-reductions-logique.js';

let vie = null;

export function init() {
  vie = creerVie();
  const at = monterAtelier('reductions', { nDemandes: 2 });
  const { a } = at;
  let items = charger();
  let aSupprimer = null, rendreFocus = null;

  ecrire($('#h1'), 'Réductions,');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, 'en toutes lettres.'));
  ecrire($('#eye'), 'Catalogue · réductions');
  animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
  animer($('#nt'), a.nt); animer($('#nouveau'), a.p1);

  const annoncer = (s) => texte($('#statut'), s);

  function basculer(id) {
    const r = items.find((x) => x.id === id);
    if (!r) return;
    r.active = !r.active;
    sauver(items);
    annoncer('« ' + r.libelle + ' » ' + (r.active ? 'activée.' : 'désactivée.'));
    rendre();
  }

  // --- suppression : fenêtre de confirmation ---
  function demander(id) {
    const r = items.find((x) => x.id === id);
    if (!r) return;
    aSupprimer = id;
    texte($('#supp-t'), 'Supprimer « ' + r.libelle + ' » ?');
    rendreFocus = memoriserFocus();
    $('#supp').hidden = false;
    $('#supp-non').focus({ preventScroll: true });
  }
  function fermer() {
    if ($('#supp').hidden) return;
    $('#supp').hidden = true;
    aSupprimer = null;
    if (rendreFocus) rendreFocus();
    rendreFocus = null;
  }
  function confirmer() {
    const r = items.find((x) => x.id === aSupprimer);
    if (!r) { fermer(); return; }
    items = items.filter((x) => x.id !== r.id);
    sauver(items);
    annoncer('« ' + r.libelle + ' » est supprimée.');
    rendre();
    fermer();
    // la carte supprimée n'existe plus : le focus ne peut pas lui revenir, il va sur le bouton de création
    if (!document.activeElement || !$('#contenu').contains(document.activeElement) || document.activeElement === document.body) $('#nouveau').focus({ preventScroll: true });
  }
  $('#supp-oui').addEventListener('click', confirmer);
  $('#supp-non').addEventListener('click', fermer);
  $('#supp-voile').addEventListener('click', fermer);
  vie.ecouter(document, 'keydown', (e) => { if (!$('#supp').hidden) clavierModale(e, $('#supp-dialog'), fermer); });

  // --- cartes ---
  // les animations d'entrée sont posées à la création seulement : un rendu ultérieur (interrupteur, suppression) ne les relance pas
  function creerCarte(r, i) {
    const sw = el('button', { type: 'button', class: 'inter', role: 'switch', 'aria-checked': 'true', on: { click: () => basculer(r.id) } }, el('i', { 'aria-hidden': 'true' }), el('span', { 'aria-hidden': 'true' }));
    const badgeEl = el('span', { class: 'mono' });
    const titre = el('h2', { class: 'rc-t rp-w' });
    const phrase = el('p', { class: 'phrase rp-w' });
    const note = el('p', { class: 'note rc-note rp-b' });
    const barre = el('span');
    const jauge = el('div', { class: 'jauge rp-b', role: 'img' }, barre);
    const modifier = el('a', { class: 'lien mini', href: 'reduction.html?id=' + encodeURIComponent(r.id) }, 'Modifier');
    const supprimer = el('button', { type: 'button', class: 'mini doux', on: { click: () => demander(r.id) } }, 'Supprimer');
    const sec = el('section', { class: 'rp rcarte' },
      el('div', { class: 'verre rp-fond', 'aria-hidden': 'true' }),
      svg('svg', { class: 'rp-trait', 'aria-hidden': 'true' }, svg('rect', { x: '0', y: '0', width: '100%', height: '100%', rx: '24', pathLength: '100' })),
      el('div', { class: 'rc-ent rp-b' }, sw, badgeEl), titre, phrase, note, jauge,
      el('div', { class: 'rc-act rp-b' }, modifier, supprimer));
    sec._c = { sw, badgeEl, titre, phrase, note, barre, jauge, modifier, supprimer };
    animerPanneau(sec, at, i);
    return sec;
  }
  function majCarte(sec, r) {
    const c = sec._c;
    sec.classList.toggle('off', !r.active);
    sec.setAttribute('aria-label', r.libelle);
    c.sw.setAttribute('aria-checked', r.active ? 'true' : 'false');
    c.sw.setAttribute('aria-label', 'Activer « ' + r.libelle + ' »');
    texte(c.sw.lastChild, r.active ? 'Active' : 'Inactive');
    texte(c.badgeEl, badge(r));
    texte(c.titre, r.libelle);
    // la phrase est reconstruite seulement si son texte change (nœuds neufs : <b> et <i>)
    const noeuds = phraseNoeuds(r), cle = noeuds.map((n) => (typeof n === 'string' ? n : n.tagName + n.textContent)).join('|');
    if (c.phrase._cle !== cle) { c.phrase._cle = cle; c.phrase.replaceChildren(...noeuds); }
    texte(c.note, detail(r));
    c.barre.style.width = jaugePct(r) + '%';
    c.jauge.setAttribute('aria-label', jaugeLabel(r));
    c.supprimer.setAttribute('aria-label', 'Supprimer « ' + r.libelle + ' »');
    c.modifier.setAttribute('aria-label', 'Modifier « ' + r.libelle + ' »');
  }
  function rendre() {
    liste($('#grille'), items, (r) => r.id, (r, i) => creerCarte(r, i), (n, r) => majCarte(n, r));
    voir($('#vide'), items.length === 0);
  }
  rendre();

}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
