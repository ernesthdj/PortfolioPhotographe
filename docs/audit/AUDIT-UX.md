# AUDIT UX — Maquette PortfolioPhotographe (agent QA utilisateur)

## 1. En-tête

| Élément | Valeur |
|---|---|
| Date | 2026-11-14 |
| URL auditée | https://portfolio-maquette.vercel.app (production Vercel) |
| Version | Le fichier `/js/lib/routeur.js` en ligne contient `prechargerStyles` : le déploiement contient donc le code récent. Commit supposé : `afb556e` (HEAD de `design/da-morphic`) — hypothèse, non vérifiée par l'API Vercel. |
| Navigateur | Chrome piloté par l'extension claude-in-chrome. Fenêtre maximisée ; viewport mesuré 1920×911 (puis 1920×855 après un changement de barre) |
| Authentification Vercel | Aucune page de connexion rencontrée, le site s'est ouvert directement. |
| Tailles testées | 1920×911 / 1920×855 (réel) ; 1440×900, 1280×720, 1024×768, 800×700, 600×900, 1920×1080 via une iframe de même origine (voir limites) |
| Pages parcourues | Public : `/` (intro), accueil, galerie, services, apropos, contact, simulateur, preciser, mes-dossiers, dossier. Atelier : tableau-de-bord, planning, dossiers, dossier, demandes, clients, client, production, services, service, options, option, categories, fiches, fiche, modeles (les 16). Plus un 404. |

### Limites de l'audit (à lire avant d'exploiter le document)

1. **Rendu très lent dans cet environnement.** `requestAnimationFrame` mesuré à 1,5 images/s sur le site et 6,5 images/s sur une simple page texte (`routeur.js`). Les animations WAAPI ne progressent pas de façon fluide : `getComputedStyle(#contenu).opacity` est resté à 1 pendant tout le fondu de 320 ms. **Je n'ai donc PAS pu valider visuellement** : le fondu sortant (0,32 s), le morphing d'entrée, la comète / la boule du surligneur, ni les sauts ou clignotements d'une fraction de seconde. Ces points restent à vérifier sur une machine normale. Plusieurs captures prises « trop tôt » montraient du texte tronqué qui était en réalité en cours d'écriture (ex. « TRAJETS ET DURÉE COMI » devenu « COMPRIS » après attente) : j'ai écarté ces faux positifs et n'ai retenu que des états stables (attente de 4 à 6 s, puis mesure).
2. **`resize_window` n'a aucun effet sur le viewport** (il répond « succès » mais `innerWidth` reste à 1920). Les tailles ont été simulées avec une iframe de même origine : les mesures de mise à l'échelle sont fiables, mais pas le rendu pixel exact ni la barre de défilement du navigateur.
3. **Console** : seuls des messages d'extensions du navigateur (`No Listener: tabs:outgoing.message.ready`, `Clover: Disconnected from chain`). **Aucune erreur JavaScript du site**, aucun avertissement du site, aucune erreur non gérée (`error` / `unhandledrejection` écoutés pendant la navigation rapide).
4. **Réseau** : aucun 404 ni 5xx sur les pages du site (251 requêtes filtrées sur le domaine). Polices Instrument Serif, Inter, IBM Plex Mono chargées (Google Fonts, 200).
5. Deux gels du moteur de rendu ont été observés (voir UX-14) ; je ne peux pas dire si l'environnement lent en est la seule cause.
6. Non testé : survol de la comète/boule du surligneur image par image, zoom photo « traits qui s'effacent » (voile blanc), trait vagabond en mouvement (une seule position stable observée), glisser des poignées du ruban d'horaires, suppression de compte (`mes-dossiers`), soumission « Soumettre au photographe », sous-menus « Vitrine » et « Réglages » de l'atelier.
7. Aucun formulaire n'envoie de données (maquette). Valeurs saisies : fictives (`Test Exemple`, `test@example.invalid`, `12 rue Exemple, 5000 Namur`).

## 2. Tableau de synthèse

