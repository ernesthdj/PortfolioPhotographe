// Amorce commune de toutes les pages (hors intro) : charge le module de la page puis installe le routeur.
// <body data-module="atelier-dossiers" data-famille="atelier"> ; contenu de la page dans #contenu.
import { monterScene } from './lib/scene.js';
import { monterOmbres } from './lib/ombres.js';
import { installer, nomModuleValide } from './lib/routeur.js';

const { module: nom, famille } = document.body.dataset;
monterScene();
monterOmbres();
try {
  if (!nomModuleValide(nom)) throw new Error('Nom de module invalide');
  const mod = await import(`./pages/${nom}.js`);
  installer({ nom, module: mod, famille });
  await mod.init(document.getElementById('contenu'));
} catch (e) {
  // sans ce message, une erreur de chargement laisserait une page blanche
  const zone = document.getElementById('contenu');
  if (zone) zone.textContent = 'Cette page n’a pas pu se charger. Rechargez la page.';
  throw e;            // l'erreur reste visible dans la console du navigateur
}
