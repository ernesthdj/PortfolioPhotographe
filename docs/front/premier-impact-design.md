# Premier impact — choix validés

> **Sujet :** geste d'ouverture et parcours du site sur smartphone
> **Date :** 2026-10-29
> **Statut :** direction validée (sondes 1 à 4). Le parcours complet attend sa validation avant tout code.
> **Artifacts :**
> - Sonde 1, 8 directions : https://claude.ai/artifact/3TTSF1kz3YTzXUDFgqeC5p
> - Sonde 2, croisements : https://claude.ai/artifact/7qk78FHfKg4aaVNpBKN6Z4
> - Sonde 3, smartphone : https://claude.ai/artifact/PqJXERAmPoHfb3T6vTuU68
> - Sonde 4, finalistes : https://claude.ai/artifact/3dverzdnjoxLLyraUbzqzQ

## 1. Direction retenue

Trois finalistes gardés en sonde 4, qui forment un seul parcours dans l'ordre de lecture :

| Ordre | Chapitre | Finaliste | Geste |
|---|---|---|---|
| 1 | Ouverture | **A · La couverture se soulève** | L'album arrive fermé (« ERNEST H. », « Céline & Daniel »). Le premier glissement vers le haut soulève la couverture. |
| 2 | La journée | **D · Les moments en volets** | Le fil 05H → 23H descend. Quand on arrive sur un moment, ses 3 photos se redressent. |
| 3 | Galerie | **F · Le tirage** | La planche contact défile. À chaque rangée, la vue choisie sort et monte en grand tirage en haut de l'écran. |
| 4 | Devis | Prolongement des volets | Les 3 formules se redressent l'une après l'autre (Event unique 350 €, Demi-journée 650 €, Journée complète 1 250 €). |
| 5 | Contact | Retour de A | L'album se referme : fin du parcours, appel à écrire. |

**Principe :** le défilement du pouce pilote les animations. Pas de lecture automatique imposée au visiteur, pas d'interaction réservée au survol.

### Évolution (même jour) : le site entier devient le calepin

Retour de mentalyas sur le parcours dessiné : garder la structure smartphone, ne garder que le thème du calepin, et **chaque page du calepin est une page du site**. Les volets (D) et le tirage (F) ne sont plus des scènes autonomes, ils inspirent le contenu des pages.

| Page du carnet | Page du site | Contenu |
|---|---|---|
| Couverture | Accueil | Couverture de verre bleu nuit cannelé, élastique cyan, fenêtre photo, titre, bouton « Ouvrir le carnet » |
| 01 | La journée | Fil 05H → 23H, 4 photos scotchées |
| 02 | Galerie | Grand tirage à marge blanche + planche contact 3×3, la vue choisie entourée au crayon |
| 03 | Devis | 3 formules (arc de la part de journée), distance, estimation, « Demander ce devis » |
| 04 | Contact | Témoignage, formulaire, adresse e-mail à copier, Instagram |

**Technique retenue :** pages en vrai HTML tournées en 3D CSS (`rotateX` autour de la reliure du haut, faces avant et arrière en `backface-visibility: hidden`). Le défilement aimanté (`scroll-snap`) fait tourner une page par écran, et des onglets sur la droite permettent d'aller directement à une page. Le texte reste net et le formulaire utilisable, et la technique se reporte telle quelle dans Next.js. Le rendu canvas des sondes est abandonné pour le site.
**Maquette :** https://claude.ai/artifact/9Y4ta1n5Rxav5Wmr6ooWur (version 3, retenue par mentalyas le 2026-10-30 ; palette, photos réelles et ordinateur restent ouverts).

### Formats d'écran (2026-10-30)

Une page se conçoit sur la **zone visible**, pas sur l'écran complet : sur iPhone, les barres prennent environ 190 px. L'ancien cadre (388×840, ratio 2,17) montrait environ 140 px de carnet en trop.

