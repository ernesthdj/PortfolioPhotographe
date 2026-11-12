// Calque d'ombres d'arrière-plan : dégradés CSS, entrée et sortie en fondu seulement.
import { el } from './dom.js';
import { ombreParam } from './params.js';

const OM = [['Diagonale', 'dia'], ['Studio · latérale', 'lat'], ['Studio · spot', 'spot'], ['Studio · cyclo', 'cyc'], ['Studio · strip', 'str']];

export function monterOmbres(choix = ombreParam()) {
  if (choix === 'Sans' || document.querySelector('#fenetre > .om')) return null;   // idempotent (routeur AJAX)
  const alterne = choix === 'Alternance';
  const calque = el('div', { class: 'om', 'aria-hidden': 'true' });
  OM.forEach(([nom, cls], k) => {
    const c = el('div', { class: 'om-i ' + cls }, el('i'));
    c.style.display = alterne || choix === nom ? 'block' : 'none';
    c.style.animation = alterne ? `alt${k} 70s ease-in-out infinite` : (choix === nom ? 'seul 2.5s ease-in-out both' : 'none');
    calque.append(c);
  });
  (document.getElementById('fenetre') || document.getElementById('scene')).append(calque);   // calque plein fenêtre, derrière la scène
  return calque;
}
