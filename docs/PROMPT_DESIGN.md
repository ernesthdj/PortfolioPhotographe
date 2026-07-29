# Prompt — Session Design (Claude Design)

> À copier-coller dans Claude Design. Attacher en pièces jointes 4-6 photos réelles de la
> galerie "Vœux éternels" (ex: le couple devant le château, la scène avec les chevaux,
> une photo N&B de préparatifs, la photo avec le flou de mouvement des invités) pour que
> l'outil extraie la vraie palette/texture de ces photos plutôt que de deviner.

---

Je suis photographe de mariage (photojournalisme événementiel, lumière naturelle,
retouche discrète). Je veux un site vitrine personnel sur mesure pour remplacer mon
Adobe Portfolio actuel, avec un effet "wahou" qui donne envie de me contacter
immédiatement.

## Cible
Futurs mariés en recherche de photographe pour leur mariage.

## Ambiance recherchée
Mon style photo varie selon les mariés (parfois très cinématique/dramatique, parfois
très épuré/doux) — le site ne doit donc pas imposer "un" style photo mais rester un
cadre neutre et confiant qui met en valeur n'importe laquelle de mes photos. Direction :
**structure épurée et éditoriale** (beaucoup d'espace négatif, typographie soignée,
grille sobre) combinée à des **moments cinématiques ponctuels** (hero plein écran,
transitions de scroll marquées, micro-animations) aux endroits clés — jamais partout,
pour ne jamais faire concurrence aux photos.

## Palette
Neutre chaud : fond crème/sable cassé (pas de blanc pur), texte encre foncée (pas noir
pur). Analyse les photos jointes et propose une palette précise (hex) qui prolonge
naturellement leurs tons chauds/désaturés (golden hour, vert olive, beige, peau) plutôt
qu'une palette générique. Zéro couleur d'accent criarde — si un accent est nécessaire,
qu'il reste discret (ex: doré éteint, terracotta doux).

## Typographie
Une serif élégante et fine pour les titres (esprit éditorial/mariage haut de gamme,
intemporel), associée à une sans-serif sobre et très lisible pour le texte courant.

## Photos de référence (style à respecter, pas à imiter servilement)
Golden hour marqué, contre-jours doux, grade couleur désaturé/filmique (jamais
saturé/criard), mix photos couleur et noir & blanc (le N&B pour les moments intimes :
préparatifs, regards ; la couleur pour les scènes en extérieur), composition
documentaire assumée (flou de mouvement, moments volés plutôt que posés), décors
champêtres (chevaux, champs, château).

## Contenu clé à intégrer dans les maquettes
1. **Hero** — accroche immédiate, impact visuel fort, une photo signature en plein écran
2. **Galerie** — mes meilleures photos de mariage, mise en page qui laisse respirer chaque image
3. **Simulateur de devis** — 3 formules (Event unique, Demi-journée, Journée complète)
   + calcul automatique des frais de déplacement selon la distance — doit donner
   confiance et lever la friction du prix, pas juste être un formulaire austère
4. **À propos** — présentation courte, personnelle, qui installe la confiance
5. **Contact** — simple, direct, peu de friction

Structure exacte des pages (one-page scroll vs multi-pages) : ouverte, propose ce qui
sert le mieux l'effet "wahou" et la conversion pour ce contenu.

## Animations
Framer Motion : scroll reveals, transitions douces entre sections, hero avec parallax
léger ou fade cinématique à l'arrivée sur le site. Rien de gadget — chaque animation
doit servir l'émotion, pas distraire de la photo.

## Contraintes techniques (pour info, n'impacte pas le design)
Le site final sera développé en Next.js + Tailwind CSS + Framer Motion, déployé sur
Vercel. Les maquettes doivent rester réalisables avec cette stack (pas de dépendance à
des effets impossibles à reproduire en CSS/React).

## Livrable attendu
Propose 2-3 directions visuelles distinctes (variations de mise en page/ambiance dans le
cadre défini ci-dessus), pour que je puisse choisir celle qui me tape le plus à l'œil
avant de passer à l'implémentation.
