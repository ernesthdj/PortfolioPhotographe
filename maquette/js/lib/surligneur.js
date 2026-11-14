// Surligneur morphique (port du canvas DA Morphic, PAccueil / Dashboard).
//
//   Au repos : rien n'est surligné, seule la comète tourne autour du cadre (pastille du menu, bandeau des services).
//   Survol   : la comète se fond en boule à l'endroit où elle se trouve, la boule glisse sous l'élément visé,
//              puis se redilate en ligne. La ligne se contracte PENDANT le trajet et se redilate avant d'arriver :
//              un seul geste, sans pause.
//   Sortie   : la ligne reste quelques secondes sous l'élément, puis redevient boule et rejoint la comète.
//
//   const surf = creerSurligneur(vie, span, {
//     geo: (i) => ({ x, w }) | null,   // position de l'élément i, dans le repère du conteneur du span
//     couleur: (i) => '#…',
//     cy: () => nombre,                // centre vertical de la ligne, dans le repère du conteneur
//     origine: () => ({ x, y }),       // position du conteneur du span dans le repère de la page (celui de la comète)
//     comete: () => <path>,            // trait de comète (pathLength = 100) dont on lit la position
//     onActif: (actif) => void,        // la comète s'efface quand le surligneur est actif
//     delaiSortie: 2500                // ms avant le retour à la comète
//   });
//   surf.aller(i | null);  // élément visé (null = retour au repos après le délai) ; idempotent
//   surf.peindre();        // à rappeler à chaque rendu (la géométrie peut avoir changé)
const RESSORT = 'cubic-bezier(.34,1.45,.64,1)';
const VOYAGE = 'cubic-bezier(.4,0,.2,1)';
const FORME = ['width', 'height', 'border-radius', 'box-shadow'];
const TOUT = ['left', 'width', 'height', 'top', 'border-radius', 'box-shadow'];
const dur = (props, t, f) => props.map((p) => `${p} ${t}s ${f}`).join(', ');
const TR = {
  spawn: 'opacity .06s linear',
  flow: `${dur(FORME, 0.2, 'cubic-bezier(.3,0,.2,1)')}, left .36s ${VOYAGE}, top .36s ${VOYAGE}, background-color .3s`,
  toLine: `${dur(TOUT, 0.26, RESSORT)}, background-color .3s`,
  back: `${dur(FORME, 0.2, 'cubic-bezier(.3,0,.2,1)')}, left .36s ${VOYAGE}, top .36s ${VOYAGE}, background-color .3s`,
  rest: 'opacity .18s linear',
  idle: 'background-color .6s ease'
};
const D = 12; // diamètre de la boule
const OMBRE_BOULE = '0 4px 5px rgba(13,14,16,.28), inset 0 -1px 2px rgba(13,14,16,.25)';
const OMBRE_LIGNE = '0 0 0 rgba(13,14,16,0), inset 0 0 0 rgba(13,14,16,0)';

export function creerSurligneur(vie, span, { geo, couleur, cy, origine, comete, onActif, delaiSortie = 2500 }) {
  let cur = null, but = null, etape = 'rest', occupe = false, tSortie = null;
  let P = { x: 0, y: 0 };            // position libre de la boule (point de la comète), repère du conteneur
  Object.assign(span.style, {
    position: 'absolute', opacity: '0',
    backgroundImage: 'radial-gradient(circle at 36% 30%, rgba(255,255,255,.34), rgba(255,255,255,0) 58%)'
  });

  // point de la comète à cet instant : décalage de pointillé lu sur le trait animé (pathLength = 100)
  function point() {
    const c = comete(), o = origine();
    try {
      const off = parseFloat(getComputedStyle(c).strokeDashoffset) || 0;
      const f = ((((-off + 2.5) % 100) + 100) % 100) / 100;
      const p = c.getPointAtLength(f * c.getTotalLength());
      return { x: p.x - o.x, y: p.y - o.y };
    } catch (e) { return { x: 0, y: cy() }; }
  }

  function peindre() {
    const s = span.style;
    const g = cur === null ? null : geo(cur);
    if (cur !== null && !g) { s.opacity = '0'; return; }
    const boule = etape !== 'toLine' && etape !== 'idle';
    const libre = etape === 'spawn' || etape === 'back' || etape === 'rest';
    const tg = g || { x: 0, w: 0 };
    const h = boule ? D : 2, w = boule ? D : tg.w;
    const cx = libre ? P.x : tg.x + tg.w / 2, cyy = libre ? P.y : cy();
    s.transition = TR[etape];
    s.left = (boule ? cx - D / 2 : tg.x) + 'px';
    s.top = (cyy - h / 2) + 'px';
    s.width = w + 'px';
    s.height = h + 'px';
    s.borderRadius = (h / 2) + 'px';
    s.backgroundColor = couleur(cur === null ? 0 : cur);
    s.boxShadow = boule ? OMBRE_BOULE : OMBRE_LIGNE;
    s.opacity = etape === 'rest' ? '0' : '1';
    if (onActif) onActif(etape !== 'rest');
  }

  function lancer() {
    if (cur === but) { occupe = false; return; }
    occupe = true;
    const fin = () => { occupe = false; if (cur !== but) lancer(); };
    const retour = () => {
      P = point(); etape = 'back'; peindre();
      vie.timeout(() => { cur = null; etape = 'rest'; peindre(); fin(); }, 360);
    };
    const aligne = () => {
      if (but === null) { retour(); return; }
      cur = but; etape = 'flow'; peindre();
      vie.timeout(() => {
        etape = 'toLine'; peindre();
        vie.timeout(() => { etape = 'idle'; peindre(); fin(); }, 260);
      }, 190);
    };
    if (cur === null) { P = point(); etape = 'spawn'; peindre(); vie.timeout(aligne, 40); } else aligne();
  }

  function aller(i) {
    if (i === null || i === undefined) {
      if (but === null || tSortie !== null) return;
      tSortie = vie.timeout(() => { tSortie = null; but = null; if (!occupe) lancer(); }, delaiSortie);
      return;
    }
    if (tSortie !== null) { vie.clearTimeout(tSortie); tSortie = null; }
    but = i;
    if (!occupe) lancer();
  }

  return { aller, peindre };
}
