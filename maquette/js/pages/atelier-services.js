// Atelier · services : la logique est partagée dans atelier-catalogue-logique.js.
import { monterListe } from './atelier-catalogue-logique.js';

let vie = null;

export function init() {
  vie = monterListe({ opt: false });
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