- **Référence :** 390×664 (iPhone 12 à 14, ratio 1,70), soit un carnet de 346×616.
- **Contrôle :** les 11 formats du simulateur, de 375×553 à 412×839. Résultat au 2026-10-30 : aucun débordement ni chevauchement sur les 55 combinaisons page × format, dans Chrome.
- **Règles de mise en page :** rien ne croise l'élastique ; les photos partagent la hauteur disponible, sans hauteur fixe ; les consignes restent sur la feuille.
- **Carnet de moins de 560 px de haut :** le témoignage, le sous-titre et le détail du calcul du devis disparaissent (requête de conteneur sur le carnet).
- **Champs de formulaire :** 16 px, pour éviter le zoom automatique de l'iPhone.
- **À vérifier :** rendu réel sur un iPhone sous Safari, barre flottante d'iOS 26 comprise.

Sources : Statcounter Belgique (septembre 2026) pour la part des écrans, profils d'appareils Playwright 1.64.1 pour les zones visibles. Les zones Android autres que Pixel sont estimées avec les 76 px perdus sur Pixel.

## 2. Comportements

- **Défilement :** la progression suit le doigt avec un léger amorti. Elle garde son élan au relâchement et ne saute jamais par paliers.
- **Mise en page mobile :** texte en HTML dans le tiers haut de l'écran (titre Sora fine + un mot en Archivo Black, légende IBM Plex Mono). Scène animée dans les deux tiers bas, sous le pouce.
- **Ordinateur :** le même parcours, dans un cadre de téléphone centré et collant. Un rail des chapitres sur le côté.
- **Animations réduites** (`prefers-reduced-motion`) : on garde les fondus et on coupe les grands mouvements. Chaque chapitre est montré dans un état fixe lisible.
- **Performances :** un seul canvas actif, mis en pause hors écran. Aucun `backdrop-filter` animé.

## 3. Tokens (signature « verre aérien »)

```css
:root { /* jour · Glace */
  --bg:#F4F8FC; --bg-2:#E8EDF5; --halo-1:#BFE8FB; --halo-2:#E9DEFB;
  --ink:#1B2230; --muted:#4A5363; --line:rgba(27,34,48,.14);
  --accent:#2EA8E6; --accent-ink:#0B6D9C; --wire:#1B2230;
  --font-title:"Sora"; --font-strong:"Archivo Black"; --font-brand:"Michroma";
  --font-body:"Geist"; --font-label:"IBM Plex Mono"; --font-data:"VT323";
}
:root[data-theme="dark"] { /* nuit · Nébuleuse */
  --bg:#060A15; --bg-2:#0B1222; --halo-1:#1F2C52; --halo-2:#0D3B4C;
  --ink:#E8F1FF; --muted:#9AA6BB; --line:rgba(232,241,255,.14);
  --accent:#7DD3FC; --accent-ink:#7DD3FC; --wire:#DCE8FA;
}
```

`--accent-ink` sert au texte en accent (le cyan `#2EA8E6` sur fond clair ne passe pas l'AA en texte).

## 4. Choix écartés

| Direction | Note | Raison |
|---|---|---|
| Entrer par l'objectif (S1-C) | Bof | Seule direction non gardée en sonde 1. |
| Bobine verticale, globe au pouce, planche → bobine (S3) | Bof | Moins forts que l'album et les volets sur un écran vertical. |
| Bague de mise au point (S3-E) | Écartée | Piloter la netteté au défilement ne convainc pas. |
| Soleil qui monte (S3-F) | Non notée | Sortie faute de note. |
| Album de planches, volets qui se tournent, arbre (S4) | Bof | Redondants avec A, D et F. |
| Page complète éditable (essai initial) | Rejetée | « Pas convaincu » : on part du geste, pas du détail. |

## 5. Questions ouvertes

1. **Palette :** les sondes utilisent la signature cyan. Le `CLAUDE.md` du projet fixe une palette crème et bronze. Laquelle garder pour le site final, ou faut-il un mélange (fil de fer bronze sur crème) ?
2. **Photos réelles :** le fil de fer est un langage de sonde. Les cadres recevront les photos Cloudinary : faut-il garder un liseré fil de fer autour, ou des photos pleines ?
3. **Accueil sur ordinateur :** reprendre le cadre de téléphone, ou une version plein écran du même parcours ?
