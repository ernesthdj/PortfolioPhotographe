// Amorce commune de toutes les pages (hors intro) : charge le module de la page puis installe le routeur.
// <body data-module="atelier-dossiers" data-famille="atelier"> ; contenu de la page dans #contenu.
import { monterScene } from './lib/scene.js';
import { monterOmbres } from './lib/ombres.js';
import { installer } from './lib/routeur.js';

const { module: nom, famille } = document.body.dataset;
monterScene();
monterOmbres();
const mod = await import(`./pages/${nom}.js`);
installer({ nom, module: mod, famille });
await mod.init(document.getElementById('contenu'));
