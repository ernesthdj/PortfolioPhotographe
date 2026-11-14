# CORRECTIFS : maquette web statique (`maquette/`)

> Agent 3 « Correctifs » · 2026-11-14 · branche `design/da-morphic` · **rien n'est commité, poussé ni déployé** (à relire avant).
> Sources : `docs/audit/AUDIT-CODE.md` (CC-01 à CC-28) et `docs/audit/AUDIT-UX.md` (UX-01 à UX-21).

Méthode : un lot à la fois, avec après chaque lot `node --check` sur les fichiers JS touchés, un contrôle automatique des `import`/`export` (script jetable hors dépôt : 0 problème), ESLint (outil qui repère le code inutile) limité à `no-unused-vars` (variable jamais lue) : plus aucun avertissement hors faux positifs de variables globales. Les fins de ligne de chaque fichier existant ont été conservées (CRLF resté CRLF, LF resté LF) ; les 3 nouveaux fichiers JS/HTML sont en LF.

## 1. Constats du code (CC)

| N° | Statut | Fichiers | Ce qui a changé / vérification |
|---|---|---|---|
| CC-01 | **Corrigé** | `data/tarifs.js`, `js/lib/format.js`, `js/lib/brouillon.js`, `js/pages/simulateur.js`, `js/pages/preciser.js`, `js/pages/atelier-dossier-logique.js` | `DUREE_MIN` (2) / `DUREE_MAX` (14) / `kmAllerRetour()` ajoutés à `tarifs.js` ; libellés « 25 km offerts, 0,50 € / km » dérivés de `KM_OFFERTS`/`PRIX_KM` ; TVA de `format.js` = `TVA` ; copie de `totaux` supprimée de `atelier-dossier-logique.js` (ré-export conservé). Vérifié sous Node : libellés identiques, Mariage 2 h = 250 €, 8 h + album + Anvers = 816,10 € HTVA, 852,30 HTVA = 1 031,28 TVAC. |
| CC-02 | **Corrigé** | nouveau `js/lib/validation.js`, `simulateur.js`, `preciser.js`, `mes-dossiers.html` | À la création de compte, moins de 8 caractères = « Au moins 8 caractères. » (message à valider par vous) ; connexion : seule la présence est contrôlée. `autocomplete` du champ de suppression passé de `off` à `current-password` (ceux de création/connexion étaient déjà posés par `rendreSub`). Vérifié dans le navigateur (« abc » refusé). `maxlength` sur les champs de contact : non fait. |
| CC-03 | **Corrigé** | `js/lib/entete.js` | `filets` mémorisé dans `refs`, retiré dans `demonterEntete()`. Vérifié : intro passée puis « Rejouer », 1 seul en-tête, 0 erreur. Le décompte des écouteurs n'a pas été mesuré (`getEventListeners` indisponible). |
| CC-04 | **Non traité** | — | Extraction du panneau de compte (simulateur/preciser) jugée trop risquée pour ce passage ; seule la validation est désormais partagée (`validation.js`). `bande`/`hh` non extraits. |
| CC-05 | **Non traité** | — | Touche à l'en-tête figé entre pages (zone « ne pas casser »). |
| CC-06 | **Partiellement corrigé** | `validation.js`, `preciser.js`, `simulateur.js`, `atelier-clients-logique.js` | `EMAIL_RE` unique ; 3 `JSON.parse(JSON.stringify())` remplacés par `structuredClone`. Non fait : `hhmm`, `cheminSvg`, `cadrePhoto`, `setMot`. |
| CC-07 | **Non traité** | — | 8 fichiers pour un gain faible ; valeurs inchangées. |
| CC-08 | **Partiellement corrigé** | `routeur.js`, `surligneur.js` | Constante `E` morte supprimée (le reste = duplication des tables T/H, non traité). |
| CC-09 | **Corrigé** | `accueil.js`, `galerie.js`, `vagabond.js`, `entete.js`, `intro.js`, `atelier-catalogue-logique.js`, `atelier-dossier.js`, `atelier-planning.js`, `simulateur.js`, `dom.js`, `data/dossiers.js`, `atelier-catalogue2-logique.js` + `export` retiré sur `MP`, `PAGES`, `OMBRES`, `montrerFenetre`, `NUM_NOUVEAU`, `TRL`, `lireMontant`, `WDL`, `ALL`, `CLE_PUBLIC`, `CLE_PRECIS` | Variables/imports morts supprimés (liste de l'audit), exports inutilisés `$$`, `dossiersDe`, `servicesDuType` supprimés. Gardés volontairement : `rejoue`, `NB_COMMUNES_ADRESSE`, `DATE_JOUR_LONGUE`. |
| CC-10 | **Corrigé** | `css/base.css`, `css/pages/galerie.css`, `css/pages/contact.css` | 6 `@keyframes` jamais utilisés supprimés (`hlIn`, `rIn2`, `melt2`, `reform`, `haloIn`, `derive2`) + `habille2` ; `melt` de `base.css` supprimé (celui d'`intro.css` gagnait déjà) ; `retourC`/`retourNB` mis une seule fois dans `base.css`. |
| CC-11 | **Non traité** | — | Déplacement de blocs CSS entre pages atelier : nécessite diff octet par octet et mesures `getComputedStyle`, non fait. |
| CC-12 | **Corrigé** (dernier lot) | `maquette/reserve/` supprimé ; commentaires de `preciser.js`/`simulateur.js` et `README.md` mis à jour | Vérifié par Grep avant (seulement 2 commentaires + README) ; après : `/reserve/...` renvoie 404 localement. |
| CC-13, 14, 15, 27, 28 | **Non traité** | — | Gros découpages / palette / performance : risque élevé ou sans mesure (le plan les marque optionnels). |
| CC-16 | **Non traité** | — | Routeur : seul UX-03 a été traité. |
| CC-17 | **Corrigé** (en partie) | `js/amorce.js`, `js/lib/routeur.js` | Nom de module limité à `[a-z0-9-]+` (`nomModuleValide`), refus → navigation classique ; `amorce.js` affiche un message au lieu d'une page blanche puis relance l'erreur dans la console. Pas de liste blanche fermée. |
| CC-18 | **Corrigé** | nouveau `js/lib/modale.js` + voir UX-01 | |
| CC-19 | **Partiellement corrigé** | 25 `.html` (`role="main"` sur `#contenu`), menu atelier | Entrées mortes désactivées (voir UX-02). `<a href="#">` → `<button>` non fait ; `dossier.html:82` et `:94` (côté client) restent en `href="#"`. |
| CC-20, 21, 22, 25, 26 | **Non traité** | — | 25 (en-têtes de sécurité) demande votre accord (configuration de déploiement) ; 26 (tests) non écrits ; 20/21/22 hors périmètre de ce passage. |
| CC-23 | **Corrigé** | `README.md` | `preciser.html`, `404.html`, nouveaux modules, règles de prix, contrat de l'intro, déploiement. |
| CC-24 | **Corrigé** (sans renormalisation) | `.gitattributes`, `.editorconfig` | Ajoutés à la racine. Aucun fichier existant converti. `production.css` (EOL mixte) non touché. |

## 2. Constats UX

| N° | Statut | Détail |
|---|---|---|
| UX-01 | **Corrigé** | Nouveau `js/lib/modale.js` (`memoriserFocus`, `clavierModale` : Échap ferme, Tab reste dans la fenêtre, focus rendu au déclencheur). Branché sur : photo agrandie accueil et galerie (+ flèches ← →), panneau de compte du simulateur (le focus y entre désormais), fenêtres « Traiter / Retirer / Changer l'étape » (`atelier-dossier-logique.js`, donc dossier et demandes), panneau « Nouveau client », suppression de compte. Mesuré dans le navigateur : Échap ferme, `activeElement` dans la fenêtre à l'ouverture, retour sur le bouton d'origine, 0 erreur (accueil, galerie, simulateur, atelier/dossier, atelier/clients, mes-dossiers). Atelier/demandes non rejoué (même code que dossier). |
| UX-02 | **Corrigé** | Entrées sans page (Statistiques, Réductions, Parrainage, sous-menus), « Se déconnecter », « Gérer les origines… », « + Nouveau modèle », « Bloquer cette date », liens « Ouvrir/Télécharger » du dossier : `aria-disabled="true"`, `role="link"`, grisés, infobulle « Bientôt disponible », plus de `href="#"`. Accordéons : `aria-expanded` (vérifié : 3 entrées mortes, 4 accordéons `false`). Le clic sur une entrée morte ne la surligne plus. |
| UX-03 | **Corrigé** (à tester sur Vercel) | `routeur.js` : si l'URL courante n'a pas `.html` (cleanUrls actif), l'URL chargée et affichée est l'URL propre. En local (`python -m http.server`) rien ne change : vérifié, `/accueil.html` reste. Le mode propre n'a **pas** pu être testé (pas de Vercel). |
| UX-04 | **Non traité** | Hauteur de `#lz` liée à la mise en page validée du simulateur. |
| UX-05 | **Corrigé** | `preciser.html` : texte d'en-tête décalé de 80 px vers la gauche. Mesuré : marge droite ≈ 82 px à l'écran (avant : 15 px). |
| UX-06 | **Corrigé** | `title` (texte complet) sur la légende des vignettes de galerie, les évènements du planning, la note des versions du dossier. Les catégories des options avaient déjà un `title`. |
| UX-07 | **Corrigé** | `tarifs.js` : « 2 h incluses, 7 h 15 en plus, facturées 7 h 30 à 60 € / h » quand la demi-heure est entamée ; prix inchangés. |
| UX-08, 10, 12, 13, 15, 17, 18, 19, 20 | **Non traité** | Décisions de design ou de déploiement à prendre (plancher d'échelle, `Cache-Control` dans `vercel.json`, message de contact voulu « sans action » en maquette, transition de famille du routeur, filtre dans l'URL, textes provisoires, champs natifs, format des titres, menu masqué par la fenêtre « Traiter » voulu). |
| UX-09 | **Corrigé** | Nouveau `maquette/404.html` autonome (aux couleurs du site, lien vers `/accueil`). Servi par Vercel : non vérifié en production. |
| UX-11, 14, 16, 21 | **Non traité** (consigne) | « À confirmer » / hypothèse. |

## 3. Vérifications faites / non faites

**Faites** : `node --check` sur tous les JS modifiés ; contrôle d'imports/exports (0 problème) ; ESLint `no-unused-vars` ; calculs de prix sous Node ; navigateur (serveur local 127.0.0.1 uniquement, arrêté, onglet fermé) : accueil, galerie, simulateur, preciser, atelier/dossier, atelier/clients, mes-dossiers, intro + « Rejouer », 4 navigations par le routeur sur le site et 5 dans l'atelier, 0 erreur JavaScript relevée ; 404 local de `/reserve/...` ; recherche d'octets illisibles dans les fichiers modifiés (aucun).

**Non faites** : recettes de positions (`getBoundingClientRect` avant/après) sur toutes les pages et à plusieurs largeurs ; comparaison des animations avant/après (`getAnimations`) ; atelier/demandes, galerie → lightbox avec flèches, simulateur en mode connexion ; rendu réel du fondu et du surligneur (navigateur de test lent) ; URL propres sur Vercel ; `404.html` en production.

## 4. Risques de régression à regarder en priorité

1. **Focus et clavier des fenêtres** : l'écouteur Échap est sur `document` ; Échap dans un champ ferme désormais la fenêtre (comme `preciser.js`).
2. **Routeur en cleanUrls** (`routeur.js`, `propre()`) : à tester sur la prévisualisation Vercel (clic, Retour/Avancer, rechargement).
3. **Atelier** : entrées de menu désactivées sans `href`, bouton « + Nouveau modèle » grisé par une règle CSS de `atelier.css` (vérifier son aspect).
4. **`format.js` importe maintenant `data/tarifs.js`** (pas de cycle : `tarifs.js` n'importe rien).
5. `@keyframes` déplacés vers `base.css` (fondu de retour de la galerie et du contact).
6. `.gitattributes` (`eol=lf`) : au prochain `git add`, les fichiers CRLF seront normalisés sans bruit ; aucun fichier n'a été converti ici.
7. `docs/front/maquette-ecarts.md` (lignes 19 et 336) cite encore `reserve/` comme historique : laissé tel quel.

## 5. Fichiers

**Créés** : `.gitattributes`, `.editorconfig`, `maquette/404.html`, `maquette/js/lib/modale.js`, `maquette/js/lib/validation.js`, `docs/audit/CORRECTIFS.md`.

**Supprimés** : `maquette/reserve/` (3 fichiers : `precision-journee/simulateur-panneau.js`, `.html` et le 3e du dossier).

**Modifiés** : `maquette/README.md` ; `maquette/css/` : `atelier.css`, `base.css`, `pages/contact.css`, `pages/galerie.css` ; `maquette/data/` : `dossiers.js`, `tarifs.js` ; `maquette/js/amorce.js` ; `maquette/js/lib/` : `atelier-shell.js`, `brouillon.js`, `dom.js`, `entete.js`, `format.js`, `params.js`, `routeur.js`, `scene.js`, `surligneur.js`, `vagabond.js` ; `maquette/js/pages/` : `accueil.js`, `atelier-catalogue-logique.js`, `atelier-catalogue2-logique.js`, `atelier-clients-logique.js`, `atelier-clients.js`, `atelier-dossier-logique.js`, `atelier-dossier.js`, `atelier-planning-production-logique.js`, `atelier-planning.js`, `galerie.js`, `intro.js`, `mes-dossiers.js`, `preciser.js`, `simulateur.js` ; HTML (`role="main"` sur `#contenu`, 25 fichiers) : `accueil`, `apropos`, `contact`, `dossier`, `galerie`, `mes-dossiers`, `preciser`, `services`, `simulateur` et `atelier/` : `categories`, `client`, `clients`, `demandes`, `dossier`, `dossiers`, `fiche`, `fiches`, `modeles`, `option`, `options`, `planning`, `production`, `service`, `services`, `tableau-de-bord` ; en plus `mes-dossiers.html` (autocomplete), `preciser.html` (en-tête), `atelier/client.html`, `atelier/modeles.html`, `atelier/planning.html` (liens désactivés).

Non touchés : `src/`, `docs/front/canvas-da-morphic/`, `.agents/`, `.claude/`, `skills-lock.json`, `vercel.json`.
