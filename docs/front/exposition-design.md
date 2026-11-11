# L'Exposition — structure PC validée

> **Sujet :** structure et navigation du site sur ordinateur
> **Date :** 2026-10-30
> **Statut :** structure, parcours et pages verrouillés par mentalyas le 2026-10-30 (« on peut vérouiller tout ca »). Remplace les directions smartphone de `premier-impact-design.md` comme point de départ. Étape suivante : habillage (passe 4 du canvas).
> **Canvas :** https://claude.ai/artifact/UnNg5Jf4wDC1KVhRsGL6h2, planche **I · L'Exposition** (`project/Exposition.dc.html`)

## 1. Concept

Le site est une exposition photo. On traverse une galerie, on arrive face à un long mur, et ce mur est le site : chaque page est un endroit du mur.

Né du croisement de deux structures de la passe 1 : C · Le Couloir devient l'introduction, A · La Table devient le mur.

## 2. Parcours

| Ordre | Moment | Comportement |
|---|---|---|
| 1 | Intro | Le couloir 3D est abandonné (2026-10-30) au profit du mouvement de la planche A · La Table : vue d'ensemble du mur, tirages de travers, puis zoom pendant qu'ils se redressent. Environ 3,5 s. Bouton « Passer l'intro » visible dès le début. |
| 2 | Accueil | Sélection de photos de mariage autour du logo. Les spots s'allument un par un, puis le logo apparaît. |
| 3 | Menu | Une banderole horizontale descend discrètement en haut de l'écran, une fois les spots allumés. |
| 4 | Navigation | Vol de caméra en 2D : léger recul, déplacement sur le mur, puis retour à l'échelle normale. Un repère doré sous la banderole indique la position sur le mur. Les spots s'allument à l'arrivée, puis le texte apparaît. |

## 3. Le mur, de gauche à droite

| Position | Contenu |
|---|---|
| Accueil | Logo et sélection de photos. Cliquer sur une photo mène à la Galerie. |
| Galerie | Parcours latéral des couples, une toile de groupe par mariage. Chaque toile mène à sa mosaïque. |
| Devis | Emplacement réservé : mentalyas développe à part un moteur générateur de devis, qui viendra s'intégrer ici. Pas de maquette de devis d'ici là. |
| À propos | Portrait et texte sur le mur, puis trompe-l'œil : une barre de défilement apparaît et on descend vers les articles avec photos, le fond restant celui du mur. |
| Contact | Formulaire posé sur une toile sur châssis, accrochée au mur. |