| N° | Page(s) | Gravité | Titre court |
|---|---|---|---|
| UX-01 | accueil, galerie, simulateur, atelier/demandes | Majeur | Fenêtres modales et lightbox : Échap sans effet, focus non géré |
| UX-02 | atelier (menu latéral) | Majeur | Entrées de menu mortes (`href="#"`) sans retour visuel |
| UX-03 | toutes (site, atelier) | Mineur | URL différente après clic (`/x.html`) et après chargement direct (`/x`) |
| UX-04 | simulateur | Mineur | Zone « devis » à défilement interne : ligne coupée + grand vide |
| UX-05 | preciser | Mineur | Texte d'en-tête de droite qui dépasse la marge de la page |
| UX-06 | galerie, atelier/options, planning, atelier/dossier | Mineur | Textes tronqués avec ellipse |
| UX-07 | dossier, atelier/dossier | Mineur | Durée incohérente : « 9 h 15 » vs « 2 h + 7 h 30 » |
| UX-08 | toutes | Mineur | Largeurs étroites : scène réduite, texte illisible |
| UX-09 | URL inexistante | Mineur | Page 404 générique de Vercel |
| UX-10 | toutes | Mineur | Aucun cache long : 13 revalidations (304) par page, + redirection à chaque navigation routeur |
| UX-11 | accueil | Mineur | Colonne de texte du hero vide pendant de longs moments (à confirmer) |
| UX-12 | contact | Mineur | « Envoyer » : aucune validation ni retour |
| UX-13 | intro → site, site ↔ atelier | Mineur | Changement de famille = rechargement complet avec flash blanc |
| UX-14 | accueil (zoom photo), atelier | Mineur | Gels du moteur de rendu (délais 30 s et 45 s) |
| UX-15 | galerie | Mineur | Filtre non reflété dans l'URL, Retour ne l'annule pas |
| UX-16 | accueil, galerie (zoom) | Cosmétique | Tête du trait vagabond : point noir plein et opaque, isolé |
| UX-17 | plusieurs | Cosmétique | Textes provisoires entre crochets visibles |
| UX-18 | simulateur, preciser | Cosmétique | Champs date/heure natifs ; étiquettes du ruban qui débordent et se doublent |
| UX-19 | toutes | Cosmétique | Titres d'onglet de formats différents |
| UX-20 | atelier/demandes | Cosmétique | La fenêtre « Traiter » fait disparaître le menu latéral |
| UX-21 | apropos, contact, mes-dossiers, simulateur | Cosmétique | Ton du fond gris sur certaines pages, blanc sur d'autres (à confirmer) |

Total : 0 Bloquant · 2 Majeur · 13 Mineur · 6 Cosmétique (21 constats).

## 3. Fiches de constat

### UX-01 — Fenêtres modales et lightbox sans Échap ni gestion du focus
- **Gravité** : Majeur (accessibilité clavier)
- **Pages** : `/accueil` et `/galerie` (lightbox photo), `/simulateur` (panneau « Créez votre compte »), `/atelier/demandes` (fenêtre « Traiter la demande »)
- **Étapes** : 1) accueil : cliquer une photo. 2) Appuyer sur Échap. 3) Idem sur simulateur après « Créer mon compte pour préciser », et sur atelier/demandes après « Traiter ».
- **Observé** : Échap ne ferme rien (état revérifié après 3–5 s : lightbox toujours présente, `.lb-btn` toujours dans le DOM). À la fermeture par le bouton, le focus part sur `<body>` au lieu de revenir sur l'élément déclencheur. Dans le simulateur, à l'ouverture, `document.activeElement` reste le bouton « Créer mon compte pour préciser », situé hors de `#sub-pan` (`role="dialog" aria-modal="true"`), donc le focus clavier n'entre pas dans la boîte de dialogue. Les flèches gauche/droite de la lightbox ne sont pas gérées non plus (aucun `keydown`).
- **Attendu** : Échap ferme ; focus placé dans la fenêtre à l'ouverture puis restitué à l'élément déclencheur ; flèches pour changer de photo.
- **Preuve** : recherche dans `maquette/js` : le seul gestionnaire `keydown` Échap se trouve dans `pages/preciser.js:435` (le panneau « Préciser » se ferme bien avec Échap, observé). Aucun `keydown` dans accueil.js, galerie.js, simulateur.js, atelier-demandes.js. Mesure simulateur : `{"active":"BUTTON Créer mon compte pour préciser","ae":"OUTSIDE dialog"}`. Après « Annuler » : `active: BODY`. Atelier : lightbox fermée uniquement par la croix ; la capture montre la fenêtre toujours ouverte après Échap.
- **Cause probable (hypothèse)** : la logique clavier n'a été écrite que pour `preciser.js` ; un utilitaire commun de modale n'existe pas.

