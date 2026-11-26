// Services : un service à la fois (sous-navigation du dock), prix lus dans data/tarifs.js (référence unique).
import { creerEcran } from '../lib/ecran.js';
import { eyebrow, titre, texte, ecrit, filet, bouton, lienFleche, photo, contour, rv } from '../lib/ecriture.js';
import { el } from '../../../js/lib/dom.js';
import { PHOTOS } from '../photos.js';
import { SERVICES, TVA, KM_OFFERTS, PRIX_KM } from '../../../data/tarifs.js';

export const titreDoc = 'Services · Ernest H.';

// textes d'accroche et placement des photos (emplacements en attendant les vrais clichés)
const FICHES = {
  mariages: { id: 'mar', court: 'Mariages', t1: 'Votre mariage,', t2: 'raconté.', d: 'Un regard discret, de la préparation à la dernière photo de la soirée.', ton: 1, alt: 'Les mariés devant le château' },
  engagement: { id: 'eng', court: 'Engagement', t1: 'Avant le grand jour,', t2: 'à deux.', d: 'Une séance en lumière naturelle, pour se voir tels que l’on est.', ton: 6, alt: 'Couple debout dans un grand champ' },
  famille: { id: 'fam', court: 'Famille', t1: 'Votre famille,', t2: 'telle quelle.', d: 'Des portraits sans pose forcée, au rythme des enfants.', ton: 2, nb: true, alt: 'Couple enlacé dans un champ' },
  anniversaires: { id: 'ann', court: 'Anniversaires', t1: 'Vos fêtes,', t2: 'sans rien rater.', d: 'De l’arrivée des invités au gâteau et aux souvenirs.', ton: 4, nb: true, alt: 'Les mariés enlacés, bouquet au premier plan' },
  evenementiel: { id: 'evt', court: 'Événementiel', t1: 'Vos événements,', t2: 'en reportage.', d: 'Ambiance, gestes et détails rassemblés dans un même récit.', ton: 5, alt: 'Baiser sur la joue' },
  culinaire: { id: 'cul', court: 'Culinaire', t1: 'Vos créations,', t2: 'mises en lumière.', d: 'Un studio ou votre cuisine, pour des images qui donnent faim.', ton: 3, nb: true, alt: 'Détail d’une création culinaire' }
};
const ORDRE = Object.keys(FICHES);
const eur = (n) => `${String(n).replace('.', ',')} €`;
const trajet = `${KM_OFFERTS} km offerts, ${PRIX_KM.toFixed(2).replace('.', ',')} € / km`;

/** Lignes de tarif d'un service, lues dans la référence unique des prix. */
function tarifs(s) {
  if (s.mode === 'P4') return [['Prix par plat', eur(s.unit)], ['Quantité', `de ${s.min} à ${s.max} plats`], ['Trajet', trajet]];
  return [['Forfait de base', eur(s.base)], ['Durée incluse', `${s.incl} h minimum`], ['Heure supplémentaire', `${eur(s.extra)} / h`], ['Trajet', trajet]];
}

export function creer(ctx) {
  const e = creerEcran(ctx);
  let cle = ORDRE[0];

  const construire = () => {
    const f = FICHES[cle], s = SERVICES.find((x) => x.id === f.id), n = ORDRE.indexOf(cle) + 1;
    const lignes = tarifs(s);
    const depuis = s.mode === 'P4' ? eur(s.unit * s.min) : eur(s.base);
    const sub = s.mode === 'P4' ? `${s.min} plats minimum · déplacement en plus` : `${s.incl} h incluses · déplacement en plus`;

    e.page.replaceChildren(
      eyebrow(`Services · 0${n} / 0${ORDRE.length}`),
      rv(el('div', { class: 'photo-bloc' }, photo({ ton: f.ton, nb: f.nb, libelle: 'Photo · ' + s.t, alt: f.alt, src: PHOTOS[80 + n].src, d: 0.2 }))),
      titre(f.t1, f.t2),
      texte(f.d, { d: 0.1 }),
      rv(el('div', { class: 'tarifs' },
        ...lignes.map(([l, v], i) => el('div', null, filet(0.1 + i * 0.12),
          el('div', { class: 'tarif' }, el('span', { class: 'tarif-l' }, ecrit(l, { d: 0.25 + i * 0.12, u: 0.5 })), el('span', { class: 'mono ink tarif-v' }, ecrit(v, { d: 0.4 + i * 0.12, u: 0.5 }))))),
        filet(0.7),
        el('div', { class: 'mono note' }, ecrit(`Prix HTVA · TVA ${Math.round(TVA * 100)} % en plus`, { d: 0.8, u: 0.7 })))),
      rv(el('div', { class: 'exemple' },
        el('div', { class: 'carte-verre verre' }), contour(24, 0.1),
        el('div', { class: 'exemple-c' },
          el('div', { class: 'mono' }, ecrit('À partir de', { d: 0.8, u: 0.6 })),
          el('div', { class: 'exemple-p' }, ecrit(depuis, { d: 1, u: 0.7 })),
          el('div', { class: 'mono petit' }, ecrit(sub, { d: 1.3, u: 0.6, bloc: true }))))),
      rv(el('div', { class: 'actions' },
        bouton('Simuler ma journée', { href: '#/simulateur' }),
        el('div', { class: 'centre' }, lienFleche('Voir la galerie', { href: '#/galerie', aria: 'Voir la galerie du service' }))))
    );
  };

  return {
    ...e,
    activer(arg) { cle = FICHES[arg] ? arg : ORDRE[0]; construire(); e.activer(); },
    /** Autre service : le contenu se décompose, puis se réécrit. */
    changer(arg) { const k = FICHES[arg] ? arg : ORDRE[0]; if (k === cle) return; cle = k; e.refaire(construire); },
    sousNav() { return { cle: 'services', liste: ORDRE.map((k) => [k, FICHES[k].court]), courant: cle, choisir: (k) => ctx.aller('services', k) }; }
  };
}
