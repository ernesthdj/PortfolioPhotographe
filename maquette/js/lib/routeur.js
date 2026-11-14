// Routeur de navigation sans rechargement (chargement partiel).
//
// Un clic sur un lien interne récupère la page cible (fetch), en extrait #contenu et le remplace ;
// la coque persistante reste en place : en-tête du site public, ou menu latéral + ombres de l'atelier.
//   - history.pushState + popstate (Retour / Avancer), titre mis à jour, focus sur le titre principal, scroll en haut
//   - chaque module de page expose init(racine) et destroy() ; le routeur appelle destroy() de l'ancienne page
//     puis init() de la nouvelle
//   - transition : le contenu sortant se décolore et s'efface vers le blanc (fondu 0,32 s), le nouveau se dessine en morphing
//   - préchargement au survol / focus (cache en mémoire)
//   - autre famille de pages (site <-> atelier <-> intro) ou erreur de fetch : navigation classique
// Sans JavaScript, les liens restent de vrais liens.
import { figerEntete } from './entete.js';

const E = 'cubic-bezier(.45,0,.2,1)';
const cache = new Map();                 // URL absolue sans ancre -> Promise<Document>
const dossierPages = new URL('../pages/', import.meta.url);
let courant = null;                      // { nom, module }
let famille = null;
let sequence = 0;

const reduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const cle = (url) => { const u = new URL(url, window.location.href); u.hash = ''; return u.href; };
const classique = (url) => { window.location.assign(url); };

function recuperer(url) {
  const k = cle(url);
  if (!cache.has(k)) {
    cache.set(k, fetch(k, { credentials: 'same-origin', headers: { Accept: 'text/html' } })
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then((t) => new DOMParser().parseFromString(t, 'text/html')));
  }
  return cache.get(k).catch((e) => { cache.delete(k); throw e; });
}

function moduleDe(nom) { return import(new URL(nom + '.js', dossierPages).href); }

async function changerStyles(doc, url) {
  const voulus = [...doc.querySelectorAll('link[data-page-css]')].map((l) => new URL(l.getAttribute('href'), url).href);
  const anciens = [...document.querySelectorAll('link[data-page-css]')];
  const presents = new Set(anciens.map((l) => l.href));
  await Promise.all(voulus.filter((h) => !presents.has(h)).map((h) => new Promise((ok) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = h; l.setAttribute('data-page-css', '');
    l.onload = l.onerror = ok;
    document.head.append(l);
  })));
  anciens.filter((l) => !voulus.includes(l.href)).forEach((l) => l.remove());
}

/** Réchauffe le cache des feuilles de style de la page suivante, sans toucher à celles de la page courante. */
function prechargerStyles(doc, url) {
  const presents = new Set([...document.querySelectorAll('link')].map((l) => l.href));
  doc.querySelectorAll('link[data-page-css]').forEach((l) => {
    const h = new URL(l.getAttribute('href'), url).href;
    if (presents.has(h)) return;
    const p = document.createElement('link');
    p.rel = 'preload'; p.as = 'style'; p.href = h;
    document.head.append(p);
    setTimeout(() => p.remove(), 4000);
  });
}

const FONDU = [{ opacity: 1, filter: 'none' }, { opacity: 1, filter: 'grayscale(1) contrast(1.05)', offset: .4 }, { opacity: 0, filter: 'grayscale(1) brightness(1.6)' }];

export async function aller(url, { push = true } = {}) {
  const id = ++sequence;
  let doc;
  try { doc = await recuperer(url); } catch (e) { return classique(url); }
  if (id !== sequence) return;
  const cible = doc.querySelector('#contenu');
  if (!cible || doc.body.dataset.famille !== famille || !doc.body.dataset.module) return classique(url);

  const contenu = document.getElementById('contenu');
  // les éléments propres à la page (pastille du menu, etc.) s'effacent avec le contenu
  const sortants = [contenu, document.getElementById('sous-entete')].filter(Boolean);
  // 1. pendant le fondu, le module et les styles de la page suivante se préparent : rien de la page courante n'est touché
  const moduleP = moduleDe(doc.body.dataset.module);
  moduleP.catch(() => {});
  prechargerStyles(doc, url);
  // 2. la page courante reste intacte et se décolore puis s'efface vers le blanc (développement photo à l'envers, 0,32 s)
  if (!reduit()) {
    sortants.forEach((n) => n.animate(FONDU, { duration: 320, easing: 'ease-in', fill: 'forwards' }));
    await attendre(340); if (id !== sequence) return;
  }
  let mod;
  try { mod = await moduleP; } catch (e) { return classique(url); }
  if (id !== sequence) return;
  // 3. fin de la page courante, puis styles et contenu de la suivante (tout dans le même battement : aucun état intermédiaire visible)
  const ancien = courant; courant = null;
  if (ancien && ancien.module && typeof ancien.module.destroy === 'function') { try { ancien.module.destroy(); } catch (e) { /* page déjà défaite */ } }
  figerEntete();
  await changerStyles(doc, url);
  if (id !== sequence) return;
  contenu.replaceChildren(...[...cible.childNodes].map((n) => document.importNode(n, true)));
  sortants.forEach((n) => n.getAnimations().forEach((an) => an.cancel()));
  contenu.style.animation = '';
  document.title = doc.title;
  document.body.dataset.module = doc.body.dataset.module;
  if (push) { if (cle(url) === cle(window.location.href) && !new URL(url, window.location.href).hash) history.replaceState({}, '', url); else history.pushState({}, '', url); }
  window.scrollTo(0, 0);
  // 4. page suivante
  try {
    courant = { nom: doc.body.dataset.module, module: mod };
    await mod.init(contenu);
  } catch (e) { return classique(url); }
  // 5. accessibilité : le focus va sur le titre principal du nouveau contenu
  const titre = contenu.querySelector('h1') || contenu;
  titre.setAttribute('tabindex', '-1');
  titre.focus({ preventScroll: true });
}

function lienInterne(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#')) return null;
  const u = new URL(a.href, window.location.href);
  if (u.origin !== window.location.origin) return null;
  if (u.pathname === window.location.pathname && u.search === window.location.search && u.hash) return null;   // ancre seule
  return u;
}

/** À appeler une fois, au chargement de la première page de la famille. */
export function installer({ nom, module, famille: fam }) {
  courant = { nom, module }; famille = fam;
  document.addEventListener('click', (e) => {
    const u = lienInterne(e);
    if (!u) return;
    e.preventDefault();
    aller(u.href);
  });
  const prechauffer = (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || (a.getAttribute('href') || '#').startsWith('#')) return;
    const u = new URL(a.href, window.location.href);
    if (u.origin === window.location.origin) recuperer(u.href).catch(() => {});
  };
  document.addEventListener('pointerover', prechauffer);
  document.addEventListener('focusin', prechauffer);
  window.addEventListener('popstate', () => aller(window.location.href, { push: false }));
}
