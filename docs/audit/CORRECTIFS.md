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

---

# Deuxième passe (2026-11-14)

Hors périmètre de cette passe (faits par ailleurs) : CC-25 (en-têtes de sécurité, déjà dans `vercel.json`) et UX-10 (cache `must-revalidate` conservé volontairement).
Aucun commit, push ni déploiement. Fins de ligne conservées.

**Méthode de mesure** : deux serveurs locaux 127.0.0.1 (arrêtés à la fin), un sur la copie du dernier commit (« avant »), un sur l'arbre de travail (« après »). Pages chargées dans des iframes de 1440 × 900 (et 1900 × 900 pour les pages à répartition `--dx`), 12 à 16 s d'attente, puis comparaison automatique de : positions `getBoundingClientRect` (arrondies au demi-pixel) de h1, boutons, liens, photos, verres, icônes, champs, lignes, notes, `#lz`, styles calculés d'échantillons (`.ico`, `.err`, `.flux`, `.champ select`, `a.btn.encre`, `.it`, `.btn`), attributs `d` de tous les tracés SVG, texte visible, nombre et noms d'animations (`document.getAnimations()`). Seule différence tolérée : le trait vagabond (position aléatoire par conception).

| N° | Statut | Fichiers | Preuve |
|---|---|---|---|
| CC-11 | **Corrigé** | `css/atelier.css` (bloc commun), retraits dans `css/pages/atelier-catalogue.css`, `atelier-catalogue2.css`, `atelier-clients.css`, `planning.css`, `production.css` | Les 11 règles (`.err`, `.err i`, `.flux`, `.ico*`, `.champ select*`, `a.btn.encre`) comparées ligne à ligne : identiques dans les 3 CSS catalogue/clients, sous-ensembles dans planning et production. 9 pages atelier (options, clients, planning, production, categories, client, fiche, modeles, service) : positions, styles calculés, nombre d'animations (77 à 108) **identiques avant/après**. Les pages dossier, dossiers, demandes, tableau de bord n'utilisent pas ces classes. |
| CC-06 | **Corrigé** | `js/lib/dom.js` (`cheminSvg`, `cadrePhoto`, `setMot`), `js/lib/format.js` (`hhmm`), `accueil.js`, `galerie.js`, `simulateur.js`, `preciser.js`, `atelier-planning-production-logique.js` | Les 3 `hh`/`hhmm` étaient identiques ; `SVG_PATH`/`P` identiques ; cadre de photo identique (2 copies dans l'accueil, 1 dans la galerie) ; `setMot` de l'accueil = sous-ensemble de celui de la galerie (clés de cache sur des éléments différents, pas de collision). `intro.js` (tracé décalé, autre formule) laissé. Mesure accueil, galerie, simulateur, preciser : identiques, seul le trait vagabond varie. |
| CC-19 | **Corrigé** | `dossier.html`, `js/lib/atelier-shell.js` | Plus aucun `href="#"` dans la maquette. « Compléter la fiche » et « Ouvrir le PDF » : `<button type="button" aria-disabled="true" title="Bientôt disponible">` ; accordéons du menu atelier (Argent, Catalogue, Vitrine, Réglages) : vrais `<button>`. Styles calculés et rectangles des deux boutons de `dossier.html` identiques ; les 13 entrées `.it` du menu : mêmes rectangles, couleurs, polices (seul le soulignement calculé de `<a>` disparaît, sans effet visible : capture avant/après identique). Clic sur Catalogue : `aria-expanded` passe à `true`, 5 sous-entrées, navigation vers Services par le routeur OK. |
| `maxlength` | **Corrigé** | 32 champs de 17 `.html` + `atelier-categories.js`, `atelier-catalogue-logique.js`, `atelier-dossier-logique.js`, `atelier-modeles.js` | Contact : nom 100, e-mail 254, message 2 000 ; mots de passe 128 ; e-mails 254 ; noms et libellés 80 à 120 ; notes 500 à 1 000 ; décimaux 6 à 12 ; jours 3 ; lien 2 048. L'adresse exacte (200) et le code promo (40) l'avaient déjà. Aucune règle de validation existante n'a de plafond plus bas. La validation côté serveur reste à écrire dans PID. |
| UX-04 | **Corrigé** (cas de l'audit) | `js/pages/simulateur.js` | La liste du devis garde sa hauteur d'origine tant que le contenu tient. Si elle déborde : elle descend jusqu'à y = 686 avec la suggestion d'album affichée (y = 690), ou jusqu'à y = 820 dans le vide du panneau sans suggestion. Cas de l'audit (Mariage + zone Namur + album) : avant `clientHeight` 270 / `scrollHeight` 322 (ligne coupée), après 322 / 322 (plus de défilement, dernière ligne à y = 711 pour un bas à 732). Sans album + zone Namur : dernière ligne à 681 pour un bas à 686. Cas par défaut : 270 / 270, dernière ligne à 627, **identique**. |
| UX-15 | **Corrigé** | `js/pages/galerie.js`, `README.md` | `?service=Engagement` (liste blanche `SVC` via `params.js`, insensible aux accents et à la casse) ouvre la galerie filtrée ; un clic sur un filtre met l'adresse à jour par `replaceState` (pas d'entrée d'historique : Retour ne défait pas le filtre). Mesuré : `?service=engagement` donne le titre « Engagement » et le bon bouton pressé ; clic Mariages donne `?service=Mariages` ; clic Tout, adresse sans paramètre. |
| UX-19 | **Corrigé** | `apropos.html`, `contact.html`, `services.html` | Titres au format « Page · Ernest H. » comme les autres pages publiques. |
| CC-07 | **Corrigé** | `js/lib/scene.js` (`mesures.gx`), `entete.js`, `vagabond.js`, `accueil.js`, `apropos.js`, `contact.js`, `galerie.js`, `services.js`, `atelier-planning.js` | Les 8 lectures de `window.__scene` passent par `mesures` (le plafond 260 d'`apropos`/`services` devient `mesures.gx`, même valeur). Piège évité : dans `accueil.js` un nom `mesures` existait déjà (mesure de texte), l'import est aliasé `scene` (détecté par ESLint avant tout test). Mesure à **1900 × 900** (`dx` = 460, `gx` = 260) sur accueil, apropos, services, contact, galerie, planning, simulateur, preciser : identique (hors trait vagabond) ; de même à 1440 sur apropos, mes-dossiers, tableau de bord, demandes, dossiers. `window.__scene` reste exposé pour les tests manuels. |
| CC-04 | **Non traité** | — | Le panneau de compte de `simulateur.js` et `preciser.js` mélange état partagé `st`, minuteries et textes finaux différents ; l'extraction ne peut pas être prouvée par une mesure « au repos » : il faudrait rejouer tout le parcours (formulaire, chargement, fin, fermeture, focus) dans les deux pages avec comparaison des animations d'état. À faire avec un parcours automatisé. Seules les parties identiques ont été extraites (`hhmm`, validation). |
| CC-05 | **Non traité** (consigne) | — | Touche à l'en-tête figé entre pages. |
| UX-08 | **Décision laissée à l'utilisateur** | — | Texte ≈ 7,8 px à 800 px de large : la mise à l'échelle proportionnelle est le choix de design validé (scène 1440 × 900). Recommandation : un plancher d'échelle (0,7) avec défilement horizontal, ou une vraie mise en page étroite à la reprise dans PID. |
| UX-12 | **Décision laissée à l'utilisateur** | — | « Envoyer » sans action est voulu en maquette (commentaire de `contact.js`). Recommandation : une ligne de confirmation factice sous le bouton, à valider côté design (zone à réserver dans la carte). |
| UX-13 | **Décision laissée à l'utilisateur** | — | Le flash blanc intro vers site et site vers atelier vient du choix de recharger entre familles (coque différente). Recommandation : étendre le fondu blanc à ces passages seulement si la coque de l'atelier peut être préchargée ; non fait pour ne pas toucher au routeur validé. |
| UX-17 | **Non traité** | — | Les textes provisoires sont déjà entre crochets (`[LIEU]`, `[prix] €`) : c'est le marquage voulu. Rien de codable sans les vrais contenus. |
| UX-18 | **Décision laissée à l'utilisateur** | — | Champs date et heure natifs : choix de simplicité pour la maquette ; recommandation : composants maison à la reprise PID. Étiquettes du ruban qui débordent de 13 px : cosmétique, à corriger avec une mesure du ruban dans une passe design (pièce validée). |
| UX-20 | **Décision laissée à l'utilisateur** | — | Le menu qui disparaît sous la fenêtre « Traiter » est voulu (fond résorbé, commentaire de `atelier-dossiers.js`). |
| UX-11, 14, 16, 21 ; CC-13, 14, 15, 27, 28 | **Ignorés** (consigne) | — | |

## Vérifications de la deuxième passe

**Faites** : `node --check` après chaque lot ; contrôle d'imports/exports (0 problème) ; ESLint `no-unused-vars` (a révélé l'ombrage de `mesures` dans l'accueil) ; mesures avant/après listées ci-dessus ; essais fonctionnels dans le navigateur : photo agrandie de l'accueil (ouverture, Échap, retour du focus), galerie avec `?service=`, accordéon du menu atelier ; 0 erreur JavaScript.

**Non faites** : parcours complet du panneau de compte après les changements (seul l'import de `hh` y a changé) ; atelier/demandes et pages atelier hors liste de mesure ; rendu réel du fondu (navigateur de test lent) ; `#lz` avec 2 prestations ou plus.

## Risques à regarder en priorité (deuxième passe)

1. `setMot` partagé (accueil et galerie) : textes du héros et légende de la photo agrandie.
2. Boutons d'accordéon du menu atelier au clavier (Entrée, Espace) : à tester à la main.
3. Hauteur variable de `#lz` du simulateur avec plusieurs prestations.
4. `maxlength` : un texte déjà plus long n'est pas tronqué, seule la saisie est bornée.

## Fichiers de la deuxième passe

**Modifiés** : `maquette/README.md` ; `maquette/css/atelier.css` ; `maquette/css/pages/` : `atelier-catalogue.css`, `atelier-catalogue2.css`, `atelier-clients.css`, `planning.css`, `production.css` ; `maquette/js/lib/` : `atelier-shell.js`, `dom.js`, `entete.js`, `format.js`, `scene.js`, `vagabond.js` ; `maquette/js/pages/` : `accueil.js`, `apropos.js`, `atelier-catalogue-logique.js`, `atelier-categories.js`, `atelier-dossier-logique.js`, `atelier-modeles.js`, `atelier-planning-production-logique.js`, `atelier-planning.js`, `contact.js`, `galerie.js`, `preciser.js`, `services.js`, `simulateur.js` ; HTML : `apropos`, `contact`, `dossier`, `mes-dossiers`, `preciser`, `services`, `simulateur` et `atelier/` : `categories`, `client`, `clients`, `dossier`, `dossiers`, `fiche`, `modeles`, `option`, `production`, `service`.
**Créés / supprimés** : aucun.