### UX-02 — Entrées de menu mortes dans l'atelier
- **Gravité** : Majeur (navigation)
- **Page** : toutes les pages `/atelier/*` (menu latéral)
- **Étapes** : cliquer « Statistiques », « Réductions », « Parrainage » ; ouvrir « Argent » puis cliquer « Chiffres » ou « Échéanciers ».
- **Observé** : rien ne se passe (URL et page inchangées après 4 s), aucune indication « bientôt disponible », pas de focus visible particulier.
- **Attendu** : soit un état désactivé explicite (`aria-disabled`, style grisé, info-bulle), soit une page.
- **Preuve** : `href="#"` lu dans le DOM pour Argent, Statistiques, Catalogue, Réductions, Parrainage, Vitrine, Réglages, Chiffres, Échéanciers. « Catalogue » et « Argent » s'ouvrent comme accordéon (le sous-menu Catalogue mène bien aux pages services/options/catégories/fiches/modèles) mais les boutons d'accordéon n'ont pas `aria-expanded` (`exp=null`). Les sous-entrées de « Vitrine » et « Réglages » n'ont pas été ouvertes.
- **Cause probable (hypothèse)** : pages non réalisées dans la maquette, liens factices.

### UX-03 — URL incohérente selon le mode d'arrivée
- **Gravité** : Mineur
- **Étapes** : charger `/galerie` directement (l'URL reste `/galerie`). Cliquer « Services » : l'URL devient `/services.html`. Recharger (F5) : redirigé vers `/services`.
- **Observé** : `location.pathname` = `/services.html` après un clic routeur, `/galerie` après chargement direct. Idem atelier : `/atelier/planning.html` vs `/atelier/planning`.
- **Attendu** : une seule forme d'URL (celle de `cleanUrls`).
- **Preuve** : requêtes réseau : `GET /services.html` (200 listé) suivi de `GET /services` ; chaque navigation du routeur fait donc un aller de plus. Le routeur fait `fetch(href)` et `history.pushState({}, '', url)` avec le `href` tel qu'écrit (`.html`).
- **Cause probable (hypothèse)** : `routeur.js` ligne 100 pousse l'URL source ; Vercel convertit `.html` en URL propre au rechargement.

### UX-04 — Simulateur : liste « devis » à défilement interne
- **Gravité** : Mineur
- **Page** : `/simulateur`
- **Étapes** : ajouter « Mariage » (+), choisir la zone « Namur », cocher « Album photo ».
- **Observé** : la zone `#lz` (hauteur 270 px) a un défilement interne (`scrollHeight` 322 > `clientHeight` 270) ; la ligne « TRANSPORT Déplacement estimé · zone Namur » est coupée en bas de la boîte ; une barre de défilement interne apparaît. Un grand vide sépare la ligne « SERVICE » (y≈350) de « forfait, 2 h incluses » (y≈512 sur la capture).
- **Attendu** : liste entièrement visible (le bloc a de la place dessous) ou défilement clairement signalé.
- **Preuve** : `DIV#lz ch=270 sh=322 rect height 273`.
- **Cause probable (hypothèse)** : hauteur fixe de `#lz` dans `css/pages/simulateur.css`.

### UX-05 — En-tête de la page « préciser » : texte hors marge
- **Gravité** : Mineur
- **Page** : `/preciser`, viewport 1920×911
- **Observé** : « REPRIS DE VOTRE SIMULATION · ADRESSES PRIVÉES, VISIBLES DU PHOTOGRAPHE SEULEMENT » se termine à x = 1905 px, soit 15 px du bord de la fenêtre, alors que la règle de l'en-tête s'arrête vers x ≈ 1839 (marge de 80 px dans la scène).
- **Attendu** : aligné sur la marge droite (comme « PRIX EN DIRECT · HTVA… » du simulateur qui reste dans la marge).
- **Preuve** : `SPAN.o L=1292 R=1905` (mesure `getBoundingClientRect`).
- **Cause probable (hypothèse)** : texte trop long pour la colonne de droite ; `white-space: nowrap`.

### UX-06 — Textes tronqués
- **Gravité** : Mineur
- **Pages / preuves** (mesure `scrollWidth > clientWidth` sur éléments en `overflow` caché, après stabilisation) :
  - `/galerie` : légende « MARIÉS · CHÂTEAU » sur la vignette portrait : `sw=118 cw=110` (affichée « MARIÉS · CHÂTE… »).
  - `/atelier/options` : liste de catégories `sw=382 cw=338`.
  - `/atelier/planning` : « 10:00 Famille lifestyle · Charleroi · si… » `sw=234 cw=193`, « 14:00 Culinaire & studio · Bruxelles » `sw=196 cw=193`.
  - `/atelier/dossier` : note « 10 nov. 2026 · Fiche technique complétée » `sw=236 cw=230`.
- **Attendu** : texte entier, ou info-bulle (`title`) donnant le texte complet.

### UX-07 — Durée affichée incohérente
- **Gravité** : Mineur
- **Pages** : `/dossier` (côté client) et `/atelier/dossier`
- **Observé** : « Mariage · 9 h 15 · 2 h incluses, 7 h 30 en plus ». 2 h + 7 h 30 = 9 h 30, pas 9 h 15. La ligne est facturée 700 € (250 + 7,5 h × 60 €), donc l'« en plus » est arrondi à la demi-heure, la ligne de titre ne l'est pas. Le ruban indique 13:00 → 22:15 (9 h 15 réelles).
- **Attendu** : mention de l'arrondi (« 7 h 15, facturées 7 h 30 ») ou valeurs cohérentes.
- **Preuve** : textes lus sur les deux pages ; totaux vérifiés cohérents (852,30 HTVA + 21 % = 1 031,28 TVAC).

### UX-08 — Largeurs étroites : lisibilité
- **Gravité** : Mineur
- **Observé** (iframe) : la scène est réduite proportionnellement : échelle 1,2 à 1920×1080, 1,0 à 1440×900, 0,80 à 1280×720, 0,71 à 1024×768, 0,556 à 800×700, 0,417 à 600×900. Aucun débordement ni barre de défilement parasite (`scrollWidth == innerWidth`, `body overflow:hidden`), mais un texte de 14 px devient ≈ 7,8 px à 800 px et ≈ 5,8 px à 600 px. À 600×900 la page occupe une bande de ≈ 380 px de haut au milieu de l'écran.
- **Attendu** : décision explicite : plancher d'échelle ou mise en page mobile.
- **Preuve** : `transform: matrix(0.555556…)` à 800 px.

### UX-09 — 404 générique
- **Gravité** : Mineur
- **Étapes** : ouvrir `/page-inexistante`.
- **Observé** : page noire anglaise « This page doesn't exist » de Vercel, onglet « 404: NOT_FOUND ».
- **Attendu** : page 404 aux couleurs du site avec lien vers l'accueil.

### UX-10 — Cache et requêtes
- **Gravité** : Mineur (performance)
- **Observé** : à chaque chargement complet, 13 à 15 ressources JS/CSS reçoivent `304` (revalidation) au lieu d'être servies du cache ; 251 requêtes pour environ 20 pages. Chaque navigation du routeur génère un GET `.html` puis un GET sans extension (voir UX-03). La simultanéité d'animations est élevée : `document.getAnimations().length` = 117 (services), 188 (galerie) ; 14 animations infinies en cours sur services.
- **Preuve** : lecture du réseau (statuts 304 sur `/css/base.css`, `/js/lib/*.js`).
- **Hypothèse** : en-têtes `Cache-Control` par défaut de Vercel (`max-age=0, must-revalidate`), pas de `vercel.json` de cache.

### UX-11 — Colonne gauche du hero vide (à confirmer hors environnement lent)
- **Gravité** : Mineur
- **Page** : `/` puis « Passer l'intro », puis « Rejouer l'intro » ; `/accueil`
- **Observé** : sur 5 captures de l'accueil (dont une 20 s après le rejeu), la colonne de gauche ne montre que le filet, le petit trait orange, un point noir et les boutons ; le texte (message en rotation « Six façons de raconter… », « Des instants… » ou témoignage) est absent. Mesure : spans `.o` avec `clip-path: inset(-24px 100% -24px 0px)` (masqués) ; une animation `wOut` terminée à 300 ms.
- **Attendu** : jamais de colonne vide entre deux messages (ou pause très courte).
- **Preuve** : DOM ci-dessus. Cause d'attente possible : environnement à 1,5 images/s (voir limites) ; **à confirmer**.

### UX-12 — Contact : « Envoyer » sans retour
- **Gravité** : Mineur
- **Étapes** : `/contact` → « Écrire maintenant » → cliquer « Envoyer » (champs vides, puis nom + e-mail remplis).
- **Observé** : aucun message, aucune validation, aucun changement. Le formulaire a `noValidate=true` et aucun champ `required`.
- **Attendu** : au minimum un message de confirmation ou d'erreur (même factice).
- **Preuve** : `contact.js:3` : « Envoyer n'a pas d'action » (comportement voulu pour la maquette ; je le signale comme point d'attention d'UX).

### UX-13 — Changement de famille de page = rechargement complet
- **Gravité** : Mineur
- **Étapes** : depuis `/` cliquer « Galerie » (ou aller du site vers l'atelier).
- **Observé** : capture juste après le clic : page blanche avec seulement un cadre gris, puis l'en-tête se redessine entièrement. Le routeur utilise la navigation classique pour intro → site, site ↔ atelier.
- **Attendu** : transition cohérente avec les autres (fondu vers le blanc).
- **Preuve** : `routeur.js:72` (`doc.body.dataset.famille !== famille` → `classique(url)`) ; `fam: "intro"` sur `/`.

### UX-14 — Gels du moteur de rendu
- **Gravité** : Mineur (à confirmer)
- **Observé** : 1) `screenshot` expiré après 30 s juste après l'ouverture de la lightbox sur l'accueil (le suivant a réussi). 2) `javascript_exec` expiré après 45 s pendant un clic « Planning » depuis le tableau de bord de l'atelier avec un échantillonneur à 15 ms (la navigation s'est bien terminée : `/atelier/planning.html`).
- **Hypothèse** : charge d'animations élevée (UX-10) combinée à l'environnement lent ; non reproduit ailleurs.

