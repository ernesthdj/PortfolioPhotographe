// Coque commune de l'atelier : pastille de verre à gauche + menu PID complet (03-APP-FLOW §2).
// Traduit le « core() » des planches Erp*.dc.html.
//  - rythme d'entrée ×0,45 (plus rapide que le site public)
//  - la coque est PERSISTANTE (routeur AJAX) : montée au premier chargement seulement ; entre deux pages de
//    l'atelier le menu ne bouge pas, seule l'entrée active et le badge sont mis à jour
//  - un seul groupe ouvert à la fois ; sous-entrées marquées d'un tiret
import { rythme } from './anim.js';
import { el, svg, mot, animer, texte, liste } from './dom.js';
import { monterScene } from './scene.js';
import { monterOmbres } from './ombres.js';
import { param } from './params.js';

const IC = {
  bord: 'M4 4 L11 4 L11 11 L4 11 Z M13 4 L20 4 L20 8 L13 8 Z M13 10 L20 10 L20 20 L13 20 Z M4 13 L11 13 L11 20 L4 20 Z',
  cal: 'M4 6 L20 6 L20 20 L4 20 Z M4 10 L20 10 M8 3 L8 7 M16 3 L16 7',
  dos: 'M3 7 L3 19 L21 19 L21 9 L11 9 L9 7 Z',
  dem: 'M4 5 L20 5 L20 16 L10 16 L6 20 L6 16 L4 16 Z',
  cli: 'M15 8 A3 3 0 1 0 9 8 A3 3 0 1 0 15 8 M5 20 C5 14 19 14 19 20',
  prod: 'M3 12 A9 9 0 1 0 21 12 A9 9 0 1 0 3 12 M8 12 A4 4 0 1 0 16 12 A4 4 0 1 0 8 12',
  arg: 'M4 12 A8 8 0 1 0 20 12 A8 8 0 1 0 4 12 M14.5 9 C13 7.5 9.5 8 9.5 10 C9.5 12.5 14.5 11.5 14.5 14 C14.5 16 11 16.5 9.5 15 M12 6.5 L12 17.5',
  stat: 'M5 20 L5 13 M10 20 L10 8 M15 20 L15 11 M20 20 L20 5',
  cat: 'M4 12 L12 4 L20 4 L20 12 L12 20 Z M16 8 L16.2 8',
  red: 'M5 19 L19 5 M8 8 A2 2 0 1 0 4 8 A2 2 0 1 0 8 8 M20 16 A2 2 0 1 0 16 16 A2 2 0 1 0 20 16',
  par: 'M11 8 A3 3 0 1 0 5 8 A3 3 0 1 0 11 8 M3 20 C3 15 13 15 13 20 M19 8 A3 3 0 1 0 13 8 M14 15 C19 14 21 17 21 20',
  vit: 'M3 5 L21 5 L21 19 L3 19 Z M3 15 L9 10 L14 14 L17 12 L21 15',
  reg: 'M15 12 A3 3 0 1 0 9 12 A3 3 0 1 0 15 12 M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5'
};

// h : page de l'atelier correspondante (absent = planche exclue ou non dessinée -> entrée désactivée : aria-disabled, grisée, sans lien)
const MP = [
  { k: 'bord', t: 'Tableau de bord', ic: 'bord', h: 'tableau-de-bord.html' }, { k: 'plan', t: 'Planning', ic: 'cal', h: 'planning.html' },
  { k: 'dos', t: 'Dossiers', ic: 'dos', h: 'dossiers.html' }, { k: 'dem', t: 'Demandes', ic: 'dem', h: 'demandes.html' },
  { k: 'cli', t: 'Clients', ic: 'cli', h: 'clients.html' }, { k: 'prod', t: 'Production', ic: 'prod', h: 'production.html' },
  { k: 'arg', t: 'Argent', ic: 'arg', grp: 1 }, { k: 'chf', t: 'Chiffres', p: 'arg' }, { k: 'ech', t: 'Échéanciers', p: 'arg' },
  { k: 'stat', t: 'Statistiques', ic: 'stat' },
  { k: 'cat', t: 'Catalogue', ic: 'cat', grp: 1 }, { k: 'srv', t: 'Services', p: 'cat', h: 'services.html' }, { k: 'opt', t: 'Options', p: 'cat', h: 'options.html' },
  { k: 'ctg', t: 'Catégories', p: 'cat', h: 'categories.html' }, { k: 'fic', t: 'Fiches techniques', p: 'cat', h: 'fiches.html' }, { k: 'mod', t: 'Modèles de production', p: 'cat', h: 'modeles.html' },
  { k: 'red', t: 'Réductions', ic: 'red', h: 'reductions.html' }, { k: 'par', t: 'Parrainage', ic: 'par' },
  { k: 'vit', t: 'Vitrine', ic: 'vit', grp: 1 }, { k: 'med', t: 'Médiathèque', p: 'vit' }, { k: 'gal', t: 'Galeries', p: 'vit' },
  { k: 'txt', t: 'Textes', p: 'vit' }, { k: 'tem', t: 'Témoignages', p: 'vit' }, { k: 'mis', t: 'Services mis en avant', p: 'vit' },
  { k: 'reg', t: 'Réglages', ic: 'reg', grp: 1 }, { k: 'gen', t: 'Généraux', p: 'reg' }, { k: 'capa', t: 'Capacité', p: 'reg' }, { k: 'ori', t: 'Origines et étiquettes', p: 'reg' }
];

