# DA Morphic — direction artistique du front PID

> **Statut :** calibrée le 2026-11-11 avec mentalyas. Ce dépôt sert uniquement à calibrer la DA ; le front réel est construit dans **PID** (Laravel + Blade, HTML/CSS/JS + jQuery imposés par le cours), en reprenant ces décisions.
> **Canvas :** https://claude.ai/artifact/L7CCM7dpQYzQMgQRaGmy4j (pages « Passe 1 · Morphic », « Intro & dashboard », « Galerie »). Les passes « Verre de mer » et « Épure » sont abandonnées.
> **Sources des planches :** `docs/front/canvas-da-morphic/` (copie des fichiers `.dc.html` du canvas).
> **Thème de référence :** projet `morphic-theme`, planche 12 (`docs/design/canvas-morphisme/Palette.dc.html`).

## 1. Objectif du site

Site générique de photographe (mariages en premier, puis engagement, famille lifestyle, anniversaires, événementiel, culinaire et studio). Entonnoir : les photos frappent l'attention → on reste → on creuse dans la galerie → on contacte ou on lance le générateur de devis de PID.

## 2. Les deux gestes du site

1. **Tracé morphique** : toute forme naît d'un point ou d'un bord, se dessine à l'échelle 1, se résorbe dans son origine. Jamais de zoom d'apparition.
2. **Développement photo** : une photo apparaît en fondu en noir et blanc puis prend sa couleur ; certaines restent volontairement en noir et blanc. Pas d'effet négatif.

Les deux s'entremêlent : le cadre se trace pendant que la photo se développe.

## 3. Règles d'animation

- **Ordre** : d'abord l'apparition (tracés, développement, écriture du texte), ensuite seulement l'animation continue, elle-même en fondu.
- **Animation continue** (le site « vit et se reconstruit ») : comètes autour des cadres et des pastilles, lignes qui se rétractent et se redessinent, trait cyan qui respire, indicateur liquide du menu.
- **Texte** : jamais de fondu. Il s'écrit (contour puis remplissage). La goutte d'encre est la tête d'écriture : elle s'étire en trait, glisse et laisse le texte derrière elle, puis l'avale en revenant (planche 12, élément 05).
- **Changement de photo** : jamais de glissière ; sortie rapide en fondu, entrée lente noir et blanc → couleur, cadre tracé lentement autour.
- **Superpositions** (photo agrandie) : jamais de voile qui glisse. Le fond se décompose (lignes, textes, photos) et se redessine ; au retour, retour rapide sans rejouer l'intro.
- **Habillage** : un composant est d'abord tracé, puis sa matière arrive en fondu lent.
- `prefers-reduced-motion` coupe toutes les animations.

## 4. Matière et couleurs

