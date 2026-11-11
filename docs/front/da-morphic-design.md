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

## 6. Reste à faire

- [x] Page services (structure C retenue, ombres validées)
- [x] Page à propos (structure A retenue)
- [x] Page contact (structure B retenue)
- [ ] Entrée du générateur de devis.
- [ ] Version smartphone.
- [ ] Remplacer photos, textes entre crochets et témoignages par les vrais contenus (dans PID).
- [ ] Mettre à jour `PID/docs/PALETTE.md` et `PID/docs/UI-DESIGN.md` (anciens tons crème et bronze).