// Entrée du menu mise en évidence, selon la page (PAGE_MENU des planches) ; groupe ouvert au départ.
const PAGES = {
  'tableau-de-bord': { menu: 'bord' }, dossiers: { menu: 'dos' }, dossier: { menu: 'dos' }, demandes: { menu: 'dem' },
  services: { menu: 'srv', groupe: 'cat' }, service: { menu: 'srv', groupe: 'cat' }, options: { menu: 'opt', groupe: 'cat' }, option: { menu: 'opt', groupe: 'cat' },
  categories: { menu: 'ctg', groupe: 'cat' }, fiches: { menu: 'fic', groupe: 'cat' }, fiche: { menu: 'fic', groupe: 'cat' }, modeles: { menu: 'mod', groupe: 'cat' },
  clients: { menu: 'cli' }, client: { menu: 'cli' }, planning: { menu: 'plan' }, production: { menu: 'prod' },
  reductions: { menu: 'red' }, reduction: { menu: 'red' }
};

const CONTOUR = 'M0 24 A24 24 0 0 1 24 0 L216 0 A24 24 0 0 1 240 24 L240 828 A24 24 0 0 1 216 852 L24 852 A24 24 0 0 1 0 828 Z';

let coque = null;   // coque persistante : montée une seule fois

/**
 * Monte (au premier appel) la scène, les ombres et la coque de l'atelier ; aux appels suivants
 * (navigation sans rechargement) met seulement à jour l'entrée active, le groupe ouvert et le badge.
 * Le menu ne rejoue donc son entrée qu'au premier chargement.
 * @param {string} page clé de PAGES (ex. 'dossiers')
 * @param {{nDemandes?: number}} opt
 * @returns le rythme (T, H, DR, E, K), la table d'animations communes `a`, l'état de la planche et setBadge()
 */
export function monterAtelier(page, opt = {}) {
  monterScene();
  monterOmbres();
  const R = rythme(.45), { T, H, DR, E, K } = R;
  const cfg = PAGES[page] || { menu: 'bord' };
  const etat = param('etat', ['Données', 'Chargement', 'Vide', 'Erreur'], 'Données');
  const fond = document.getElementById('fond');
  const fixe = !!(coque && coque.fond.isConnected);   // coque déjà là : rien ne se rejoue côté menu
  const IT = { o: 'wIn 0s both', f: 'wIn 0s both' };

  const a = {
    sep: DR(0, .8), logo: fixe ? IT : T(.2, .7), sig: H(.6), side: fixe ? 'habille 0s both' : H(.1),
    sideT: fixe ? 'drawS 0s both' : DR(0, 1), sideS: fixe ? 'habille 0s both' : H(.6),
    eyeL: `wIn ${(.4 * K).toFixed(2)}s ${E} ${(.6 * K).toFixed(2)}s both`, eye: T(.7, .8), h1: T(.9, .8), h2: T(1.1, 1.1),
    nt: `wIn ${(.9 * K).toFixed(2)}s ${E} ${(1.8 * K).toFixed(2)}s both`, vT: T(1.4, .9),
    t1: T(1.9, .5), t2: T(2.1, .5), l1: DR(2, 1), l2: DR(2.2, 1), p1: H(1.7), p2: H(1.9), p3: H(2.1),
    dn: { o: `wIn .8s ${E} .15s both`, f: `wIn .8s ${E} .3s both` }
  };

  if (fixe) {
    const st = coque.st;
    st.m = cfg.menu; if (cfg.groupe) st.g = cfg.groupe;
    if (opt.nDemandes != null) st.nDem = opt.nDemandes;
    coque.dessiner();
  } else {
    coque = monterCoque(fond, cfg, opt, { a, T, DR, IT });
  }

  return {
    ...R, a, fixe, etat, ok: etat === 'Données', charge: etat === 'Chargement', vide: etat === 'Vide', erreur: etat === 'Erreur',
    fond,
    /** Met à jour le badge « Demandes » du menu (0 = badge masqué). */
    setBadge(n) { coque.st.nDem = n; coque.dessiner(); }
  };
}

