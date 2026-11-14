# Maquette statique : écarts avec les planches du canvas

> Maquette : `maquette/` (HTML/CSS/JS vanilla, ES modules, sans build). Planches source : `docs/front/canvas-da-morphic/*.dc.html`.
> Mis à jour le 2026-11-12. La synthèse ci-dessous est le point d'entrée ; les sections par groupe de pages (tableaux « planche → page → contrôles → écarts → corrigé » et règles de répartition en largeur) sont reprises des comptes rendus des agents de traduction.

## Synthèse

### Ce qui a été fait depuis la première livraison
1. **Navigation sans rechargement (AJAX)** : routeur `js/lib/routeur.js` (fetch, remplacement de `#contenu`, `pushState` / `popstate`, titre, focus sur le `h1`, retour en haut, résorption `wOut` du contenu sortant, préchargement au survol). Parties persistantes : en-tête du site public ; menu latéral, ombres et fond de l'atelier. Chaque module de page expose `init(racine)` / `destroy()` (`js/lib/vie.js` pour minuteries et écouteurs). Passer du site à l'atelier ou de l'intro au site, ou une erreur de fetch : navigation classique. L'astuce du `document.referrer` est supprimée : l'entrée animée du menu de l'atelier ne se joue qu'au premier chargement (vérifié : durées à 0 s après navigation).
2. **Prix : une seule référence, celle du simulateur** (`maquette/data/tarifs.js`). Catalogue de l'atelier, dossiers et tout ce qui en découle en dérivent.
3. **Traits du verre du simulateur** : tracés à l'entrée puis effacés après la première interaction, comme le canvas.
4. **Fond plein fenêtre** (`#fenetre`, persistant) : fond blanc, vignette et ombres mouvantes couvrent toute la fenêtre, derrière la scène ; plus de coupure. La photo agrandie de l'accueil estompe ce calque pendant que son voile blanc couvre la scène.
5. **Mise en page à largeur variable** : échelle sur la hauteur (hauteur logique 900), largeur logique `W` = fenêtre / échelle (retour à l'ancienne réduction si `W < 1440`). Variables `--W --dx --gx --sx` sur `#scene`. À 1440 × 900 : `dx = 0`, mise en page de la planche. Atelier : menu collé à gauche (marge 24), zone de contenu de x = 304 à `W − 64`. Site : éléments de gauche à gauche (marge 80), de droite ancrés à droite, bloc central centré qui grandit jusqu'à ~1700 logique. Règles page par page dans les sections ci-dessous.

6. **Panneau « Configurer ce service » du simulateur (nouvelle version validée, source `SimMix.dc.html`)** : l'ancien réglage par boutons − / + et communes cliquables est remplacé. Ruban de la journée 06:00 → 24:00 (largeur 560) : bande de présence noire (forfait) et grise (dépassement), poignées noires début et fin, une poignée cyan par lieu (numéro au-dessus, heure en cyan dessous), graduations 06:00…24:00 ; tout est fait d'`input type="range"` superposés (pouce seul cliquable) : souris et clavier, mise à jour en direct pendant le glisser. Règles de la planche : le début est indépendant (la fin reste fixe, la durée s'ajuste, le premier lieu suit le début, un lieu avant le début est ramené au début, début au plus tard fin − 30 min) ; la fin règle la durée (30 min à 14 h) ; chaque lieu se règle par sa poignée. Pour chaque lieu : « Lieu n : » + `input type="time"` (pas de 15 min, 06:00–23:30, synchronisé dans les deux sens avec la poignée, heure tapée arrondie au quart d'heure), champ d'adresse libre, ligne d'état à point (bordeaux « Adresse à indiquer… », cyan « Distance calculée : Namur · 12,0 km », orange « Adresse notée · distance confirmée par le photographe »), « + Ajouter un lieu » / « Retirer ce lieu ». `ville()` reconnaît une commune par son nom ou son code postal (`data/tarifs.js`, aucune requête réseau) ; `calculer()` suit la planche : adresse vide = transport « à préciser » et « Soumettre » bloqué ; adresse non reconnue = « Départ photographe → adresse saisie », 0,00 €, distance confirmée par le photographe. Les adresses sont réaffichées par `textContent`. Le résumé du panneau de soumission et la frise du devis suivent les nouvelles données. La mini-frise de l'ancien panneau a disparu (comme dans la planche). Le stepper − / + ne subsiste que pour le service en studio (nombre de plats).
   - Mesuré : fin 20:00 → 6 h, 490,00 € ; début 10:00 (fin fixe) → 10 h, 730,00 € ; lieu 1 tapé 11:07 → 11:00 ; « Rue Haute 12, 5000 Namur » → Namur 12,0 km, transport 0,00 € ; adresse parisienne → « adresse saisie », 0,00 € ; `<img src=x onerror=1> 1000` → traité comme texte (Bruxelles par code postal, aucun nœud `img` créé) ; adresse vide → « Soumettre » inactif, « Total TVAC · incomplet » ; deux lieux Namur + Liège → transport sur le plus éloigné (Liège 61,3 km, 48,80 €) ; retrait d'un lieu ; clavier : 4 × flèche droite sur la poignée de fin = +1 h ; aucun débordement, aucune erreur JS.
   - Comparé au canvas en « Play full screen » (page « Simulateur · horaires et adresses », planche A, panneau ouvert sur Mariage) : mêmes positions, textes, ruban, graduations, étiquettes d'heures, champs, ligne d'état, options, prix et boutons. Écart connu : le catalogue d'options affiché est celui du simulateur (inchangé).

7. **Simulateur public sans compte (« A · frise directe », `SimMix.dc.html`)** : le panneau « Configurer ce service » (ruban + adresses exactes) n'est plus sur la page publique ; son code (HTML, JS, CSS) est conservé dans `maquette/reserve/precision-journee/` pour l'écran connecté « Préciser ma journée » (`Preciser.dc.html`, en attente de validation : non traduit). Page publique : on règle la journée directement sur la frise du devis (deux poignées début / fin par prestation, `input type="range"` superposés, souris et clavier, début indépendant, minimum 2 h, maximum 14 h, axe 10:00 → 24:00) ; une date par prestation ; la **zone** (pastilles Bruxelles, Namur, Liège, Charleroi, Mons, Anvers, Gand : jamais d'adresse exacte avant inscription, règle de vie privée) ; les options en pastilles (« ✓ / + nom · prix »). « + » du catalogue ajoute directement la prestation. Prix « À partir de · TVAC » avec déplacement estimé par zone (Anvers : 98,6 km → 197,2 km aller-retour → 86,10 € ; Namur : déplacement offert) ; bouton « Créer mon compte pour préciser » → panneau « Enregistrer mon brouillon » (e-mail et mot de passe, bascule connexion / création, messages d'erreur de la planche) → « Votre brouillon est enregistré. » : rien n'est envoyé. Données : `data/tarifs.js` (une seule source ; 7 zones, `calculer()` gère la zone).
   - Mesuré : fin à 18:00 → 4 h, 370,00 € ; début 11:00 (fin fixe) → 7 h, 550,00 € ; fin ramenée sous 2 h → 2 h, 250,00 € ; début au-delà de fin − 2 h → plafonné ; zone Anvers → +86,10 € HTVA ; option album → 551,88 € TVAC (250 + 120 + 86,10) ; plusieurs prestations (Mariage, Culinaire en studio, Famille lifestyle, Anniversaire) puis retrait de la quatrième ; date conservée à l'ajout d'une prestation ; compte : e-mail invalide, mot de passe manquant (création), mot de passe manquant (connexion), « Enregistrement… », brouillon enregistré, champ mot de passe vidé ; console sans erreur. Paramètre d'URL `?exemple=Vide|Mariage posé` (défaut Vide). Le paramètre `panneau` de la planche (panneau ouvert sur Mariage) n'existe plus : le panneau n'est plus sur la page publique.
   - Comparé au canvas en « Play full screen » (page « Simulateur public · à partir de », planche A, exemple Mariage posé) : mêmes positions, textes, frise, poignées, pastilles de zone, totaux et note. Écart connu de la planche, repris tel quel à 1440 × 900 : les sept pastilles de zone passent à la ligne (Anvers, Gand) et la dernière pastille d'option chevauche la ligne « forfait, 2 h incluses » ; sur fenêtre plus large (`dx` > 0) les pastilles tiennent sur une ligne et le chevauchement disparaît. Ajout assumé : le lien « Voir mon espace client » (vers `mes-dossiers.html`) à l'écran « brouillon enregistré », absent de la planche, pour garder le parcours navigable.

### Contrôles faits (mesurés)
- **Les 25 pages, à froid** (iframes de même origine) : aucun élément hors scène (sauf le flux défilant de la galerie, voulu), rien resté à opacité 0 ou clip fermé après les animations, console sans erreur. Refait à 1920×850 après la mise en page pleine largeur : marge droite de 47 à 80 px selon la page, aucun élément coupé.
- **Navigation par clics (routeur)** : atelier (tableau de bord → dossiers → demandes → clients → production → planning → catalogue → services / options / catégories / fiches / modèles → fiche / option / service / client / dossier, puis Retour / Avancer, puis une seconde série après la mise en page pleine largeur) et site (accueil → galerie → services → à propos → contact → simulateur ; dossier → mes dossiers → dossier → Retour → simulateur) : aucun rechargement, un seul `#contenu` et une seule coque, aucune erreur JS (`error` et `unhandledrejection` écoutés).
- **Tailles testées** (la fenêtre de test a un viewport fixe de 1920×855, `resize_window` n'agit pas : iframes de la taille voulue) : 1920×850, 2560×1080, 1440×900, 1280×720, 1000×900, avec des vérifications plus ou moins poussées selon les agents (le 1000×900 du panneau « Changer l'étape » n'est pas confirmé).

### Comparaison visuelle plein écran avec le canvas (« Play full screen » contre la maquette)
Faite **avant** la mise en page pleine largeur, à la taille de la planche (à 1440×900 la page est identique par construction : `dx = 0`, non re-comparée après coup). Comparées : intro / accueil, galerie, services, à propos, contact, simulateur, dossier (client), mes dossiers, tableau de bord, dossiers, dossier, demandes, services, service, options, option, catégories, types de fiches, type de fiche, modèles (20 planches). Verdict : positions, proportions, textes et états identiques ; écarts trouvés :
- Options (atelier) : la colonne « Catégories » débordait sur « Mode et prix » avec les nouveaux noms de catégories ; corrigé (largeur proportionnelle, ellipse, texte complet au survol).
- Galerie : le témoignage observé tronqué était une capture en cours d'écriture, pas un écart.
- Différences voulues : données harmonisées (voir plus bas), photos remplacées par des dégradés.

**Non comparées en plein écran** : Clients, Fiche client, Planning, Production (4 planches). Leur fidélité repose sur la traduction du source et sur les mesures.

### Écarts qui ne peuvent pas être identiques
- Photos du canvas (`/_blob/…`) : dégradés neutres avec libellé (`.ph`, teintes `ton-1` à `ton-8`), cadrage et animation « développement » conservés.
- Textures bitmap (papier, grain du texte et du bouton noir) : non reprises, reflet CSS seulement.
- Pas de persistance d'état entre pages ni de réseau.
- `wIn` : l'extension verticale du clip est de 24 px partout (12 px sur le site dans les planches) ; sans effet visible.
- Sur très large fenêtre : collage de l'accueil sur une rangée avec de l'air autour ; paragraphe de « À propos » à longueur de ligne fixe (espace à droite à 2560×1080).

### Prix harmonisés sur la référence du simulateur (`data/tarifs.js`)
- Catalogue de l'atelier : services Mariage (250 € · 2 h incluses · 60 € / h), Séance engagement (180 €, 1 h 30), Famille lifestyle (220 €), Anniversaire (250 €), Événementiel (250 €), Culinaire & studio (15 € / plat, de 5 à 40) + « Mini-séance de Noël » archivée jamais utilisée ; options Album photo 30×30 (120 €), 10 tirages 20×30 (45 €), Second photographe (300 €) + « Vol de drone » archivé jamais utilisé ; catégories Mariages & couples, Familles & fêtes, Entreprises & studio (3 au lieu de 7). Remplace : Mariage · journée 650 €, cérémonie, baptême, portraits, reportage, album 145 €, séance couple, livraison express, tirages à 6 €, etc.
- Dossier 2027-014 (Camille D.) : Mariage 9 h 15 = 700,00 € + Album photo 30×30 = 120,00 € + transport Bruxelles 44,8 km = 32,30 € → 852,30 € HTVA, TVA 178,98 €, **1 031,28 € TVAC** (le total n'a pas changé ; les lignes reviennent à celles de la planche client d'origine). Frise 13:00 → 22:15. Demande en attente : « Ajout : 10 tirages 20 × 30 » (+45,00 € HTVA, total après validation 1 085,73 € TVAC) au lieu de l'album à 145 €. Panneau « Retirer une ligne » : ligne par défaut = album.
- Totaux des 24 dossiers tous calculés par le simulateur (prestation, durée, options, commune) ; exemples : 2027-024 486,00 → 450,48 € ; 2025-007 320,10 → 181,50 € ; 2026-041 390,00 → 266,20 € ; 2026-043 240,00 → 341,58 € ; 2026-044 320,10 → 217,80 € ; 2026-047 620,00 → 506,75 € ; 2027-005 340,00 → 363,00 € (liste complète : `maquette/data/dossiers.js` et colonne « Total TVAC » de `atelier/dossiers.html`). Les noms de prestation des dossiers sont ceux du simulateur.
- Panneau « Nouveau client » : catalogue du simulateur (Mariage 786,50 → 302,50 € TVAC, etc.) ; simulation du 7 nov. de Camille D. : 976,80 → 922,38 €.

### Autres données harmonisées (première livraison)
24 dossiers au lieu de 15 (numéros cités dans planning, production, espace client) ; espace client = Camille D. (2027-014, 2027-024, 2025-007) ; soumis le 9 novembre 2026 ; lieu Château du Karreveld, Bruxelles ; tableau de bord 4 / 8 / 4 et « quatre dossiers attendent votre regard », 4 prochains shootings ; clients « 21 clients · 3 prospects » ; planning et production construits depuis les dossiers (deux livraisons ajoutées, jour « surchargé » du 28 nov. sur deux vrais shootings) ; compteurs des catégories calculés.

### Paramètres d'URL (props de planche)
`?ombre=` (Alternance par défaut, Diagonale, Studio · latérale, Studio · spot, Studio · cyclo, Studio · strip, Sans) sur toutes les pages ; `atelier/tableau-de-bord.html?etat=Données|Chargement|Vide|Erreur` ; `atelier/dossiers.html?etat=Données|Chargement|Aucun résultat` ; `atelier/dossier.html?panneau=Aucun|Traiter la demande|Retirer une ligne|Changer l’étape` ; `atelier/demandes.html?etat=Données|Vide` ; `atelier/services.html` et `options.html?etat=Données|Chargement|Vide` ; `atelier/service.html` et `option.html?tva=Réglée|Non réglée` ; `atelier/clients.html?etat=Données|Chargement|Vide&panneau=Nouveau client` ; `atelier/production.html?etat=Vide` ; `mes-dossiers.html?etat=Avec dossiers|Chargement|Vide`.

---


## Phase 2 : navigation sans rechargement
- `accueil.html` et `galerie.html` suivent le contrat du routeur (`data-module`, `#contenu`, `init`/`destroy`, `creerVie`). `index.html` reste une page classique (`data-famille="intro"`, `#fond` ajouté) ; `accueil.js` garde `monterAccueil()` pour l'intro, qui retire l'en-tête (`demonterEntete`) quand l'intro est rejouée. `accueil-page.js` supprimé (fichier à moi).
- Contrôles mesurés : chargement à froid, clic Galerie depuis l'accueil (pas de rechargement, titre mis à jour, pastille du menu retirée de `#sous-entete`, un seul en-tête), Retour (accueil remonté, 1 seul en-tête) ; intro « Passer » puis « Rejouer » (en-tête démonté puis remonté) ; console sans erreur.
- Pastille de verre du menu et ses traits : dans `#sous-entete`, retirés à la sortie. Arrivé d'une autre page, l'en-tête ne rejoue pas son entrée (sa vie continue sur l'accueil ; animé pendant la photo agrandie de la galerie).
- Écart : le calque d'ombres monté par `amorce.js` est masqué (`#scene > .om{display:none}` dans accueil.css et galerie.css) car ces deux planches n'en ont pas dans le canvas.
- Edit additif hors de mes fichiers : `js/lib/entete.js` (export `demonterEntete`).
- Non vérifié : absence de rotation d'accroche après sortie (assuré par `vie.nettoyer()`, pas mesuré séparément).

## Phase 3 : largeur pleine fenêtre (règle de répartition)
dx = gain de largeur logique (0 à 1440 x 900 : pages identiques aux planches).
- **Accueil** : texte, boutons, filets et horloge à gauche (inchangés) ; collage ancré à droite : sa zone passe de 716 à 716 + dx de large et la grille justifiée est recalculée dessus (à chaque rendu et sur `scene:resize`) ; barre des services : pastille et traits de 1312 + dx, services répartis (`right: 80px`) ; pastille de verre du menu et ses traits suivent la navigation centrée (+ dx/2) ; pied de page gauche / droite ; photo agrandie centrée sur W/2, compteur recentré.
- **Galerie** : colonne de filtres, titre et bouton à gauche (inchangés) ; zone des photos de 1004 + dx, lignes justifiées recalculées sur 980 + dx, filets des repères étirés ; photo agrandie centrée sur W/2.
- **Intro** : plan du collage centré (+ dx/2), textes alignés sur le bord du collage (+ dx/2), « Passer l'intro » et « Rejouer l'intro » à droite.
- Mesuré dans des iframes (accueil, galerie ; 1440x900, 1920x850, 2560x1080, 1280x720, 1000x900) : aucun élément hors scène, bouton noir à W - 80, services jusqu'à W - 80, flux de photos jusqu'à W - 88. Intro vérifiée à 2560x1080 (plan à dx/2, bouton à W - 24). Captures vues sur accueil, galerie, intro.
- Écart connu : sur très large fenêtre l'accueil montre le collage en une seule rangée (la grille maximise la surface), avec un peu d'air au-dessus et au-dessous.

---


## Phase navigation sans rechargement
- Les 3 pages suivent le contrat routeur : `data-module`, `data-famille="site"`, `#contenu`, `data-page-css`, `js/amorce.js` ; modules `init()/destroy()` avec `creerVie()` (services : minuterie du changement de chapitre ; contact : l'en-tête n'est réanimé via `majEntete` qu'au retour du formulaire, le routeur le fige ensuite).
- Mesuré (Chrome) : chargement à froid, clics services → à propos → contact → (formulaire ouvert puis fermé) → services : un seul `#contenu`, un seul en-tête, un seul soulignement actif, aucun texte resté clos après 7 s ; Retour/Avancer : bonne page et état réinitialisé ; changement de chapitre suivi d'un départ immédiat sans erreur ; console sans erreur.
- Vu : après navigation, le focus programmatique sur le `<h1>` affiche un cadre de focus (comportement du routeur, pas de la page) ; à signaler.

## Pleine largeur (règles de répartition)
Variables de scène : dx = W − 1440, gx = min(dx, 260), sx = (dx − gx)/2. À 1440×900 (dx = 0) les pages sont identiques à la planche.
- **Services** : pastille des chapitres à gauche (inchangée) ; photo au centre : left +sx, largeur +gx, cadre et comète recalculés au `scene:resize` ; fiche tarif (eyebrow, titre, description, lignes, filets, encadré, bouton, lien) ancrée à droite (+dx).
- **À propos** : portrait à gauche, largeur +gx/2 ; bloc de texte décalé de gx/2 ; les trois piliers se répartissent jusqu'au bord droit (pas = 240 + (dx − gx/2)/2), filets recalculés ; kit, boutons et lien suivent le bloc de texte. Limite : dans une fenêtre très large (2560×1080) un espace reste à droite du paragraphe (lignes de texte de longueur fixe).
- **Contact** : titre à gauche, phrase d'intro ancrée à droite ; chaque carte gagne dx/2 (photo +dx/2) ; ouverte, la carte de droite passe à left 80, largeur 1280 + dx (transition left/width conservée) ; champs répartis sur la largeur (colonnes ×0,28/0,28/0,44, message +dx) ; mise en page recalculée au redimensionnement sans transition.
- Mesuré dans des iframes même origine (1440×900, 1280×720, 1000×900, 1920×850) : aucun élément hors scène, aucun texte resté clos ; captures à 2560×1080 vues pour les trois pages (contact ouvert compris).

---

## Fragment « pub-c » : simulateur, mes dossiers, dossier

| Planche | Page web | Contrôles faits | Écarts trouvés | Corrigé ? |
|---|---|---|---|---|
| PSimulateur | `maquette/simulateur.html` (`js/pages/simulateur.js`, `css/pages/simulateur.css`) | Mesuré : rien à opacité 0 après 6 s, console sans erreur, calculs (forfait + dépassement, transport 32,30 €, TVA 21 %). Joué : ajout, durée, lieux, commune, options, Modifier/Retirer, soumission (e-mail invalide, mot de passe manquant, bascule connexion, « Soumission… », « Merci… », « Voir mon dossier »). Navigation sans rechargement depuis le dossier (CTA), Retour. Après la 1re interaction : traits du verre effacés (décalage 101), comme le canvas. | Canvas non comparé côte à côte. Composition gardée en sessionStorage (la planche l'annonce, ne le faisait pas). | Partiel (voir incertains) |
| PMesDossiers | `maquette/mes-dossiers.html` | Mesuré : rien hors scène, rien à opacité 0, panneau de suppression complet. Vu : états Avec dossiers, Chargement, Vide. Clic sur un dossier : navigation sans rechargement (marqueur window conservé), Retour OK. | Photos remplacées par des cadres neutres `.ph`. Texture bitmap non reprise. | Non (images du canvas inaccessibles) |
| PDossier | `maquette/dossier.html` | Mesuré : rien hors scène, 5 onglets, totaux. | Liens « Compléter la fiche » et « Ouvrir le PDF » : href="#" sans effet. | Non (pages non dessinées) |

## Données harmonisées (référence unique : data/tarifs.js, prix du simulateur)
- Client connecté : Camille D. ; dossiers 2027-014, 2027-024, 2025-007.
- Dossier 2027-014 : Mariage 9 h 15 (2 h incluses, 7 h 30 en plus) 700,00 € + album 120,00 € + transport Bruxelles 44,8 km 32,30 € = 852,30 € HTVA, TVA 178,98 €, 1 031,28 € TVAC (identique à la planche). Frise 13:00 → 22:15 (comme la planche). Soumis le 9 novembre 2026 (la planche disait le 11), modifiable jusqu'au 13 mai 2027, document « Version 1 » du 09/11/2026.
- Montants changés dans « Mes dossiers » par rapport à la planche : 2027-024 (Famille lifestyle, 27 févr. 2027, accepté) passe à 450,48 € TVAC (planche : 486,00 € pour « 2027-002 Reportage événementiel », qui est le dossier de Studio Lemaire côté atelier) ; 2025-007 (Culinaire & studio, 3 mars 2025, réalisé) passe à 181,50 € TVAC (planche : 320,10 €).

## Navigation
Pages converties au routeur sans rechargement (`data-module`, `#contenu`, `init()`/`destroy()` avec `creerVie()`) ; en-tête persistant : le simulateur ne l'anime (majEntete) qu'après la 1re interaction, jamais à l'entrée.

## Paramètres d'URL
`mes-dossiers.html?etat=Avec dossiers|Chargement|Vide` ; `?ombre=Alternance|Diagonale|Studio · latérale|Studio · spot|Studio · cyclo|Studio · strip|Sans` sur toutes les pages (défaut Alternance).

## Points incertains
- Pas de comparaison visuelle côte à côte avec le canvas pour ces trois pages (mesures, captures locales, lecture du code source).
- Le comportement « traits du verre effacés après la première interaction » est repris du code de la planche (animation:none), non vérifié visuellement sur le canvas ; à retirer si jugé défaut.
- Correctif partagé antérieur : `js/lib/dom.js` (`animer` mémorise la valeur demandée).

## Pleine largeur (règles de répartition, dx = largeur logique − 1440)
- Simulateur : catalogue (pastille) à gauche, inchangé ; colonne des totaux et titre « Prix en direct… » ancrés à droite (+dx) ; la journée (axe 10:00–24:00, lignes de prix, arcs) occupe la place libre : largeur 560 + dx, bandes, lieux, repères d'heures et traits recalculés depuis cette largeur (à chaque rendu et sur `scene:resize`) ; panneaux « Configurer » et « Soumettre » centrés (+dx/2).
- Mes dossiers : bloc titre/CTA à gauche inchangé ; registre de 560 à 1360 + dx : colonne Dossier élastique, Étape ancrée à droite (+dx), Total et flèche déjà ancrés à droite ; filets recalculés ; panneau de suppression centré.
- Dossier : titre, étapes et onglets à gauche ; encadré « Modifiable jusqu'au » et bouton ancrés à droite ; zone de contenu, pastille d'onglets (contour recalculé), frise de la journée (proportionnelle à 800 + dx) et lignes s'étirent ; bloc « Total TVAC » ancré à droite.
- À 1440 px de large (dx = 0) les trois pages sont identiques à la planche.
- Vérifié par iframes (1440×900, 1920×850, 2560×1080, 1280×720, 1000×900) : aucun élément hors de la scène, contenu jusqu'à la marge droite de 80 px, simulateur testé avec une prestation (bandes, arc) en 2560×1080.

---

## Groupe atelier-1 : Dossiers, Dossier, Demandes

| Planche du canvas | Page web | Contrôles faits | Écarts trouvés | Corrigé ? |
|---|---|---|---|---|
| ErpDossiers (E11) | `maquette/atelier/dossiers.html` (`js/pages/atelier-dossiers.js`) | Mesuré : rien hors scène 1440×900, rien resté à opacité 0 ni clip fermé après 6 s, console propre. Joué : pagination (3 pages : 9 / 9 / 6), filtres étape et date, recherche, « Effacer les filtres », aucun résultat. Vu : miniature du canvas (mise en page identique) | « 12 en cours · 15 au total » devenu calculé (16 · 24) ; contenu des lignes vient de `data/dossiers.js` | Oui (voulu) |
| ErpDossier (E12, A) | `maquette/atelier/dossier.html` (`atelier-dossier.js`, `atelier-dossier-logique.js`) | Mesuré : idem. Joué : Retirer une ligne (frais invalides puis valides, version PDF, totaux), Changer l'étape (choix, motif et frais obligatoires, dossier clos grisé), Traiter la demande (valider ; refuser sans puis avec motif), tous les onglets. Vu : les 3 panneaux via ?panneau= | Aucun écart de mise en page ; comparaison au niveau miniature seulement (pas de « Play » plein écran pixel à pixel) | Oui |
| ErpDemandes (E24) | `maquette/atelier/demandes.html` (`atelier-demandes.js`) | Mesuré : idem. Joué : Traiter -> Refuser sans motif (erreur) -> avec motif -> carte retirée, historique +1, badge du menu 2 -> 1 | Aucun | Oui |

Hors périmètre : la structure B « Pupitre » (ErpDossierPupitre), exclue.

## Données harmonisées (montants changés)
- Source unique des prix : `data/tarifs.js` (simulateur). Dossier 2027-014 : Mariage 9 h 15 700,00 + Album photo 30×30 120,00 + Transport 32,30 = 852,30 HTVA, TVA 178,98, **1 031,28 TVAC** (comme la planche d'origine).
- Changé par rapport à la première livraison (650 + séance couple 120 + livraison express 50 + transport) : plus de séance couple ni de livraison express ; ligne Mariage 650,00 -> 700,00 ; ligne par défaut du panneau « Retirer une ligne » = Album photo 30×30.
- Demande r1 : « Ajout : 10 tirages 20 × 30 », +45,00 € HTVA (ancienne : album 30 × 30, +145,00 €) ; panneau avant/après 1 031,28 -> 1 085,73 € TVAC ; message client de l'onglet Messages adapté.
- 24 dossiers, prestations aux noms du simulateur ; acompte 30 % recalculé du total. Aucun montant n'est plus codé en dur dans les pages.
- Lieu « Château du Karreveld, Bruxelles » (fiche technique : « Église Saint-Jean-Baptiste, Bruxelles ») au lieu de Namur ; soumission 9 nov. 2026 ; refus du drone « au-dessus du lieu de réception ».

## Navigation sans rechargement
- Les pages exposent `init()` / `destroy()` (creerVie : panneaux ajoutés à la scène retirés ; `#fond` remis à zéro). Aucun état de module dans `atelier-dossier-logique.js`.
- Testé dans Chrome : chargement à froid ; dossiers -> dossier (marqueur window conservé = pas de rechargement) ; Retour (y compris vers `dossier.html?panneau=…` : panneau et clip du fond rouverts) ; dossier -> demandes -> clients ; menu sans nouvelle entrée ; console propre ; mesures RAS ; panneau ouvert puis navigation : il disparaît.
- Bug trouvé et corrigé : remettre `#fond` à zéro par `style.animation = ''` laissait périmé le cache `_anim` de `animer`, donc le fond n'était pas ré-animé au retour ; destroy() passe par `animer(fond, '')`.

## Paramètres d'URL
`dossiers.html?etat=Données|Chargement|Aucun résultat` ; `dossier.html?panneau=Aucun|Traiter la demande|Retirer une ligne|Changer l’étape` ; `demandes.html?etat=Données|Vide` ; `?ombre=…` partout.

## Points incertains
- Lignes rendues par index (supposé identique au canvas, pas de relance d'animation au changement de page).
- État non conservé d'une page à l'autre.
- « Ouvrir ↗ » / « Télécharger » des versions PDF : `href="#"`.

## Pleine largeur (largeur logique W variable, dx = W − 1440)
Règles par page (CSS `calc(… + var(--dx) × f)` via `posf` / `larg` ; rien en JS à recalculer, donc pas de scene:resize) :
- Tableau de bord : 3 compteurs répartis (largeur 340 + dx/3, positions + i·dx/3, espace 24 conservé) ; deux panneaux côte à côte (522 + dx/2 chacun, le second décalé de dx/2, filets et lignes internes étirés).
- Dossiers : registre étiré (largeur 1072 + dx) ; colonnes N° et Client à gauche, Prestation +20 % de dx, Shooting +50 %, Étape +65 %, Total et point « demande » ancrés à droite ; filtres de date et pagination ancrés à droite ; filets étirés (viewBox + preserveAspectRatio none).
- Dossier : colonne principale 700 + dx ; colonne de droite (demande, fiche, versions), bouton « Changer l'étape » et jauge d'étapes ancrés à droite ; onglets et filets étirés ; fiche technique : 2e colonne à +50 % de dx ; messages : réponse ancrée à droite ; panneaux centrés sur la zone de contenu (`.ac`).
- Demandes : cartes de largeur 1072 + dx, boutons « Traiter » ancrés à droite ; historique étiré ; panneau centré.
- Vérifié par iframes 1920×850, 2560×1080, 1440×900, 1280×720, 1000×900 sur les quatre pages et les trois panneaux : aucun élément hors scène, aucun élément à opacité 0, menu collé à gauche (x = 24) ; à 1440×900 (dx = 0) la page est identique à la planche.

---

## Fragment atelier-2a : Services, Service, Options, Option

| Planche du canvas | Page web | Contrôles faits | Écarts trouvés | Corrigé ? |
|---|---|---|---|---|
| ErpServices (E13) | `maquette/atelier/services.html` + `js/pages/atelier-services.js` | Mesuré : rien hors scène 1440×900, aucun élément resté à opacity 0, console sans erreur. Joué : « Supprimer » puis « Confirmer » (service jamais utilisé : supprimé ; service utilisé : archivé, message UC01.4), case « Afficher les archivés ». Vu : captures comparées à la miniature du canvas. | Aucun visible. | n/a |
| ErpService (E14) | `atelier/service.html` + `atelier-service.js` | Mesuré idem. Joué : libellé vide, montant manquant, passage en P6 (6 champs), TVA hors 0–100 %, enregistrement (« Enregistrement… » puis « Service enregistré. »). | Aucun. | n/a |
| ErpOptions (E15) | `atelier/options.html` + `atelier-options.js` | Mesuré + vu : états Données, Chargement (squelettes), Vide. | Aucun. | n/a |
| ErpOption (E16) | `atelier/option.html` + `atelier-option.js` | Mesuré + joué : `?tva=Non réglée`, « abc » en TVA, montant négatif, enregistrement. | Aucun. | n/a |

Logique partagée : `js/pages/atelier-catalogue-logique.js` (`monterListe`, `monterFormulaire`) ; CSS : `css/pages/atelier-catalogue.css`.

## Paramètres d'URL
- `services.html`, `options.html` : `?etat=Données|Chargement|Vide` ; `?ombre=Alternance|Diagonale|Studio · latérale|Studio · spot|Studio · cyclo|Studio · strip|Sans`.
- `service.html`, `option.html` : `?tva=Réglée|Non réglée` ; `?ombre=…`.
- Casse et accents ignorés (`?etat=vide`).

## Phase 2 : navigation sans rechargement et prix de référence

**Navigation** : les 4 pages utilisent `data-module`, `data-famille="atelier"`, `#contenu`, `data-page-css` et `js/amorce.js` ; chaque module expose `init()` / `destroy()` (`creerVie()` pour minuteries et écouteurs de `#fond` ; `fond.style.animation = ''` au destroy). `atelier-catalogue-logique.js` n'a plus d'état de module.

Contrôles (Chrome, mesuré) : chargement à froid de services.html ; clic menu Options, ligne d'option, Retour, Avancer, « Retour aux options », « + Nouvelle option », menu Services puis ligne de service : même document (aucun rechargement), coque identique (menu non rejoué, groupe Catalogue ouvert, entrée active correcte), aucune erreur console, rien hors scène, erreur « Le libellé du service est obligatoire. » puis « Service enregistré. », retour à la liste avec `#fond` sans animation résiduelle.

Limite : le navigateur de test est partagé avec les autres forks (onglets parfois pilotés par un autre fork) ; les essais ont été refaits dans un onglet neuf, en séquences courtes.

**Montants et libellés changés** (tout dérive de `data/catalogue.js` et `data/tarifs.js`) :

| Avant (canvas) | Maintenant |
|---|---|
| Service par défaut « Mariage · journée » : forfait 650 €, 8 h incluses, 80 € / h | « Mariage » : 250 €, 2 h incluses, 60 € / h, arrondi à la demi-heure |
| Franchise transport 30 km, 0,45 € / km | 25 km, 0,50 € / km |
| Option par défaut « Séance couple » 120 € | « Album photo 30×30 » 120 €, description adaptée |
| 10 services, 5 options, 7 catégories | 6 services + « Mini-séance de Noël » archivée ; 3 options + « Vol de drone » archivé ; 3 catégories (Mariages & couples, Familles & fêtes, Entreprises & studio) |
| « utilisé dans 6 dossiers » / « choisie dans 4 dossiers » | comptés depuis `data/dossiers.js` (service Mariage : 6 ; option Album : 6) |
| Options cochées par défaut (service) : Séance couple, Livraison express | les 3 options proposées par Mariage (album, tirages, second photographe) |
| Services qui proposent l'option : Mariage · journée, Mariage · cérémonie | Mariage, Séance engagement, Famille lifestyle (ceux qui proposent l'album) |
| Description du service « Toute la journée… » | « Cérémonie, portraits et moments forts… » (cohérente avec 2 h incluses) |

Inchangé volontairement : les 2 paliers P6 d'exemple (180 € et 300 €), la date limite de 30 jours, le message de TVA « propre à ce service » repris sur l'option (texte du canvas).

## Points incertains
- Comparaison avec le canvas faite en miniature et par zoom seulement (navigateur partagé).
- Pas d'état « Erreur » pour ces planches (le canvas n'en propose pas).
- Aucun état conservé entre deux pages (maquette sans persistance).

## Phase 3 : pleine largeur (dx = W − 1440)
Règles de répartition (variables CSS `--dx`, helpers `posf` / `larg`) :
- **Services / Options** : zone de contenu x 304 → bord droit − 64. Lignes étirées de `dx` ; libellé à gauche ; colonne Catégories à +0,2·dx (largeur 164 + 0,3·dx, ellipse conservée, `title` au survol) ; Mode et prix à +0,5·dx ; Statut, « Supprimer », « Confirmer / Garder » et bouton « + Nouveau » ancrés à droite (+dx) ; filet d'en-tête étiré (viewBox) ; message d'état étiré ; squelettes étirés.
- **Service / Option** : colonne gauche (libellé, description, mode de prix, paramètres) gagne 0,7·dx ; colonne de droite (verre, catégories, fiche, options, transport…) ancrée à droite et plus large de 0,3·dx ; bouton Enregistrer et message ancrés à droite.
Mesuré en iframes (1920×850, 2560×1080, 1440×900, 1280×720) pour les 4 pages : aucun élément hors fenêtre, bord droit du contenu à 64 px, menu collé à gauche, pas de chevauchement (hors doublon contour / remplissage du texte écrit). Non testé : 1000×900.

---

## Fragment atelier-2b : catégories, types de fiches, fiche, modèles de production

| Planche du canvas | Page web | Contrôles faits | Écarts trouvés | Corrigé ? |
|---|---|---|---|---|
| ErpCategories (E17) | `maquette/atelier/categories.html` (`js/pages/atelier-categories.js`) | Mesuré : rien hors scène 1440×900, rien resté à opacity 0, pas de scroll, console sans erreur. Joué : ajout vide / doublon / valide, renommage (vide, doublon, valide, focus), suppression confirmée en ligne, suppression refusée par réduction (toast bordeaux). Vu : comparé à la planche. | Compteurs recalculés depuis le catalogue (voir phase 2) ; la liste passe de 7 à 3 catégories. | Écart voulu (harmonisation) |
| ErpFiches (E18) | `atelier/fiches.html` (`atelier-fiches.js`) | Mesuré. Joué : « Dupliquer » (copie insérée, surlignée, toast). | Colonne « Services reliés » désormais dérivée du catalogue. | Oui |
| ErpFiche (E19) | `atelier/fiche.html` (`atelier-fiche.js`) | Mesuré. Joué : libellé vide, liste sans valeur, ajout champ / liste, groupe vide puis créé, monter / descendre, nom vide, nom en doublon, enregistrement. Vu : comparé en plein écran à la planche : positions identiques. | « sert à N dossiers » dérivé des dossiers (6). | Oui |
| ErpModeles (E29) | `atelier/modeles.html` (`atelier-modeles.js`) | Mesuré. Joué : étape vide, ajout, monter, retirer, délai invalide, nom vide, enregistrement, changement de modèle, modèle sans étape. | Bug corrigé en phase 1 : déplacer la ligne « Livraison » relançait son animation. | Corrigé |

## Réordonnancement
Flèches haut / bas (aria-label « Monter … » / « Descendre … ») et poignée visuelle conservées ; la poignée est décorative dans la planche (pas de glisser-déposer).

## Paramètres d'URL
Aucune option propre à ces planches ; seul `?ombre=` (Alternance, Diagonale, Studio · latérale, Studio · spot, Studio · cyclo, Studio · strip, Sans) est géré par la coque commune.

## Phase 2 : navigation sans rechargement et prix issus de data/tarifs.js

- Pages converties au routeur : `data-module`, `data-famille`, `#contenu`, `data-page-css`, `amorce.js` ; JS en `init(racine)` / `destroy()` avec `creerVie()` (minuteries d'enregistrement), état ré-initialisé à chaque init, toast monté dans `#contenu`, `fond.style.animation = ''` au destroy. `atelier-catalogue2-logique.js` n'a plus d'état de module (la fonction `apres` est supprimée).
- Contrôles (Chrome) : chargement à froid, clics entre Catégories / Fiches / Fiche / Modèles sans rechargement (marqueur `window` conservé), Retour / Avancer corrects, menu inchangé (même nœud, groupe Catalogue ouvert, entrée active mise à jour, un seul calque d'ombres), un seul toast par page, console sans erreur, enregistrement en cours puis changement de page sans effet résiduel.
- Libellés et valeurs désormais dérivés de `data/` (catalogue lui-même dérivé de `tarifs.js`) :
  - Catégories : 7 -> 3 (Mariages & couples, Familles & fêtes, Entreprises & studio). Sous-titres calculés : « 2 services · 3 options · réduction « Mariage hors saison » », « 2 services actifs · 2 options », « 2 services · 1 option » (« actifs » apparaît quand une entrée archivée existe).
  - Types de fiches : « Services reliés » dérivé (Fiche mariage : Mariage, Séance engagement ; Fiche portrait : Famille lifestyle, Anniversaire ; Fiche reportage : Événementiel ; Fiche culinaire : Culinaire & studio). Le point laissé en suspens en phase 1 est résolu.
  - Fiche mariage : « sert à N dossiers » compté sur la configuration des dossiers (6, comme avant).
  - Modèles de production : services reliés = Mariage, Séance engagement (42 j) ; Événementiel (10 j) ; Famille lifestyle, Anniversaire (21 j) ; 6 services dans le panneau (au lieu de 7).
  - Aucun montant n'est affiché sur ces pages.

## Points incertains
- « + Nouveau modèle » reste `href="#"` sans effet, comme dans la planche.
- Entrée dans un champ ne valide pas (la planche n'a pas de formulaire).
- Au-delà de 11 champs, les lignes de la fiche dépassent la scène (comportement de la planche).
- Aucune persistance : l'état revient à sa valeur initiale à chaque chargement de page.

## Phase 3 : pleine largeur (dx = largeur logique − 1440, ex. 593 à 1920×855)

Règle : tout en CSS `calc(Npx + var(--dx) * f)` ; aucun recalcul JS. À dx = 0 la page est identique à la planche.
- categories : liste, champ de saisie et zone d'erreur s'étirent (+dx) ; « Ajouter » suit le bord droit du champ (+dx) ; Renommer / Supprimer restent collés au bord droit de chaque ligne ; encadré « À quoi elles servent » ancré à droite (+dx).
- fiches : tableau et filets s'étirent (+dx, filet en viewBox étiré) ; colonnes en proportion : Champs +25 %, Services reliés +35 % (largeur +40 %), Modifié +80 % ; « Dupliquer » et « + Nouveau type » ancrés à droite (+dx).
- fiche : liste des champs et nom du type s'étirent (nom, intro et erreur à +50 %) ; dans une ligne : libellé (+50 % de largeur), type (+50 %), « obligatoire » et flèches ancrés à droite (+dx) ; panneau « Nouveau champ », « Enregistrer » et toast ancrés à droite.
- modeles : liste des modèles fixe à gauche ; éditeur (verre, nom, étapes, Livraison, erreur) s'étire (+dx) avec flèches ancrées à droite de la liste d'étapes ; séparateur vertical, panneau « Services reliés » (cases, délais, « jours », note) ancrés à droite (+dx) ; « Enregistrer le modèle » fixe à gauche.
- Contrôles : iframes 1920×850, 2560×1080, 1440×900, 1280×720, 1000×900 pour les 4 pages : aucun élément hors scène, aucun chevauchement de textes, menu à gauche = 24 px ; captures vues à 1920×855.

---


## Phase 2 : navigation sans rechargement et prix = tarifs.js
- Pages converties au routeur : `data-module`, `data-famille`, `#contenu`, `data-page-css`, `js/amorce.js` ; `init()` / `destroy()` avec `creerVie()`. Le panneau « Nouveau client » est déplacé dans `#scene` à l'init (hors du fond qu'il résorbe) et retiré à `destroy()`, qui remet aussi `#fond.style.animation = ''`.
- Contrôlé en Chrome : chargement à froid, clic liste -> fiche (sans rechargement, marqueur `window` conservé), Retour / Avancer, panneau ouvert puis navigation (panneau retiré, fond rétabli), menu actif mis à jour sans rejouer l'entrée, console sans erreur, rien hors scène, rien à opacity 0.
- Catalogue du panneau « Nouveau client » : SERVICES (6) et OPTIONS (3) de `data/tarifs.js`, calcul par `calculer()` (config par défaut du simulateur, transport « à préciser » donc hors total) ; total = TVA 21 % sur la somme HTVA. Liste de 9 lignes devenue défilante (max-height 275 px) pour tenir dans le panneau : seul écart de mise en page.
- Montants changés (TVAC) : 2027-024 Famille lifestyle 486,00 -> 450,48 ; 2025-007 Culinaire & studio 320,10 -> 181,50 ; 2027-014 inchangé (1 031,28) ; simulation du 7 nov. 931,70 -> 922,38 (Mariage 8 h + album photo, Bruxelles) ; lignes du panneau : ex. Mariage 786,50 -> 302,50 (forfait 2 h), Album 175,45 -> 145,20.
- Libellés : prestations nommées comme le simulateur (Mariage, Famille lifestyle, Culinaire & studio).

## Phase 3 : pleine largeur (règle de répartition, variable `--dx`)
- **Clients** : zone de contenu 304 -> bord droit − 64 (1072 + dx). Bouton « Nouveau client » ancré à droite (`.ad`), filtres de type et pagination déjà ancrés à droite, recherche et filtres étiquette / origine à gauche. Tableau : largeur 1100 + dx (lignes) et 1072 + dx (en-tête, filet SVG étiré en `preserveAspectRatio="none"`) ; colonnes Type / Origine / Étiquettes / Dossiers décalées de 25 % / 40 % / 55 % / 75 % de dx (la colonne Nom prend la place), Activité ancrée à droite. Squelettes de chargement étirés. Panneau « Nouveau client » centré sur la zone (`.ac`).
- **Fiche client** : colonne principale 500 + dx/2, colonne latérale (verre, notes, journal) décalée de dx/2 et élargie de dx/2 ; toast aligné sur la colonne latérale.
- Contrôle (iframes 1920×850, 2560×1080, 1440×900, 1280×720, 1000×900) : aucun élément hors scène, aucun chevauchement de textes, menu collé à gauche ; captures vues à 1920 : liste, fiche, panneau. À 1440×900 : identique à la planche.

---

## Fragment atelier-3b : Planning et Production

| Planche du canvas | Page web | Contrôles faits | Écarts | Corrigé ? |
|---|---|---|---|---|
| ErpPlanning (E39) | `maquette/atelier/planning.html` (`js/pages/atelier-planning.js`, `css/pages/planning.css`) | Mesuré : rien hors scène 1440×900, rien resté à opacity 0, pas de défilement, console propre. Joué : vues mois/semaine/jour, précédent/suivant (bornes grisées), jour libre → popover « Bloquer cette date » / Fermer, jour occupé → vue jour (28 nov. surchargé). Vu : captures mois et semaine ; comparaison aux vignettes du canvas seulement (pas de lecture plein écran). | Libellés « Livraison · n° … » tronqués en cellule (comme le canvas). | Aucun écart technique restant |
| ErpProduction (E28 + E12.f) | `maquette/atelier/production.html` (`js/pages/atelier-production.js`, `css/pages/production.css`) | Mesuré : hors scène, clip fermé, console. Joué : sélection, « Passer à Livraison », « Livrer » sans lien et avec `http://` (message d'erreur UC09.3), livraison valide (5 → 4, message « Livré… »), état Vide. | Aucun relevé. | — |

## Données harmonisées
- Planning : shootings issus de `DOSSIERS` + `SHOOTINGS` (heure, durée, étape, date) ; libellés dérivés de `DOSSIERS[].srv` + lieu (plus de table codée en dur ; « · signalé » pour un dossier soumis). Production : client, service et date de shooting depuis `DOSSIERS` ; étapes, étape en cours, dates de passage et échéances restent celles de la planche.
- Les livraisons du planning viennent des échéances de production : deux livraisons de plus que dans la planche (31 oct. n° 2026-019, 6 nov. n° 2026-031, en retard). Paiements conservés (acompte 2026-047, solde 2026-041). Le jour surchargé du 28 nov. s'appuie sur deux shootings réels. Aucun montant affiché dans ces deux pages.

## Phase 2 : navigation sans rechargement
- Pages converties au routeur : `data-module`, `data-famille="atelier"`, contenu dans `#contenu`, CSS en `data-page-css`, script `js/amorce.js`, modules `init()` / `destroy()` (destroy remet `fond.style.animation = ''`), aucun effet de bord à l'import ; ni minuterie ni écouteur global, donc `creerVie()` inutile.
- Vérifié dans Chrome : chargement à froid, clic menu Planning ↔ Production (coque persistante, entrée du menu non rejouée), Retour / Avancer, actions après navigation (popover, étape suivante, erreur `https://`), console sans erreur.

## Paramètres d'URL
- `production.html?etat=Vide` (Données par défaut) ; `?ombre=` (Alternance par défaut, Diagonale, Studio · latérale, Studio · spot, Studio · cyclo, Studio · strip, Sans) sur les deux pages.

## Points incertains
- « Bloquer cette date » sans effet (href="#", comme les planches). État non persisté entre pages : une livraison faite en production ne retire pas la ligne du planning.

## Phase 3 : pleine largeur (W logique variable, dx = W − 1440)
- Règle planning : zone de contenu x 304 → bord droit − 64 (1072 + dx). Mois : 7 colonnes égales de (1072 + dx)/7, hauteurs inchangées (calc() CSS, pas de JS). Semaine : colonnes de (1008 + dx)/7 à partir de x 364, filets horaires étirés jusqu'à 1372 + dx. Jour : cartes de largeur 720 + dx. Commutateurs de vue et légende ancrés à droite (right:64). Popover posé à côté de son jour (x = min(jour + 20, 1076 + dx)).
- Règle production : liste des shootings à gauche, largeur 572 + dx (colonnes internes ancrées à gauche et à droite) ; panneau d'étapes / livraison ancré à droite (conteneur décalé de dx, seuls ses contrôles captent la souris) ; message de retour sur la largeur de la liste.
- Vérifié par iframes même origine 1920×850, 2560×1080, 1440×900, 1280×720, 1000×900 sur les deux pages : aucun élément hors scène, aucun chevauchement de contrôles ; captures à 1920 (mois, semaine, production). 1440×900 : dx = 0, page identique à la planche.
- Correction : le popover de la dernière rangée du mois (déborde sous 900 dans la planche) est plafonné pour rester visible.

## Correctif du 12/11 : en-tête et menu non cliquables

- Cause : `#contenu` couvre toute la scène et passait au-dessus de l'en-tête du site et du menu de l'atelier (persistants, placés avant lui) ; les clics sur la navigation tombaient dans `#contenu`.
- Correctif (`css/base.css`) : `#contenu` et les enveloppes pleine scène `.fond` laissent passer les clics ; seuls leurs éléments les captent ; les calques décoratifs (`svg`, verre sans contrôle, `aria-hidden`) les ignorent.
- Vérifié (mesure `elementFromPoint`, 1920×855) : sur les 24 pages hors intro, tous les liens de l'en-tête et du menu atteignent leur cible ; tous les boutons et liens du contenu aussi ; navigation au clic sans rechargement (marqueur JS conservé), Retour compris.

## Correctif du 12/11 : compteurs de la galerie

- Les nombres de photos par catégorie (32, 10, 04…) n'avaient aucune animation, sur le canvas comme dans la maquette : ils apparaissaient d'un coup à l'arrivée et restaient visibles quand une photo est agrandie.
- Corrigé des deux côtés (Galerie.dc.html / PGalerie.dc.html et js/pages/galerie.js) : chaque nombre s'écrit (wIn) juste après son libellé, s'efface (wOut) avec le reste de la page à l'ouverture d'une photo, et se réécrit au retour.
- Vérifié dans la maquette (clip-path mesuré : caché à l'entrée, écrit après l'animation, caché en vue agrandie).

## Correctif du 12/11 : espacement des pastilles du simulateur public

- À 1440×900, les sept pastilles de zone passaient à la ligne et la dernière pastille d'option chevauchait la ligne « forfait, 2 h incluses » (défaut présent sur la planche elle-même).
- Corrigé des deux côtés : hauteur d'une ligne de prestation avec lieux 168 → 204 (SimMix.dc.html / SimPublicA.dc.html et js/pages/simulateur.js).

## Comètes morphiques (12/11) — ANNULÉ : l’effet concerne seulement les lignes animées du fond, pas les comètes des cadres ; comètes revenues au tour continu

- Les comètes (petits traits qui parcourent en continu le contour des pastilles de verre) ne tournent plus en boucle : le trait s'étire, se résorbe en boule (4 px), la boule glisse, puis se redilate en trait dans l'autre sens, six fois par tour.
- Couleur : la couleur propre de chaque comète, sauf un segment sur trois en bordeaux puis en encre (les quatre couleurs de la palette apparaissent).
- Une seule définition des deux côtés : canvas (tpl/morphe.js, appliqué aux 56 planches et à parts.json) et maquette (css/base.css). La couleur propre passe de `stroke` à `color` (lue par currentColor).

## Portage du 14/11 : surligneur, trait vagabond, zoom photo, transition entre pages (canvas v131 -> maquette)

- **Surligneur** (`js/lib/surligneur.js`, réécrit) : au repos rien n'est surligné, seule la comète tourne ; au survol la comète se fond en boule à sa position, glisse sous l'élément et se redilate en ligne (la ligne se contracte pendant le trajet, sans pause) ; à la sortie elle reste 2,5 s puis rejoint la comète. Menu du haut et ligne des services. Le balayage automatique du menu (toutes les 2,8 s) est supprimé.
- **Trait vagabond** (`js/lib/vagabond.js`, nouveau) : un seul trait d'arrière-plan, axes X/Y uniquement, opacité 0,4, derrière photos et texte ; part d'un point, se dessine, se résorbe vers son extrémité, le point glisse ou réapparaît ailleurs, couleur et axe aléatoires. Démarre après l'intro (4,6 s), masqué pendant le zoom photo. Remplace les trois traits diagonaux du canvas.
- **Zoom photo** (`js/pages/accueil.js`) : plus de voile blanc ; l'ouverture passe la page en état `out` (le fond se décompose par traits), la fermeture la redessine en rythme rapide (K = 0,2, photos en fondu direct, sans rejouer le développement). L'accroche tournante est figée pendant le zoom (sinon le nouveau texte apparaissait un instant derrière).
- **Transition entre pages** (`js/lib/routeur.js`) : le contenu sortant se décolore puis s'efface vers le blanc en 0,32 s avant que la page suivante se dessine. Écart assumé avec le canvas : l'en-tête persistant ne s'efface pas (seul `#contenu` s'efface), conformément à la règle « menu figé entre deux pages ».
- **Non vérifié dans un navigateur** (aucun serveur local lancé) : seule la syntaxe des modules a été contrôlée. À regarder en priorité : position de départ de la boule sur la comète, hauteur de la ligne sous les services, fondu du contenu au changement de page.

## Page Préciser ma journée (14/11) : PPreciser.dc.html -> maquette

- **Fichiers créés** : `maquette/preciser.html` (même squelette que les autres pages : #contenu, `data-module="preciser"`, famille « site »), `css/pages/preciser.css` (un seul `@import` de `simulateur.css`, qui contient déjà tous les composants parqués), `js/pages/preciser.js`, `js/lib/brouillon.js` (lecture et écriture du brouillon dans sessionStorage).
- **Fichiers modifiés** : `js/pages/simulateur.js` (la lecture du brouillon public passe par `lib/brouillon.js`, la création de compte vide les précisions anciennes, texte de fin), `simulateur.html` (le bouton final mène à `preciser.html` au lieu de `mes-dossiers.html`, libellé « Préciser ma journée »).
- **Réutilisé de `reserve/precision-journee/`** : tout le code du panneau (ruban 06:00 à 24:00 à poignées, heures tapées au pas de 15 min, adresses exactes, état du transport, options, prix de la prestation) et du panneau de soumission. Le dossier `reserve/` n'est pas supprimé.
- **Parcours** : simulateur, « Créer mon compte pour préciser », « Préciser ma journée », « Soumettre au photographe » (désactivé tant qu'une adresse manque), panneau de soumission, « Voir mon dossier » (`dossier.html`). Brouillon : clé `maquette.simulateur.public` (lieux sans adresse, zone) convertie en « adresse à indiquer » ; les précisions sont gardées sous `maquette.preciser.lignes` ; les deux clés sont effacées une fois le dossier soumis. Sans brouillon, l'exemple de la planche (Mariage 8 h, album, zone Namur).
- **En-tête** : « Mes dossiers » courant + bouton noir « Simuler un devis » (comme `dossier.js`). La planche affiche « Mes dossiers » dans le bouton noir ; la maquette suit la règle de l'espace client des autres pages.
- **Écarts avec la planche** :
  - la planche place les éléments en coordonnées fixes ; la maquette applique la répartition pleine largeur (`--dx`) comme le simulateur, et l'axe des heures s'étire avec la largeur (planche : 40 px par heure) ;
  - le champ « Date du shooting » est relié au brouillon (planche : champ libre non relié) ;
  - Échap ferme le panneau ouvert, le focus va sur « Fermer » à l'ouverture et revient à la fermeture (absent de la planche) ;
  - le texte de fin de soumission suit la planche ; le numéro « 2027-014 » est celui du dossier d'exemple, rien n'est créé.
- **Question de fond, non tranchée** : la planche garde, dans le panneau de soumission d'une page connectée, les champs e-mail et mot de passe (« Créez votre compte »). Reproduit tel quel pour rester fidèle ; à retirer si le client est déjà connecté ici.
- **Non vérifié dans un navigateur** (aucun serveur local lancé) : seule la syntaxe des modules a été contrôlée (`node --check`) ainsi que la logique de `brouillon.js` (essai Node avec un faux sessionStorage). À regarder en priorité : alignement des poignées du ruban et des lieux, hauteur de la zone de défilement des lignes, animation d'entrée, focus à l'ouverture du panneau, passage simulateur vers préciser sans rechargement.