- **Fond** : blanc `#FFFFFF`, vignettage doux en CSS (0 → 27 % aux coins). Pas d'image générée pour les textures.
- **Encre** : carbone `#0D0E10`, texte secondaire `#4B4D52`. **Le texte n'est jamais coloré.**
- **Palette signature, sur les traits et les formes seulement** : cyan `#3AA6B5` (signature et position), orange `#D9783A` (notes et repères), bordeaux `#7A1F33` (traits d'accent).
- **Verre** des pastilles : airy, mat et opaque, sans grain, codé en CSS (dégradé blanc → gris chaud, flou 12 px, liseré lumineux, relief, ombre portée).
- **Boutons** : « Créer mon devis » en encre noire (recette planche 12), ombre portée marquée.
- **Profondeur** : ombre portée sur les photos, les gros titres, les pastilles et les boutons.
- **Traits** : 1,5 px, rendu géométrique précis.
- **Typographie** : Inter (300 à 600), Instrument Serif italique pour un mot d'accent, IBM Plex Mono pour les repères.

## 5. Pages calibrées

### Intro
Collage cinématique (≈ 6,5 s) : cadres tracés, photos développées en noir et blanc (certaines prennent la couleur), travelling lent, texte « Un regard, un instant, une histoire. », résorption, puis le dashboard se dessine à partir de rien. « Passer l'intro » toujours visible.

### Dashboard
- En-tête : logo + trait cyan, menu dans une pastille de verre avec indicateur liquide continu, bouton noir « Créer mon devis ».
- Accroche tournante (5 états, toutes les 8 s) : accroches et témoignages, typographies et dispositions différentes, écrites par la goutte d'encre.
- Collage dont la grille se recalcule selon le nombre et le format des photos (rangées justifiées), qui change au survol d'un service.
- Ligne des services (Nav B « index ») dans une pastille de verre.
- Toute photo s'ouvre en pleine page (cadre étiré depuis la vignette, puis rétracté).

### Galerie
- Colonne gauche : titre selon le filtre, pastille de filtres (Tout + 6 services, nombre de photos), bouton « Demander un devis ».
- Droite : flux de photos de la catégorie, **sans albums**, regroupées par événement avec une balise et une ligne de texte de mentalyas.
- Un témoignage (texte seul avec ombre portée) prend la place d'une photo à un endroit aléatoire de chaque section, et défile.
- Photo agrandie : part de sa vignette, le fond se décompose ; au ✕ la photo revient dans sa vignette et la page se redessine vite.

### Services (retenue : C · une fiche par service)
- Colonne gauche : pastille de verre avec les 6 services en chapitres (01 à 06, trait cyan qui glisse), mention « prix de départ indicatifs ».
- Centre : grande photo en portrait du service (cadre tracé, développement noir et blanc → couleur, comète).
- Droite : fiche tarif — chapitre, titre (Inter léger + mot en Instrument Serif italique), description, lignes « Forfait de base / Durée incluse / Heure supplémentaire / Trajet » sur filets tracés, encadré de verre « Exemple de simulation ≈ [prix] € », bouton noir « Simuler ma journée » (ouvre le générateur PID avec le service présélectionné) et lien vers la galerie du service.
- Changement de chapitre : la fiche se résorbe puis se réécrit, la photo sort en fondu rapide et se redéveloppe.
- Prix entre crochets : à remplir depuis le catalogue de services de PID.

### Ombres d'arrière-plan (validées)
- Calque d'ombre derrière tout le contenu, uniquement en dégradés CSS (aucune rayure, aucune image), apparu en fondu après la naissance de la page.
- Alternance sur 70 s, chaque ombre entre et sort **seulement en fondu** et dérive lentement : Diagonale (haut gauche → bas droite, atténuée), Studio latérale, Studio spot, Studio cyclo, Studio strip.
- Pas de volet glissant ni de rayures (écartés).

### À propos (retenue : A · portrait et récit)
- Gauche : grand emplacement du portrait (cadre tracé, comète), légende « Ernest H. · photographe & développeur · [Lieu] ».
- Droite : titre « Un regard *qui ne dérange pas.* », récit (autodidacte, Belgique, lumière du lieu), puis deux lignes plus discrètes qui disent que le site et son simulateur de devis ont été développés par Ernest lui-même.
- Trois piliers sur filets tracés : Lumière naturelle, L'instant vrai, Retouche discrète.
- Ligne matériel en clin d'œil : « Sony A7 IV · 24-70 mm GM · Lightroom Classic · et un éditeur de code ».
- Bouton noir « Me contacter » + lien « ou simuler un devis ». Ombres d'arrière-plan validées.
- Profil IT présenté discrètement : jamais de section « développeur » à part, seulement ces trois touches.

### Contact (retenue : B · deux portes)
- Titre « Comment voulez-vous *commencer ?* » + deux lignes : un prix tout de suite, ou d'abord une conversation.
- Deux grandes cartes de verre côte à côte, tracées puis habillées : 01 · Le plus rapide « Simuler mon devis » (photo couleur, bouton noir « Lancer le simulateur » vers le générateur PID) et 02 · Le plus personnel « Écrire un message » (photo noir et blanc, bouton contour « Écrire maintenant »).
- « Écrire maintenant » : la carte de gauche s'efface, la carte de droite s'étire sur toute la largeur (transition left/width) et devient un formulaire court (prénom et nom, e-mail, type d'événement, message, « Envoyer »). « Revenir aux deux choix » : retour rapide sans rejouer l'intro.
- Ligne de coordonnées en mono au pied de page : [e-mail] · [téléphone] · [@compte] · réponse sous [48 h].
- Dans PID : validation serveur (Form Request), jeton CSRF, consentement RGPD à ajouter au formulaire, envoi réel de l'e-mail.

### Simulateur de devis (retenu : A + C · pupitre et journée)
- Fidèle au dossier de lancement de PID : une seule page E01 + panneaux (pas de tunnel d'étapes).
- Gauche : catalogue groupé par catégorie dans une pastille de verre ; la ligne du service est elle-même cliquable, avec un petit + cerclé (pas de bouton « Ajouter »).
- Centre : la journée de 10:00 à 24:00, une rangée par prestation (bande de présence foncée pour les heures incluses, plus claire pour le dépassement facturé, lieux posés à leur heure, arc cyan vers le lieu le plus éloigné et km dans l'intitulé), puis les lignes de prix qui défilent.
- Droite : totaux HTVA / TVA 21 % / TVAC, « Soumettre mon devis » inactif tant qu'une adresse manque ; code promo ou de parrainage ; suggestion d'option.
- Panneau E01.a « Configurer ce service » (le fond se résorbe, le panneau se trace) : durée par pas de 15 min (demi-heure entamée facturée) ou quantité, date, lieux répétables sans limite (zone qui défile), options, mini-frise de la journée et prix recalculés en direct.
- Panneau E01.b « Soumettre mon devis » : récapitulatif + « Créez votre compte » (e-mail, mot de passe) ou « J'ai déjà un compte » ; « Soumission… » puis « Merci, votre dossier est en cours d'examen. » et « Voir mon dossier ».
- Transport : « Départ photographe → <lieu> : <km> », jamais l'adresse de départ. Montants de la maquette = exemples.

### Espace client · dossier (retenu : A · page à onglets, E03 de PID)
- En-tête client : « Mes dossiers » (page active) + bouton noir « Simuler un devis ».
- Titre « Votre mariage, *en cours d'examen.* », suivi des étapes Soumis → Accepté → Confirmé → Réalisé (point cyan qui pulse sur l'étape en cours).
- Encadré « Modifiable jusqu'au <date limite> » + « + Ajouter au dossier ».
- Onglets dans une pastille de verre : Devis (figé, frise de la journée, lignes, totaux), Fiches techniques (complète / incomplète, informations manquantes), Demandes, Documents (versions PDF), Parrainage (code + Copier).

### Mes dossiers (retenu : B · registre, E02 de PID)
- Gauche : titre « Vos dossiers *au même endroit.* », phrase d'aide, bouton noir « Simuler un nouveau devis », compteur « 3 dossiers · 1 en cours d'examen ».
- Droite : registre à colonnes Dossier / Étape / Total TVAC. Une ligne cliquable par dossier (→ E03) : vignette qui se développe, n°, service, date du premier shooting, jauge de 4 étapes colorée (soumis cyan, accepté orange, confirmé bordeaux, réalisé encre), total, flèche. Lignes séparées par des traits qui se tracent.
- États : chargement (squelettes qui pulsent, « Chargement de vos dossiers… »), vide (MSG05 « Vous n'avez pas encore de dossier. »).
- « Supprimer mon compte » (E02.a, UC06.7) : le fond se résorbe, le panneau se trace ; confirmation par mot de passe, « Mot de passe incorrect. » sous le champ (point bordeaux, texte encre), « Suppression… », puis « Votre compte a été supprimé. Vos données personnelles ont été effacées. » et « Retour à l'accueil ».

### Simulateur · horaires et adresses (retenu : A · ruban de la journée, 12/11)
- Le panneau « Configurer ce service » remplace les boutons − / + et les communes cliquables par un ruban de 06:00 à 24:00.
  - Bande de présence : noire pour le forfait, grise pour le dépassement.
  - Poignées : début et fin en noir, une par lieu en cyan, avec son numéro au-dessus et son heure dessous.
  - Le réglage se fait à la souris ou au clavier, et le prix change pendant le glisser.
- La poignée de début est indépendante : la fin reste fixe et la durée s'ajuste.
- Chaque lieu a un champ « Lieu n : » où l'on tape l'heure (synchronisée avec sa poignée), un champ d'adresse exacte et un état :
  - bordeaux : adresse à indiquer ;
  - cyan : distance calculée ;
  - orange : adresse notée, distance confirmée par le photographe.
- Dans PID, il faudra un vrai géocodage pour les kilomètres. La maquette ne reconnaît que la commune ou le code postal.

### Simulateur public (retenu : A · frise directe, 12/11)
- Sans compte, le visiteur fixe seulement :
  - les heures, en glissant le début et la fin sur la frise du devis ;
  - la date ;
  - la **zone** (Bruxelles, Namur, Liège, Charleroi, Mons, Anvers, Gand), jamais l'adresse ;
  - les options, en pastilles.
- Le prix affiché est « À partir de · TVAC », avec un déplacement estimé selon la zone.
- Le bouton « Créer mon compte pour préciser » enregistre un brouillon, sans rien envoyer au photographe.
- Durée minimale de 2 h partout. La séance engagement passe à 2 h incluses.
- Après inscription, l'écran connecté « Préciser ma journée » reprend le brouillon.
  - Le ruban validé (adresses exactes, lieux, heures) s'ouvre par « Préciser lieux et horaires ».
  - Le prix devient complet, avec le déplacement réel.
  - « Soumettre au photographe » reste bloqué tant qu'une adresse manque.
- Doc PID à mettre à jour : dans E01, les lieux et adresses ne se demandent plus avant la soumission, et le brouillon est conservé côté serveur après inscription.

### Parcours complet (canvas, page « Parcours complet »)
- Copies reliées des pages retenues : Intro → Accueil → Galerie, Services, À propos, Contact, Simulateur (+ soumission) → Espace client, et « Mes dossiers » → registre → dossier. Lancer « Play » sur « 1 · Intro ».

### Atelier du photographe (retenu : A · menu latéral, zone ERP E10-E40 de PID)
- Structure commune : pastille de verre pleine hauteur à gauche (240 px), menu PID complet (03-APP-FLOW §2) : Tableau de bord · Planning · Dossiers · Demandes (badge) · Clients · Production · Argent ▸ · Statistiques · Catalogue ▸ · Réductions · Parrainage · Vitrine ▸ · Réglages ▸. Un seul groupe ouvert à la fois, sous-entrées marquées d'un tiret. Entrée plus rapide que le site public (×0,45).
- E10 tableau de bord : 3 compteurs (soumis, acceptés, confirmés), « Demandes en attente », « Prochains shootings · 30 jours ». États chargement, vide MSG09, erreur MSG10.
- E11 dossiers : recherche par numéro ou email, filtres en pastilles par date de shooting et par étape (avec nombres), registre N° / client et email / prestation / shooting / étape / total TVAC, point cyan = demande en attente, 9 lignes par page. Vide : MSG11 + « Effacer les filtres ».
- E12 dossier (A · onglets retenue ; B pupitre gardée sur le canvas) : « ← Retour à la liste », jauge d'étapes, bouton « Changer l'étape » (grisé « Dossier clos » si refusé, annulé ou réalisé), onglets Devis · Fiche technique · Demandes · Messages · Paiements · Production · Documents. Devis : lignes à prix figés avec « Retirer », totaux HTVA / TVA / TVAC ; à droite demande en attente, état de la fiche, versions PDF.
- Panneaux (le fond se résorbe, le panneau se trace) : E12.a avant / après côte à côte, « Valider » ou « Refuser… » avec motif obligatoire (message de UC06.2) ; E12.b case « Appliquer des frais de retrait » + montant ; E12.c seules les transitions de R06.8, motif si refus, frais si annulation. Chaque action crée une nouvelle version PDF.
- Catalogue (E13 à E19, E29 ; Service E14, Option E16, Types de fiches E18 et Modèles de production E29 validés tels quels le 11/11) : listes Services / Options (filtre « Afficher les archivés », « Supprimer » confirmé en ligne : supprimé si jamais utilisé, sinon archivé avec le message de UC01.4) ; formulaires Service / Option à deux colonnes (libellé, description, 6 modes de prix P1-P6 avec leurs paramètres et paliers, base HTVA/TVAC, TVA propre ; à droite catégories, fiche reliée, options, transport et date limite propres, ou services qui proposent l'option) avec les messages de UC01.1 ; Catégories éditables en place (UC01.6) ; Types de fiches avec « Dupliquer » (UC02.2) ; Type de fiche : champs ordonnés (flèches haut/bas en plus de la poignée, pour le clavier), obligatoire, types R02.4, groupe répétable ; Modèles de production : étapes ordonnées, Livraison toujours dernière, services reliés avec délai en jours.
- Clients, planning, production validés le 11/11 (« le reste c’est parfait »).
- Clients (E25, E26, E26.a) : liste avec filtres client / prospect, étiquette, origine et recherche ; panneau « Nouveau client » (email, nom, devis composé avec le catalogue, « Créer le dossier » ; email connu → « Ce client existe déjà », dossier créé sur son compte) ; fiche avec origine, étiquettes, dossiers, simulations envoyées et consentement, notes privées, journal des échanges (message de UC08.3).
- Planning (E39) : vues mois, semaine, jour ; shootings colorés par étape (soumis seulement signalé), dates bloquées hachurées, livraisons et paiements en pastilles cerclées, jour « surchargé » ; clic sur un jour libre → « Bloquer cette date », sur un jour occupé → vue jour.
- Production (E28) : shootings non livrés triés par échéance, « En retard » bordeaux, « Échéance proche » orange ; à droite les étapes du shooting (E12.f) avec « Passer à … », puis lien de livraison https:// et « Livrer » (message de UC09.3).
- Argent et statistiques (E30, E31, E32) : modèles d’échéancier (échéances en % ou montant fixe, moment en pastilles, jours si avant ou après le shooting, rappels avant et après retard, services reliés, aperçu sur un dossier de 1 000,01 € TVAC, message de UC10.1) ; chiffres (période mois / trimestre / année / dates libres, HTVA ou TVAC, CA signé, CA encaissé, reste à percevoir avec échéances dépassées d’abord, prévisionnel par mois en barres) ; statistiques (4 familles de R11.1 en tableau et graphique, comparaison avec l’an passé, « — » sans données, point cyan = mieux, point orange = moins bien, export CSV, MSG19).
- E24 demandes : la plus ancienne d'abord, « Traiter » ouvre E12.a sur place, « Traitées récemment » dessous.

## 6. Reste à faire

- [x] Page services (structure C retenue, ombres validées)
- [x] Page à propos (structure A retenue)
- [x] Page contact (structure B retenue)
- [x] Simulateur de devis (A + C retenu) et soumission avec création de compte
- [x] Espace client · dossier (A retenu)
- [x] Parcours complet relié sur le canvas
- [x] Mes dossiers (B retenu, avec suppression du compte)
- [x] Atelier : structure A, E10, E11, E12 (+ E12.a-c), E24
- [x] Atelier : catalogue (E13 à E19, E29)
- [x] Atelier : clients, planning, production (E25, E26, E26.a, E28, E39)
- [x] Atelier : argent et statistiques (E30, E31, E32)
- [ ] Atelier : Réductions, Parrainage, Vitrine, Réglages (dont Origines et étiquettes E27, Capacité E40).
- [ ] Écrans encore non dessinés : fiche technique (UC02.3), Ajouter au dossier (E03.f), connexion seule.
- [ ] Version smartphone.
- [ ] Remplacer photos, textes entre crochets et témoignages par les vrais contenus (dans PID).
- [ ] Mettre à jour `PID/docs/PALETTE.md` et `PID/docs/UI-DESIGN.md` (anciens tons crème et bronze).