### UX-15 — Galerie : filtre sans état d'URL
- **Gravité** : Mineur
- **Étapes** : `/galerie` → « Engagement » → recharger ou Retour.
- **Observé** : le filtre s'applique (4 photos + 1 témoignage, compteur « 04 » cohérent) mais l'URL reste `/galerie` (pas de `?` ni `#`).
- **Attendu** : filtre partageable / restitué par Retour.

### UX-16 — Tête du trait vagabond
- **Gravité** : Cosmétique (conformité à la description)
- **Observé** : un point noir plein de 10 px (`SPAN.tete`, fond `rgb(13,14,16)`, opacité 1) est visible à x=66, y=236 sur l'accueil, y compris lightbox ouverte (où il apparaît comme un point isolé à gauche de la photo). Le trait associé (`svg.wd`) a `opacity 0`, soit un point sans trait. Position inchangée sur 3 s.
- **Attendu** : trait unique à angles droits, opacité faible (consigne).
- **Cause probable (hypothèse)** : la tête n'est pas atténuée comme le trait ; `vagabond.js`.

### UX-17 — Textes provisoires visibles
- **Gravité** : Cosmétique
- **Pages** : galerie (`[LIEU]`, `[Une phrase sur la journée]`, `[PRÉNOMS DES MARIÉS]`), services (`[prix] €`, `[X h]`, `[X] km`), contact (`[VOTRE ADRESSE E-MAIL]`, `[48 h]`), apropos (`[PORTRAIT D'ERNEST]`), accueil (`[Prénoms des mariés], [lieu]`). Les photos sont des dégradés de remplacement (aucune requête image, `document.images.length = 0`). La date fixe de l'atelier est « mercredi 11 novembre 2026 » alors que la date réelle est le 14.

