// Rythme d'animation d'une page : K règle la vitesse globale (site public 0,62 ; atelier 0,45).
export const E = 'cubic-bezier(.45,0,.2,1)';
const r = (n) => Number(n.toFixed(3));
const d2 = (n) => n.toFixed(2);

export function rythme(K) {
  return {
    K, E,
    // T : texte qui s'écrit (contour .o puis remplissage .f, 0,25 plus tard)
    T: (dl, d) => ({ o: `wIn ${r(d * K)}s ${E} ${d2(dl * K)}s both`, f: `wIn ${r(d * K)}s ${E} ${d2((dl + .25) * K)}s both` }),
    // H : habillage (apparition lente de la matière)
    H: (dl) => `habille 1s ease ${d2(dl * K)}s both`,
    // DR : trait qui se dessine
    DR: (dl, d) => `drawS ${r(d * K)}s ${E} ${d2(dl * K)}s both`,
    // DV : photo qui se développe (gris -> couleur)
    DV: (dl) => `dev 2.4s ease ${d2(dl * K)}s both`,
    // écriture d'un élément simple (soulignement, filet) sans remplissage décalé
    W: (dl, d) => `wIn ${r(d * K)}s ${E} ${d2(dl * K)}s both`
  };
}
