// Inclinaison 3D du dock : il pivote selon l'endroit où l'on appuie (le point touché s'enfonce),
// puis revient à plat par un ressort amorti. Désactivée si l'utilisateur demande moins de mouvement.
export function inclinaison(dock, vie) {
  const reduit = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const tl = dock.querySelector('.incl'), sp = dock.querySelector('.spec');
  const a = { x: 0, y: 0, s: 1, vx: 0, vy: 0, vs: 0, tx: 0, ty: 0, ts: 1 };
  let appui = false, raf = 0;

  const viser = (e) => {
    const r = dock.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const nx = Math.max(-1, Math.min(1, (px - 0.5) * 2)), ny = Math.max(-1, Math.min(1, (py - 0.5) * 2));
    // rotateY positif = côté droit qui s'éloigne ; rotateX positif = haut qui s'éloigne : on enfonce le point touché
    a.ty = nx * 7; a.tx = -ny * 9 * (r.height < 80 ? 1 : 0.8); a.ts = 0.985;
    sp.style.setProperty('--sx', (px * 100).toFixed(1) + '%');
    sp.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
    sp.style.opacity = '1';
  };
  const boucle = () => {
    cancelAnimationFrame(raf);
    let dernier = performance.now();
    const pas = (now) => {
      const dt = Math.min(0.032, (now - dernier) / 1000); dernier = now;
      const K = 190, C = 11;                       // raideur et amortissement du ressort
      const acc = (v, t, vv) => -K * (v - t) - C * vv;
      a.vx += acc(a.x, a.tx, a.vx) * dt; a.x += a.vx * dt;
      a.vy += acc(a.y, a.ty, a.vy) * dt; a.y += a.vy * dt;
      a.vs += acc(a.s, a.ts, a.vs) * dt; a.s += a.vs * dt;
      tl.style.transform = `rotateX(${a.x.toFixed(2)}deg) rotateY(${a.y.toFixed(2)}deg) scale(${a.s.toFixed(4)})`;
      const calme = Math.abs(a.x - a.tx) < 0.02 && Math.abs(a.y - a.ty) < 0.02 && Math.abs(a.vx) < 0.05 && Math.abs(a.vy) < 0.05 && Math.abs(a.s - a.ts) < 0.0005;
      if (calme && !appui) { tl.style.transform = ''; return; }
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
  };
  const lacher = () => {
    if (!appui) return;
    appui = false; a.tx = 0; a.ty = 0; a.ts = 1; sp.style.opacity = '0'; boucle();
  };
  vie.ecouter(dock, 'pointerdown', (e) => { if (reduit()) return; appui = true; viser(e); boucle(); });
  vie.ecouter(dock, 'pointermove', (e) => { if (appui) viser(e); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => vie.ecouter(dock, t, lacher));
  vie.aFaire(() => cancelAnimationFrame(raf));
}
