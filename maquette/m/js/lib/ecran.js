// Écran de base : racine, zone défilante, page, révélateur. Chaque écran l'étend (voir js/ecrans/*.js).
//
// Contrat d'un module d'écran :
//   export const titreDoc = '…';
//   export function creer(ctx) → { racine, activer(arg), desactiver(), sortie(oui), focus(), [sousNav()], [changer(arg)] }
import { el } from '../../../js/lib/dom.js';
import { creerVie } from '../../../js/lib/vie.js';
import { creerRevelateur } from './revelateur.js';

export function creerEcran(ctx) {
  const vie = creerVie();
  const vg = el('div', { class: 'vg', 'aria-hidden': 'true' });
  const page = el('div', { class: 'page' });
  const defil = el('div', { class: 'defil', tabindex: '-1' }, page);
  const racine = el('section', { class: 'ecran', 'aria-hidden': 'true' }, vg, defil);
  const rev = creerRevelateur(racine, defil);
  defil.addEventListener('scroll', rev.verifier, { passive: true });
  let minuterie = 0;

  return {
    ctx, vie, racine, page, defil, rev,
    activer() { racine.classList.add('actif', 'go'); racine.removeAttribute('aria-hidden'); rev.demarrer(); },
    desactiver() {
      clearTimeout(minuterie);
      racine.classList.remove('actif', 'go', 'out');
      racine.setAttribute('aria-hidden', 'true');
      rev.reinitialiser();
      defil.scrollTop = 0;
    },
    sortie(oui) { racine.classList.toggle('out', oui); },
    /** Place le focus sur le titre de l'écran (lecteurs d'écran, clavier). */
    focus() { const cible = racine.querySelector('h1') || defil; cible.setAttribute('tabindex', '-1'); cible.focus({ preventScroll: true }); },
    /** Le contenu se décompose (0,23 s), est refait par `construire`, puis se réécrit. */
    refaire(construire) {
      clearTimeout(minuterie);
      racine.classList.add('out');
      minuterie = setTimeout(() => {
        construire();
        defil.scrollTop = 0;
        racine.classList.remove('out');
        rev.reinitialiser();
        rev.demarrer();
      }, 230);
    }
  };
}
