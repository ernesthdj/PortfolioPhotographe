// Photo agrandie (version PC), commune à toutes les pages : la boîte de la photo grandit depuis sa vignette, le cadre se trace,
// la légende et les boutons arrivent ; à la fermeture elle se repose dans sa vignette. Animation « standard » de l'app (celle de la galerie).
//
// Usage :
//   const pa = creerPhotoAgrandie({ hote, vie, fermer, aller: (d, total) => …, classeFond: 'lb-teinte' });
//   pa.rendre({ p, cap, i, total, st, rect, n, dx })   // à chaque rendu de la page
//   pa.vider()                                          // quand plus aucune photo n'est ouverte
//   pa.touche(e)                                        // depuis le keydown de la page (flèches + piège du focus)
// p = photo (data/photos-site.js) ; st = 'from' (à sa place dans la vignette) | 'to' (agrandie) | 'closing' (retour) ;
// rect = {x, y, w, h} de la vignette dans la scène ; n = nombre de photos déjà parcourues ; dx = gain de largeur de la fenêtre.
import { E } from './anim.js';
import { el, svg, animer, cheminSvg, cadrePhoto } from './dom.js';
import { clavierModale } from './modale.js';
import { TAILLES, habillePhoto } from '../../data/photos-site.js';

export function creerPhotoAgrandie({ hote, vie, fermer, aller, classeFond = 'lb-teinte' }) {
  let lbEls = null;

  function rendre({ p, cap, i, total, st, rect, n, dx }) {
    const w0 = Math.min(1180, 720 * p.r), h0 = w0 / p.r;
    const tx = Math.round(720 + dx / 2 - w0 / 2), ty = Math.round(440 - h0 / 2), tw = Math.round(w0), th = Math.round(h0);
    const big = st === 'to', Rc = big ? { x: tx, y: ty, w: tw, h: th } : (rect || { x: tx, y: ty, w: tw, h: th });
    const a2 = n % 2 === 1, box = (d, dl) => ['left', 'top', 'width', 'height'].map((k2) => `${k2} ${d}s ${E} ${dl}s`).join(', ');
    if (!lbEls) {
      const fond = el('div', { class: classeFond }), img = el('div', { class: 'lb-img ph', role: 'img' }, el('span'));
      const trP = cheminSvg(''), trS = svg('svg', { class: 'ln', 'aria-hidden': 'true' }, trP);
      const racine = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo en grand', style: 'position:absolute;inset:0' }, fond, img, trS);
      hote.append(racine);
      vie.ecouter(racine, 'click', (ev) => { if (ev.target === racine) fermer(); });   // un clic en dehors de la photo la referme aussi
      lbEls = { racine, fond, img, trP, trS, ui: null, total };
    }
    const L = lbEls;
    L.total = total;
    L.fond.classList.toggle('on', big);
    L.img.className = 'lb-img ph ton-' + p.ton; L.img.setAttribute('aria-label', p.altG); L.img.firstElementChild.textContent = p.label; habillePhoto(L.img, p, TAILLES.grand);
    L.img.style.transition = st === 'from' ? 'none' : (big ? box(.8, 0) : box(.7, 0));
    Object.assign(L.img.style, { left: Rc.x + 'px', top: Rc.y + 'px', width: Rc.w + 'px', height: Rc.h + 'px' });
    animer(L.img, big && n > 0 ? `${a2 ? 'dev2' : 'dev'} 2s ease-in-out .1s both` : 'none');
    Object.assign(L.trS.style, { left: (tx - 1) + 'px', top: (ty - 1) + 'px', width: (tw + 2) + 'px', height: (th + 2) + 'px' });
    L.trP.setAttribute('d', cadrePhoto(tw, th));
    animer(L.trP, big ? `${a2 ? 'trace2' : 'trace'} 1.8s ${E} ${n > 0 ? .05 : .7}s both` : 'none');
    if (big && !L.ui) {
      const mono = (style) => `position:absolute;top:846px;margin:0;font:500 12.5px 'IBM Plex Mono',monospace;letter-spacing:.04em;color:#4B4D52;animation:habille .5s ease .5s both;${style}`;
      const capP = el('p', { style: mono('left:120px') }), num = el('p', { style: mono('left:calc(640px + var(--dx) / 2);width:160px;text-align:center') });
      const bt = (label, style, d, fn) => el('button', { type: 'button', class: 'lb-btn', 'aria-label': label, style, on: { click: fn } }, svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, svg('path', { d })));
      const close = bt('Fermer', 'right:32px;top:16px', 'M6 6 L18 18 M18 6 L6 18', fermer);
      const prev = bt('Photo précédente', 'left:44px;top:416px', 'M15 5 L8 12 L15 19', () => aller(-1, L.total));
      const next = bt('Photo suivante', 'right:44px;top:416px', 'M9 5 L16 12 L9 19', () => aller(1, L.total));
      L.racine.append(capP, num, close, prev, next);
      L.ui = { cap: capP, num, nodes: [capP, num, close, prev, next] };
      close.focus({ preventScroll: true });
    }
    if (!big && L.ui) { L.ui.nodes.forEach((x) => x.remove()); L.ui = null; }
    if (L.ui) { L.ui.cap.textContent = cap; L.ui.num.textContent = (i + 1) + ' / ' + total; }
  }

  function vider() { if (lbEls) { lbEls.racine.remove(); lbEls = null; } }

  /** Flèches gauche / droite et piège du focus ; sans effet quand aucune photo n'est ouverte. */
  function touche(e) {
    if (!lbEls) return;
    const nodes = lbEls.ui && lbEls.ui.nodes;
    if (e.key === 'ArrowLeft') { if (nodes) nodes[3].click(); } else if (e.key === 'ArrowRight') { if (nodes) nodes[4].click(); }
    else clavierModale(e, lbEls.racine, fermer);
  }

  return { rendre, vider, touche };
}
