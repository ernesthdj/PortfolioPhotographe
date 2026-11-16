// Point d'entrée : gestionnaire d'écrans de la version mobile.
// Navigation par adresse (#/ecran/argument) : le bouton Retour du téléphone fonctionne, les écrans sont partageables.
// À chaque changement : l'écran courant se décompose (≈ 0,65 s), PUIS le suivant se dessine ; bannière et dock restent en place.
import { creerChrome } from './chrome.js';

const REGISTRE = {
  intro: () => import('./ecrans/intro.js'),
  accueil: () => import('./ecrans/accueil.js'),
  galerie: () => import('./ecrans/galerie.js'),
  services: () => import('./ecrans/services.js'),
  apropos: () => import('./ecrans/apropos.js'),
  contact: () => import('./ecrans/contact.js')
};
const DUREE_SORTIE = 650;

const etat = { ecran: null, connecte: false, email: '', brouillon: null };
const instances = {};
const racine = document.getElementById('ecrans');
const ctx = {
  etat,
  racineChrome: document.getElementById('chrome'),
  ecranCourant: () => instances[etat.ecran] || null,
  /** Navigue : l'adresse est la source de vérité, `hashchange` fait le travail. */
  aller(nom, arg) { location.hash = '#/' + nom + (arg ? '/' + encodeURIComponent(arg) : ''); },
  majChrome: () => chrome.maj(),
  toast: (m) => chrome.toast(m)
};
const chrome = creerChrome(ctx);

const reduit = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const lireHash = () => {
  const [, nom = '', arg = ''] = location.hash.split('/');
  return { nom: nom || 'accueil', arg: arg ? decodeURIComponent(arg) : null };
};

async function charger(nom) {
  if (!instances[nom]) {
    const mod = await REGISTRE[nom]();
    const inst = mod.creer(ctx);
    inst.titreDoc = mod.titreDoc;
    instances[nom] = inst;
    racine.append(inst.racine);
  }
  return instances[nom];
}

let occupe = false, enAttente = false, chromeMontre = false;

async function traiter() {
  if (occupe) { enAttente = true; return; }
  const { nom, arg } = lireHash();
  if (!REGISTRE[nom]) {                                  // écran pas encore construit : on reste où l'on est
    chrome.toast('Cet écran arrive bientôt');
    if (etat.ecran) history.replaceState(null, '', '#/' + etat.ecran);
    return;
  }
  const courant = instances[etat.ecran];
  if (courant && etat.ecran === nom) {                   // même écran, autre argument (ex. autre service)
    if (courant.changer) { courant.changer(arg); chrome.maj(); }
    return;
  }
  occupe = true;
  try {
    const suivant = await charger(nom);
    if (courant) {
      courant.sortie(true);
      await attendre(reduit() ? 0 : (courant.dureeSortie ?? DUREE_SORTIE));
      courant.desactiver();
    }
    etat.ecran = nom;
    document.title = suivant.titreDoc || 'Ernest H. · Photographe';
    suivant.activer(arg);
    chrome.maj();
    const cache = !!(suivant.masqueChrome && suivant.masqueChrome());
    if (!cache && !chromeMontre) { chromeMontre = true; chrome.montrer(); }   // la bannière et le dock se dessinent à la première page visible
    else if (!cache) suivant.focus();
  } finally {
    occupe = false;
    if (enAttente) { enAttente = false; traiter(); }
  }
}

window.addEventListener('hashchange', traiter);
if (!location.hash || location.hash === '#') history.replaceState(null, '', '#/intro');   // première visite : l'intro, puis l'accueil
traiter();
