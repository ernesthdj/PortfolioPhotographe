// Clavier et focus des fenêtres modales (photo agrandie, panneau de compte, fenêtres de l'atelier).
// Modèle : le panneau « Préciser ma journée » (js/pages/preciser.js). Usage :
//   const rendre = memoriserFocus();                      // à l'ouverture, AVANT de déplacer le focus
//   vie.ecouter(document, 'keydown', (e) => { if (ouverte()) clavierModale(e, racine, fermer); });
//   … à la fermeture : rendre();                          // le focus revient sur l'élément déclencheur

const FOCALISABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Retient l'élément qui a le focus et renvoie la fonction qui le lui rend (sans effet s'il a disparu ou est masqué). */
export function memoriserFocus() {
  const cible = document.activeElement;
  return () => {
    if (cible && cible !== document.body && cible.isConnected && !cible.hidden && typeof cible.focus === 'function') cible.focus({ preventScroll: true });
  };
}

/** Échap ferme ; Tab / Maj+Tab restent dans la fenêtre (piège de focus). `racine` : élément de la fenêtre. */
export function clavierModale(e, racine, fermer) {
  if (e.key === 'Escape') { e.preventDefault(); fermer(); return; }
  if (e.key !== 'Tab' || !racine) return;
  const liste = Array.from(racine.querySelectorAll(FOCALISABLES)).filter((n) => n.getClientRects().length > 0);
  if (!liste.length) return;
  const premier = liste[0], dernier = liste[liste.length - 1], actif = document.activeElement;
  if (!racine.contains(actif)) { e.preventDefault(); premier.focus({ preventScroll: true }); }
  else if (e.shiftKey && actif === premier) { e.preventDefault(); dernier.focus({ preventScroll: true }); }
  else if (!e.shiftKey && actif === dernier) { e.preventDefault(); premier.focus({ preventScroll: true }); }
}