function monterCoque(fond, cfg, opt, { a, T, DR, IT }) {
  const verre = el('div', { class: 'verre', 'aria-hidden': 'true', style: { left: '24px', top: '24px', width: '240px', height: '852px', opacity: '0' } });
  const contour = svg('path', { pathLength: '100', d: CONTOUR, style: { strokeWidth: '1px', stroke: 'rgba(13,14,16,.25)' } });
  const traits = svg('svg', { class: 'ln', 'aria-hidden': 'true', style: { left: '24px', top: '24px', width: '240px', height: '852px' } }, contour);
  const logoMot = mot('Ernest H.');
  const logo = el('a', { href: 'tableau-de-bord.html', class: 'lien', style: 'position:absolute;left:48px;top:50px;font:600 20px Inter,sans-serif;letter-spacing:-.01em' }, logoMot);
  const sous = el('span', { class: 'mono', style: 'position:absolute;left:48px;top:80px' }, 'Atelier · photographe');
  const ul = el('ul', { class: 'menu' });
  const nav = el('nav', { 'aria-label': 'Menu de l’atelier', style: 'position:absolute;left:36px;top:124px;width:216px' }, ul);
  const site = el('a', { href: '../accueil.html', class: 'lien mini', style: 'position:absolute;left:48px;top:800px' }, 'Voir le site ↗');
  const quitter = el('a', { role: 'link', 'aria-disabled': 'true', tabindex: '0', title: 'Bientôt disponible', class: 'lien mini', style: 'position:absolute;left:48px;top:830px;color:#4B4D52', on: { click: (e) => e.preventDefault() } }, 'Se déconnecter');
  fond.insertBefore(el('div', { id: 'coque-atelier', style: 'display:contents' }, verre, traits, logo, sous, nav, site, quitter), fond.querySelector('#contenu'));
  animer(verre, a.side); animer(contour, a.sideT); animer(logoMot, a.logo); animer(sous, a.sideS); animer(site, a.sideS); animer(quitter, a.sideS);

  // --- menu : état { m: entrée active, g: groupe ouvert, gu: ouverture par l'utilisateur } ---
  const st = { m: cfg.menu, g: cfg.groupe || null, gu: false, nDem: opt.nDemandes == null ? 2 : opt.nDemandes };
  const ctx = { st, fond, apres: false, dessiner: null };
  const tops = MP.filter((m) => !m.p);
  const dessiner = () => {
    const vus = MP.filter((m) => !m.p || st.g === m.p);
    liste(ul, vus, (m) => m.k, (m) => creerEntree(m), (li, m) => majEntree(li, m));
    ctx.apres = true;
  };
  const creerEntree = (m) => {
    const sub = !!m.p, href = m.h || '#', mort = !m.h && !m.grp;   // mort : page non dessinée, entrée désactivée (ni lien ni clic)
    const k = sub ? tops.indexOf(MP.find((x) => x.k === m.p)) : tops.indexOf(m);
    const j = sub ? MP.filter((x) => x.p === m.p).indexOf(m) : 0;
    const quick = sub && (st.gu || ctx.apres), kk = sub ? k + (j + 1) * .4 : k;
    const tracePath = svg('path', { pathLength: '100', d: sub ? 'M9 12 L15 12' : IC[m.ic] });
    const lab = mot(m.t);
    // groupe (Argent, Catalogue…) : un vrai bouton qui déplie ; page non dessinée : entrée désactivée ; sinon un lien
    const a1 = el(m.grp ? 'button' : 'a', m.grp ? { type: 'button', 'aria-current': 'false', on: { click: (e) => allerVers(e, m, href) } }
      : mort ? { role: 'link', 'aria-disabled': 'true', tabindex: '0', title: 'Bientôt disponible', 'aria-current': 'false', on: { click: (e) => e.preventDefault() } }
      : { href, 'aria-current': 'false', on: { click: (e) => allerVers(e, m, href) } },
      svg('svg', { class: 'ic', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, tracePath),
      el('span', { class: 'lab' }, lab));
    animer(tracePath, quick ? DR(j * .1, .5) : DR(.4 + kk * .05, .6));
    animer(lab, quick ? T(.1 + j * .1, .45) : T(.5 + kk * .05, .5));
    if (m.k === 'dem') a1.append(el('span', { class: 'bd' }));
    if (m.grp) a1.append(svg('svg', { class: 'chev', viewBox: '0 0 12 12', 'aria-hidden': 'true' }, svg('path', { d: 'M4 2 L8 6 L4 10' })));
    return el('li', null, a1);
  };
  const majEntree = (li, m) => {
    const a1 = li.firstElementChild, sub = !!m.p, on = st.m === m.k;
    a1.className = 'it' + (on ? ' on' : '') + (sub ? ' sub' : '');
    a1.setAttribute('aria-current', on ? 'page' : 'false');
    if (m.grp) { a1.querySelector('.chev').setAttribute('class', 'chev' + (st.g === m.k ? ' ouv' : '')); a1.setAttribute('aria-expanded', st.g === m.k ? 'true' : 'false'); }
    if (m.k === 'dem') {
      const bd = a1.querySelector('.bd');
      bd.hidden = !st.nDem;
      if (st.nDem) { texte(bd, st.nDem); bd.setAttribute('aria-label', st.nDem + ' en attente'); }
    }
  };
  const allerVers = (e, m, href) => {
    if (m.grp) { e.preventDefault(); st.g = st.g === m.k ? null : m.k; st.gu = true; dessiner(); }
  };
  ctx.dessiner = dessiner;
  dessiner();
  return ctx;
}
