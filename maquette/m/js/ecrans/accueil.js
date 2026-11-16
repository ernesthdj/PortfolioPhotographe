// Accueil (version provisoire du socle : l'intro et le fil « C » arrivent en phase 2).
import { creerEcran } from '../lib/ecran.js';
import { eyebrow, titre, texte, photo, rv, bouton } from '../lib/ecriture.js';
import { el } from '../../../js/lib/dom.js';

export const titreDoc = 'Ernest H. · Photographe';

export function creer(ctx) {
  const e = creerEcran(ctx);
  const construire = () => {
    e.page.replaceChildren(
      eyebrow('Sc. 01 · Sélection 2026'),
      rv(el('div', { class: 'photo-bloc' }, photo({ ton: 1, libelle: 'Mariés · château', alt: 'Les mariés devant le château, la mariée sourit' }))),
      titre('Un regard,', 'un instant, une histoire.'),
      texte('Photographe de mariage et d’événements : une lumière naturelle, des gestes vrais, une retouche discrète.', { d: 0.2 }),
      rv(el('div', { class: 'actions' }, bouton('Voir les services', { href: '#/services', d: 0.1 })))
    );
  };
  return { ...e, activer() { construire(); e.activer(); } };
}
