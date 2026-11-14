import { TVA } from '../../data/tarifs.js';

// Formats d'affichage. Les montants sont stockés en centimes dans data/.
/** Atelier : 1 031,28 € (espaces simples comme dans les planches). */
export const eurC = (c) => (c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
/** Site public : toLocaleString fr-BE sur un montant en euros. */
export const eurN = (n) => n.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
/** Total HTVA / TVA (TVA de data/tarifs.js) / TVAC à partir de lignes { ht } en centimes. */
export function totaux(lignes) {
  const ht = lignes.reduce((s, l) => s + l.ht, 0), tva = Math.round(ht * TVA);
  return { ht, tva, ttc: ht + tva };
}
