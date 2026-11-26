// Accueil, structure « C · Fil » : une photo d'ouverture, l'accroche écrite par la goutte, des séances,
// un témoignage, l'index des services (prix lus dans data/tarifs.js) et le bloc de clôture.
import { creerEcran } from '../lib/ecran.js';
import { ecrit, filet, bouton, photo, rv } from '../lib/ecriture.js';
import { el, svg } from '../../../js/lib/dom.js';
import { SERVICES } from '../../../data/tarifs.js';
import { PHOTOS } from '../photos.js';

export const titreDoc = 'Ernest H. · Photographe';

const P = Object.fromEntries(PHOTOS.map((p) => [p.id, p]));
const cliche = (id, d) => photo({ ton: P[id].ton, nb: P[id].nb, libelle: P[id].libelle, alt: P[id].alt, src: P[id].src, d });
const INDEX = [['mariages', 'mar'], ['engagement', 'eng'], ['famille', 'fam'], ['anniversaires', 'ann'], ['evenementiel', 'evt'], ['culinaire', 'cul']];
const NOMS = { mar: 'Mariages', eng: 'Engagement', fam: 'Famille lifestyle', ann: 'Anniversaires', evt: 'Événementiel', cul: 'Culinaire & studio' };

function prix(s) { return s.mode === 'P4' ? `dès ${s.unit} € / plat` : `dès ${s.base} €`; }

export function creer(ctx) {
  const e = creerEcran(ctx);

  const construire = () => {
    const ligneAccroche = (contenu, d, u) => rv(el('span', { class: 'ligne' }, ecrit(contenu, { d, u, tete: true })));
    const index = rv(el('div', { class: 'index' },
      el('div', { class: 'mono' }, ecrit('Services', { d: 0.1, u: 0.5 })),
      el('div', { style: { height: '12px' } }),
      ...INDEX.map(([cle, id], k) => {
        const s = SERVICES.find((x) => x.id === id);
        return el('div', null, filet(0.25 + k * 0.1),
          el('a', { class: 'index-ligne', href: '#/services/' + cle },
            el('span', { class: 'mono', style: { width: '26px' } }, String(k + 1).padStart(2, '0')),
            el('span', { class: 'index-nom' }, ecrit(NOMS[id], { d: 0.4 + k * 0.1, u: 0.55 })),
            el('span', { class: 'mono' }, prix(s))));
      }),
      filet(0.95)));

    const contourBtn = svg('svg', { class: 'contour-btn', 'aria-hidden': 'true' }, svg('rect', { x: 0, y: 0, width: '100%', height: 52, rx: 26, ry: 26, pathLength: 100 }));
    contourBtn.style.setProperty('--d', '.9s');

    e.page.replaceChildren(
      rv(el('div', { class: 'accueil-haut' }, el('span', { class: 'mono' }, ecrit('Sc. 01', { d: 0.45, u: 0.5 })), el('span', { class: 'mono' }, ecrit('Sélection · 2026', { d: 0.55, u: 0.6 })))),
      rv(el('div', { class: 'photo-bloc' }, cliche('chateau', 0.3))),
      el('h1', { class: 'accroche' },
        ligneAccroche(() => { const f = document.createDocumentFragment(); f.append('Un regard, ', el('span', { class: 'ser' }, 'un instant,')); return f; }, 1.1, 0.9),
        ligneAccroche('une histoire.', 1.7, 0.7)),

      rv(el('div', { class: 'seance' },
        el('span', { class: 'mono' }, ecrit('Mariage · [Lieu] · 2026', { d: 0.1, u: 0.6 })),
        el('div', { class: 'seance-l' }, ecrit('[Une ligne sur la journée, écrite par Ernest.]', { d: 0.4, u: 0.7, bloc: true })),
        filet(0.2, 1))),
      rv(el('div', { class: 'rangee' }, el('div', { class: 'tuile-a' }, cliche('bouquet', 0.1)), el('div', { class: 'tuile-a' }, cliche('baiser', 0.35)))),

      rv(el('div', { class: 'seance' },
        el('span', { class: 'mono' }, ecrit('Engagement · [Lieu] · 2026', { d: 0.1, u: 0.6 })),
        el('div', { class: 'seance-l' }, ecrit('[Une ligne sur la séance.]', { d: 0.4, u: 0.6, bloc: true })))),
      rv(el('div', { class: 'rangee pleine' }, el('div', { class: 'tuile-a' }, cliche('grand-champ', 0.1)))),
      rv(el('div', { class: 'rangee pleine' }, el('div', { class: 'tuile-a' }, cliche('champ', 0.1)))),

      rv(el('blockquote', { class: 'temoin', style: { margin: '40px 0 0' } },
        el('div', { class: 'ser' }, ecrit('« [Un témoignage court d’un couple.] »', { d: 0.1, u: 1, bloc: true, tete: true })),
        el('div', { class: 'mono' }, ecrit('[Prénom & prénom] · [Lieu]', { d: 0.8, u: 0.6 })))),

      index,

      rv(el('div', { class: 'cloture' },
        el('div', { class: 'cloture-t' },
          el('span', { class: 'ligne' }, ecrit('Comment voulez-vous', { d: 0.1, u: 0.7, tete: true })),
          el('span', { class: 'ligne' }, ecrit(() => el('span', { class: 'ser' }, 'commencer ?'), { d: 0.5, u: 0.6, tete: true }))),
        el('div', { class: 'duo' },
          bouton('Simuler un devis', { href: '#/simulateur', d: 0.9 }),
          el('div', null, contourBtn, el('a', { class: 'fantome', href: '#/contact' }, ecrit('Écrire', { d: 1.2, u: 0.4 })))),
        el('div', { class: 'mono coord' }, ecrit('[e-mail] · [téléphone] · [@compte]', { d: 1.6, u: 0.8, bloc: true }))))
    );
  };

  return { ...e, activer() { construire(); e.activer(); } };
}
