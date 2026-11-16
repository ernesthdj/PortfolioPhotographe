// Révélation au défilement : un bloc [data-rv] reçoit la classe `rv` (qui lance ses animations)
// quand il entre dans la fenêtre. Au premier affichage les blocs arrivent en cascade.
export function creerRevelateur(racine, defil) {
  let lot = true;
  const verifier = () => {
    const bas = defil.getBoundingClientRect().bottom;
    let k = 0;
    racine.querySelectorAll('[data-rv]:not(.rv)').forEach((n) => {
      if (n.getBoundingClientRect().top < bas - 36) {
        n.style.setProperty('--b', (lot ? k * 0.22 : 0.05).toFixed(2) + 's');
        n.classList.add('rv');
        k++;
      }
    });
    lot = false;
  };
  return {
    verifier,
    /** Premier affichage de l'écran : arrivée en cascade. */
    demarrer() { lot = true; setTimeout(verifier, 40); },
    /** Remet tous les blocs à zéro (écran quitté ou contenu refait). */
    reinitialiser() { racine.querySelectorAll('[data-rv]').forEach((n) => n.classList.remove('rv')); void racine.offsetWidth; }
  };
}
