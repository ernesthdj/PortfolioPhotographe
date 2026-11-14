// Scène : hauteur logique 900, largeur logique W variable, mise à l'échelle sur la HAUTEUR.
//
//   échelle k = hauteur de fenêtre / 900 ; W = largeur de fenêtre / k ;
//   si W < 1440 on revient à la réduction « tenir en largeur » (k = largeur / 1440, W = 1440).
//   À exactement 1440 x 900 la page est identique à la planche du canvas (W = 1440, dx = 0).
//
// Variables CSS posées sur #scene (en px logiques, utilisables dans calc()) :
//   --W   largeur logique          --dx  W - 1440 (place gagnée par rapport à la planche)
//   --gx  min(dx, 260px) : croissance du bloc central du site public (au-delà de ~1700 logique on centre)
//   --sx  (dx - gx) / 2   : décalage du bloc central pour garder les marges égales
// Classes utilitaires (base.css) : .ad (ancré à droite : +dx), .ac (centré dans la zone : +dx/2), .as (bloc central du site : +sx).
// Un événement « scene:resize » est émis sur window quand W change (pages à mise en page calculée en JS).
const L = 1440, H = 900, CAP_SITE = 1700;

let sceneMontee = false;
export const mesures = { W: L, k: 1, dx: 0, gx: 0 };   // gx : part de dx dont profite le bloc central du site (plafonnée)
window.__scene = mesures;

export function monterScene() {
  if (sceneMontee) return () => {};
  sceneMontee = true;
  const scene = document.getElementById('scene');
  montrerFenetre();
  const ajuster = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    let k = vh / H, W = vw / k;
    if (W < L) { k = vw / L; W = L; }
    W = Math.round(W * 100) / 100;
    const dx = W - L, gx = Math.min(dx, CAP_SITE - L);
    const change = W !== mesures.W;
    Object.assign(mesures, { W, k, dx, gx });
    const st = scene.style;
    st.setProperty('--W', W + 'px'); st.setProperty('--dx', dx + 'px');
    st.setProperty('--gx', gx + 'px'); st.setProperty('--sx', (dx - gx) / 2 + 'px');
    st.width = W + 'px';
    st.transform = `translate(-50%, -50%) scale(${k})`;
    if (change) window.dispatchEvent(new CustomEvent('scene:resize', { detail: { W, k, dx } }));
  };
  ajuster();
  window.addEventListener('resize', ajuster);
  // Aucun formulaire de la maquette n'envoie de données (Entrée comprise).
  document.addEventListener('submit', (e) => e.preventDefault(), true);
  return ajuster;
}

/**
 * Calque de fond PLEIN FENÊTRE (persistant) : fond blanc, vignette et ombres mouvantes couvrent toute la fenêtre,
 * derrière la scène : aucune coupure visible quelle que soit la proportion de la fenêtre.
 * Les <div class="vignette"> écrits dans le HTML des pages sont retirés au profit de ce calque.
 */
function montrerFenetre() {
  let f = document.getElementById('fenetre');
  if (!f) {
    f = document.createElement('div');
    f.id = 'fenetre';
    f.setAttribute('aria-hidden', 'true');
    const v = document.createElement('div');
    v.className = 'vignette';
    f.append(v);
    document.getElementById('ecran').prepend(f);
  }
  document.querySelectorAll('#scene .vignette').forEach((n) => n.remove());
  return f;
}

/** Valeurs CSS de position selon l'ancrage : 'g' gauche (inchangé), 'd' droite (+dx), 'c' centre de zone (+dx/2), 's' bloc central du site (+sx). */
export function pos(px, ancre = 'g') {
  const v = { g: '', d: ' + var(--dx)', c: ' + var(--dx) / 2', s: ' + var(--sx)' }[ancre];
  return v ? `calc(${px}px${v})` : `${px}px`;
}
/** Largeur qui s'étire : part = 1 prend tout le gain dx, 0,5 la moitié ; 'g' = croissance plafonnée du bloc central du site. */
export function larg(px, part = 1) {
  return part === 'g' ? `calc(${px}px + var(--gx))` : `calc(${px}px + var(--dx) * ${part})`;
}

/** Position à fraction du gain de largeur : f = 0 gauche, 1 droite, 0,5 centre, 0,33 etc. pour répartir des colonnes. */
export function posf(px, f) {
  return f === 0 ? `${px}px` : `calc(${px}px + var(--dx) * ${f})`;
}
