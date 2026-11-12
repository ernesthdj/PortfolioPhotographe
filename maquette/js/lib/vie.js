// Cycle de vie d'une page (routeur AJAX) : regroupe minuteries, intervalles, écouteurs et nœuds
// ajoutés hors de #contenu, pour tout défaire d'un coup dans destroy().
//
//   let vie;
//   export function init(racine) { vie = creerVie(); vie.timeout(fn, 500); vie.ecouter(window, 'resize', fn); … }
//   export function destroy() { vie.nettoyer(); }
export function creerVie() {
  const timeouts = new Set(), intervals = new Set(), ecouteurs = [], noeuds = [], taches = [];
  return {
    timeout(fn, ms) { const id = setTimeout(() => { timeouts.delete(id); fn(); }, ms); timeouts.add(id); return id; },
    clearTimeout(id) { clearTimeout(id); timeouts.delete(id); },
    interval(fn, ms) { const id = setInterval(fn, ms); intervals.add(id); return id; },
    clearInterval(id) { clearInterval(id); intervals.delete(id); },
    ecouter(cible, type, fn, opts) { cible.addEventListener(type, fn, opts); ecouteurs.push([cible, type, fn, opts]); },
    /** Nœud ajouté hors de #contenu (ex. sous l'en-tête) : retiré au nettoyage. */
    noeud(n) { noeuds.push(n); return n; },
    /** Fonction libre à exécuter au nettoyage. */
    aFaire(fn) { taches.push(fn); },
    nettoyer() {
      timeouts.forEach(clearTimeout); timeouts.clear();
      intervals.forEach(clearInterval); intervals.clear();
      ecouteurs.splice(0).forEach(([c, t, f, o]) => c.removeEventListener(t, f, o));
      noeuds.splice(0).forEach((n) => n.remove());
      taches.splice(0).forEach((f) => f());
    }
  };
}
