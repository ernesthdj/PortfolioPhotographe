// À propos : portrait, récit (le volet développeur reste discret), trois piliers, matériel, appel à contacter.
import { creerEcran } from '../lib/ecran.js';
import { eyebrow, titre, texte, ecrit, filet, bouton, lienFleche, photo, rv } from '../lib/ecriture.js';
import { el } from '../../../js/lib/dom.js';

export const titreDoc = 'À propos · Ernest H.';

const RECIT = [
  'Photographe autodidacte basé en Belgique, je raconte vos journées comme elles se vivent : sans mise en scène, au plus près des gens, avec la lumière qui est là.'
];
const RECIT_DEV = ['Le reste du temps, je suis développeur : ce site, son simulateur et chaque trait qui s’y dessine sortent de mon clavier.'];
const PILIERS = [
  ['01', 'Lumière naturelle', 'Je travaille avec la lumière du lieu, sans l’écraser au flash.'],
  ['02', 'L’instant vrai', 'Je me fais oublier pour saisir ce qui se passe vraiment.'],
  ['03', 'Retouche discrète', 'Des couleurs fidèles, une peau qui reste une peau.']
];

export function creer(ctx) {
  const e = creerEcran(ctx);
  const construire = () => {
    const piliers = rv(el('div', { class: 'piliers' },
      ...PILIERS.map(([n, t, d], i) => el('div', null,
        filet(0.1 + i * 0.15),
        el('div', { class: 'pilier' },
          el('span', { class: 'num' }, ecrit(n, { d: 0.25 + i * 0.15, u: 0.4 })),
          el('div', null,
            el('div', { class: 'pilier-t' }, ecrit(t, { d: 0.25 + i * 0.15, u: 0.6 })),
            el('div', { class: 'pilier-d' }, ecrit(d, { d: 0.4 + i * 0.15, u: 0.6, bloc: true }))))
      )),
      filet(0.9)));

    e.page.replaceChildren(
      eyebrow('À propos'),
      rv(el('div', { class: 'photo-bloc portrait' }, photo({ ton: 3, libelle: '[Portrait d’Ernest]', alt: 'Emplacement du portrait du photographe' }))),
      rv(el('div', { class: 'legende mono' }, ecrit('Ernest H. · photographe & développeur', { d: 0.1, u: 0.7 }), el('div', null, ecrit('[Lieu]', { d: 0.25, u: 0.4 })))),
      titre('Un regard', 'qui ne dérange pas.'),
      texte(RECIT, { d: 0.1, classe: 'texte encre' }),
      texte(RECIT_DEV, { d: 0.1, classe: 'texte' }),
      piliers,
      rv(el('div', { class: 'materiel' }, el('span', { class: 'regle', 'aria-hidden': 'true' }),
        el('div', { class: 'mono petit' }, el('div', null, ecrit('Sony A7 IV · 24-70 mm GM', { d: 0.1, u: 0.8 })), el('div', null, ecrit('Lightroom Classic · et un éditeur de code', { d: 0.25, u: 0.8, bloc: true }))))),
      rv(el('div', { class: 'actions' },
        bouton('Me contacter', { href: '#/contact' }),
        el('div', { class: 'centre' }, lienFleche('ou simuler un devis', { href: '#/simulateur', aria: 'Simuler un devis' }))))
    );
  };
  return { ...e, activer() { construire(); e.activer(); } };
}