### UX-18 — Champs natifs et étiquettes du ruban
- **Gravité** : Cosmétique
- **Observé** : champs « jj-mm-aaaa » et « 14:00 » avec l'habillage natif du navigateur (icônes calendrier/horloge) dans simulateur et préciser. Sur le ruban d'horaires : la première étiquette (« 10:00 » dans le simulateur, « 06:00 » dans préciser) est centrée sur le début de la ligne et dépasse à gauche de 13 px (x=351 vs ligne à 364 sur la capture) ; « 24:00 » dépasse à droite. Dans le panneau « Préciser » : « 14:00 » apparaît en noir et en cyan l'un sous l'autre sous la poignée de gauche, avec un « 1 » au-dessus. Dans l'état « adresse requise » (page préciser), le ruban s'affiche comme une pastille noire avec une seule poignée visible à gauche.

### UX-19 — Titres d'onglet
- **Gravité** : Cosmétique
- **Observé** : `Galerie · Ernest H.`, `Services · Une fiche par service`, `À propos · Portrait et récit`, `Contact · Deux portes`, `Simulateur de devis · Ernest H.`, `Atelier · Planning`. Deux formats (nom du site ou sous-titre éditorial en suffixe).

### UX-20 — Fenêtre « Traiter » dans l'atelier
- **Gravité** : Cosmétique
- **Observé** : à l'ouverture, le menu latéral disparaît de l'écran (fond uni), alors que le cahier des charges parle d'un menu persistant. Le panneau est centré sur la zone contenu.