La banderole contient Ernest H. (retour à l'accueil), Galerie, Devis, À propos, Contact, puis Espace client et Instagram en discret.

**Objets sur la table (2026-10-30) :**

- **Contact :** enveloppe de vieux papier avec un sceau, encrier et plume à côté. Au clic, la lettre sort de l'enveloppe et devient le formulaire.
- **Devis :** dossier qui s'ouvre sur les formulaires du moteur de devis.
- **À propos :** objets de décor personnels, appareil photo, flash, pellicules, clés USB.
- **Album :** page intérieure en texture de papier d'album.

## 4. Galerie

Reprend le contenu de `docs/modules/GALERIE.md` (un mariage, ses photos, son témoignage), mais pas son carrousel ni le passage photo par photo : le client ne doit pas être obligé de voir les photos une à une.

- **Couples :** le déplacement latéral sert à passer d'un couple à l'autre. Chaque couple est une toile sur châssis portant une photo de groupe, avec nom, informations et témoignage à côté.
- **Section albums :** les albums sont regroupés côte à côte dans une seule zone de la table, le parcours latéral par couple est abandonné pour économiser l'espace.
- **Toutes les photos s'ouvrent en grand :** tirages de l'accueil, portrait, articles et mosaïque.
- **Album (remplace la toile, 2026-10-30) :** chaque couple est un album fermé posé sur la table. Au clic, la couverture s'ouvre, la caméra entre dans la page et on se retrouve dans la mosaïque, à l'intérieur de l'album.
- **Mosaïque :** toutes les photos du mariage. Le client a une vue globale du reportage.
- **Agrandissement :** cliquer sur une photo l'ouvre en grand, avec précédente, suivante et fermeture.
- **Barre basse :** visible seulement dans la galerie. Choix du couple, flèches entre couples, puis dans la mosaïque « Retour aux couples » et « Demander un devis ».

## 5. Règles issues des retours

- **L'entrée est une intro automatique**, pas pilotée à la molette : le défilement prêterait à confusion. Elle se joue à la première visite, puis on arrive directement devant le mur (choix par défaut, à corriger si besoin).
- **Contact :** composition 1, le formulaire sur toile (choix par défaut, les compositions 2 et 3 n'ont pas été retenues).
- **Logo en attente** : on garde un texte provisoire, on va du macro vers le micro.
- **Pas de zoom dans les œuvres** (« c'est trop grand ») : on reste à la même distance du mur.
- **Transitions sans coupure** : le déplacement de caméra remplace tout changement de page.
- **Caméra pilotée uniquement par le menu (2026-11-02) :** aucun glisser à la souris, aucun zoom à la molette ni par boutons. L'utilisateur clique dans la banderole, sur un album ou sur une photo, et l'animation conduit la scène au bon endroit. La carte en bas à droite n'est qu'un repère de position, pas un moyen de navigation. Garde-fou appliqué sur la planche Parcours du canvas (version 46).
- **Vol de caméra en glissade (2026-11-02) :** le déplacement entre deux endroits du mur est une translation pure à l'échelle 1, sans recul ni rapprochement. Durée proportionnelle à la distance, entre 0,8 et 1,8 s. Le recul et le zoom n'existent plus que dans l'intro et à l'ouverture d'un album.
- **Le mur est l'accueil**, la page Mariages n'est pas la page d'arrivée.
- Règles antérieures toujours valables : de l'air, une photo à la fois, interface nette, fondu réservé au contour des photos.

## 6. Matière du mur

**Abandonné le 2026-10-30 :** le velours vert et les cadres dorés (« on oublie »), décrits ci-dessous pour mémoire. Le mouvement de la table est conservé, l'habillage est à redéfinir. Seule règle qui reste : pas d'aplats dessinés en CSS (« du vectoriel, ça fait cheap »).

**Ancienne direction :** mur en tissu vert sapin sombre, mêlant le tissage du lin et le reflet du velours, avec des cadres dorés et une marge crème.

- **Référence du mur :** https://www.canva.com/M/MAHZgMSLeUc (image générée, à télécharger en pleine taille).
- **Référence des cadres :** https://www.canva.com/M/MAHZgMpJTjs (velours vert et cadres dorés).
- **Répétition :** séparer le tissu et la lumière, les spots étant ajoutés sur le site pour chaque cadre.
- **Maquette :** velours, cadre doré et lampe de tableau sont extraits de l'image de référence téléchargée par mentalyas (1680×944). Le velours et le parquet sont des carreaux raccordables de 2048 px affichés à 1024 px. Le cadre reste de la résolution maquette, à refaire en haute définition avant le portage. Les photos affichées sur le mur sont des exemples générés par IA, à remplacer par les vraies.

L'enduit à la chaux de la passe 3 et les directions 1 à 4 de la passe 4 sont abandonnés.

**Essai de table en bois (2026-11-02) :** planches sombres fournies par mentalyas (image générée). Préparation : vignettage aplani, carreau coupé sur deux rainures de planches pour que le raccord vertical tombe dans un joint, raccord horizontal fondu dans le fil du bois sur 420 px. Un premier carreau en miroir a été écarté, la symétrie des nœuds se voyait. Posé sur la planche Parcours, à juger. **Retour :** animation validée (« top »), fond pas convaincant.

**Passe 6 · Fonds de table (2026-11-02) :** six matières générées via Canva (chêne clair brossé, feutre anthracite, cuir patiné, béton ciré, lin crème, ardoise noire), exportées en 2048×1024, raccords fondus. Chaque planche a un réglage « light » dans le panneau de propriétés : spot chaud, rasante, diffuse, deux spots, froide. Matière et lumière se notent séparément en commentaire sur le canvas. Le CLI Higgsfield est installé mais pas encore connecté au compte.

**Choix du 2026-11-02 (commentaire canvas) :** mentalyas retient le Fond 5 · Lin crème (« j'aime bien ce modèle ») et demande à le voir en pleine animation. Appliqué sur la planche Parcours : lin crème, lumière rasante, encre sombre (#1E1610, textes secondaires #4A3F33). Les autres matières restent sur la passe 6 pour comparaison.

**Résolution des matières (2026-11-02) :** retour « pixélisé ». Cause : le générateur plafonne vers 2048 px (un export 4096 n'apporte aucun détail) et un carreau affiché à sa taille native est étiré sur les écrans haute densité. Règle : générer la matière en gros plan (fil de lin à 28 px au lieu de 6) et l'afficher réduite, ici 768 px pour un carreau de 2048, soit 2,7 px d'image par px CSS. Export PNG sans perte, WebP qualité 95. À appliquer à toute matière retenue avant le portage.

**Essai mur crème (2026-11-02) :** après le lin (jugé « pas mal », carreau réduit jusqu'à 512 px), mentalyas demande un mur crème avec ombrage et lumière studio en mouvement. Enduit à la chaux généré en macro, lumière aplanie, carreau 2048 affiché à 1024 px. Éclairage : une lumière principale chaude qui dérive lentement (26 s, aller-retour), une lumière d'appoint froide plus lente (34 s), un ombrage statique haut et bas plus vignettage. Tout en transform GPU, aucun filtre ni mode de fusion animé. Ombres des tirages portées en bas à droite. Planche Fond 7 sur la passe 6 et appliqué au Parcours.

**Décision du 2026-11-02 : plus d'images Canva** (« dégueulasses »). Le mur est désormais généré par code : `scripts/textures/mur_chaux.py` (numpy, sans IA). Champ de hauteur en bruits périodiques multi-échelle par convolution FFT, donc carreau sans couture par construction, passes de truelle par flous anisotropes orientés, piqûres rares, éclairage par normales (Lambert + ambiant, lumière haut-gauche), albédo crème avec dérive de teinte et occlusion légère dans les creux. Première version trop rugueuse (crépi) corrigée : grain réduit, ondulations larges augmentées, contraste d'éclairage adouci. Sortie 2048×1024 WebP qualité 92, affichée à 1024 px. Reproductible par graine. Cette règle remplace « pas de matière procédurale » : ce qui était rejeté, c'est le plat vectoriel CSS, pas un relief calculé et éclairé.

## 7. Restant à décider

- Contenu des articles d'À propos.
- Vitesse du trajet Accueil → Contact, le plus long du mur.
- Nombre de photos par mariage, qui fixe la longueur du mur.
- Version smartphone de ce concept.
- Habillage : textures, couleurs, typographie, logo réel.
