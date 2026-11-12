// Atelier · service : la logique est partagée dans atelier-catalogue-logique.js.
import { monterFormulaire } from './atelier-catalogue-logique.js';

let vie = null;

export function init() {
  vie = monterFormulaire({ opt: false });
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  const fond = document.getElementById('fond');
  if (fond) fond.style.animation = '';
}