### UX-21 — Fond gris selon les pages (à confirmer)
- **Gravité** : Cosmétique
- **Observé** : captures : fond blanc sur services et accueil, voile gris marqué sur apropos, contact, mes-dossiers, simulateur. Pas mesuré en valeur. Peut dépendre de l'état de l'animation « ombres » (`ombres.js`), donc possiblement lié à la lenteur du rendu.

## 4. Ce qui fonctionne bien (à ne pas casser)

- **Navigation sans rechargement** : trois clics rapides (Services, Galerie, Contact à 100 ms d'écart) finissent proprement sur Contact : URL, titre, module et `h1` concordent, aucune erreur JS, une seule feuille de page en place, aucune balise `preload` restante, en-tête intact.
- **Retour / Avancer** sur 3 pages : état (URL, titre, module, entrée active du menu) correct à chaque étape.
- **Atelier** : les 16 pages se chargent sans erreur console, sans lien mort (hors UX-02), sans id dupliqué ; compteurs cohérents entre pages (4/8/4 dossiers par étape, 24 dossiers = 4+8+4+6+1+1, 21 clients + 3 prospects = 24 fiches, 2 demandes) ; le calcul 45 € HTVA → +54,45 € TVAC est juste.
- **Totaux du simulateur** : 250 + 120 = 370 HTVA, TVA 77,70, 447,70 TVAC ; reprise du brouillon après annulation puis dans `/preciser` ; distance calculée (12 km, 0 €).
- **Panneau « Préciser ma journée »** : Échap le ferme, le focus est rendu au bouton d'origine (code `preciser.js`).
- **Accessibilité de base** : focus visible (contour 2 px sombre) au clavier, ordre Tab logique dans l'en-tête, titre principal `h1` doublé en `aria-hidden` (pas de lecture en double), `aria-current` sur le menu, alt/labels présents (0 image sans alt, 0 champ sans label sur contact).
- **Mise à l'échelle** : aucun débordement ni défilement parasite de 600 à 1920 px de large ; `scrollWidth == innerWidth`.
- **Pas d'erreur réseau** ni de police manquante ; zoom photo et fermeture par bouton OK.
- Survol : le menu public souligne bien l'entrée survolée ; la ligne des services souligne l'élément survolé et l'état revient à rien de visible au repos (la classe `on` reste sur le dernier élément mais sans effet visuel).

## 5. Suggestions d'amélioration (priorisées, pour l'agent correcteur)

| Prio | Constat | Suggestion | Effet attendu | Critère de vérification |
|---|---|---|---|---|
| 1 | UX-01 | Créer un utilitaire commun de modale (Échap, focus à l'ouverture, retour du focus, piège de Tab, flèches dans la lightbox) et l'utiliser dans accueil, galerie, simulateur, atelier-demandes (déjà fait dans preciser, s'en inspirer). | Clavier complet, comportement homogène | Sur chacune des 4 pages : ouvrir, appuyer Échap → fermé ; `document.activeElement` = déclencheur ; à l'ouverture `activeElement.closest('[role=dialog]')` non nul |
| 2 | UX-02 | Rendre les entrées mortes explicites (`aria-disabled="true"`, style discret, `title="Bientôt"`) ou les relier ; ajouter `aria-expanded` aux boutons d'accordéon. | Plus de clic sans effet | Aucun `a[href="#"]` actif dans `#sous-entete` ; `aria-expanded` bascule |
| 3 | UX-03, UX-10 | Faire pointer les liens et `pushState` sur les URL propres (sans `.html`) ; ajouter des `Cache-Control` longs pour `/js`, `/css`, `/data` (nom avec empreinte, ou `max-age` court + `stale-while-revalidate`). | Une seule forme d'URL, moins de redirections et de 304 | Après clic Services : `location.pathname === '/services'` ; onglet Réseau : pas de 308 ni de 304 massifs sur un deuxième chargement |
| 4 | UX-04, UX-05, UX-06 | Retirer la hauteur fixe de `#lz` (ou signaler le défilement) ; contraindre le texte d'en-tête de `/preciser` dans la marge droite (retour à la ligne) ; ajouter `title` sur les textes tronqués ou élargir les vignettes. | Plus de texte coupé ou hors marge | Simulateur : `#lz.scrollHeight <= clientHeight` avec 1 service + 1 option ; preciser : `getBoundingClientRect().right <= 1840` pour l'en-tête ; chaque ellipse a un `title` |
| 5 | UX-07 | Afficher « 7 h 15 (facturées 7 h 30) » ou aligner le calcul. | Chiffres lisibles sans doute | Texte vérifié sur les deux pages dossier |
| 6 | UX-11, UX-16, UX-21 | Vérifier hors environnement lent (poste normal, 60 images/s) : hero jamais vide, tête du vagabond à opacité faible, fond homogène. | Conformité aux consignes d'animation | Mesure `getComputedStyle('.tete').opacity` ≤ 0,4 ; capture du hero à 3 instants différents avec texte visible |
| 7 | UX-13 | Étendre la transition de fondu vers le blanc aux passages intro → site et site ↔ atelier (ou masquer le flash blanc). | Continuité visuelle | Aucune capture entièrement blanche > 100 ms au changement de famille |
| 8 | UX-08 | Décider d'un plancher d'échelle (ex. 0,7) ou d'une mise en page étroite. | Texte lisible sous 1024 px | Taille de texte calculée ≥ 10 px à 800 px de large |
| 9 | UX-09, UX-12, UX-15, UX-17 à UX-20 | 404 personnalisée (`404.html`), message de retour après « Envoyer », filtre galerie dans `?cat=`, harmonisation des titres, habillage des champs date/heure. | Finition | Contrôles ponctuels visuels |

**Point à ne pas oublier** : refaire l'audit des transitions (fondu 0,32 s, en-tête figé, morphing, comète du surligneur, zoom photo) sur une machine non dégradée ; mes mesures de rendu y sont impossibles (voir limites).
