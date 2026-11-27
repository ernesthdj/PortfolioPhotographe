# Cartographie des emplacements photo (état du 2026-11-27)

> Inventaire de TOUT ce qui affiche une photo sur la maquette (`maquette/`), PC et mobile : où, combien, comment la photo est choisie, et ce qui est déjà branché sur le CMS.
> Vocabulaire : **emplacement** = un endroit du site qui reçoit des photos ; **cadre** = un rectangle de photo à l'intérieur d'un emplacement ; **placement** = une photo posée dans un emplacement (ce que le CMS appellera « objet photo »).

## 1. Ce qui est déjà branché sur le CMS (phases 4 et 5)

Manifeste = `photos[]` (la photothèque) + `slots{}` (emplacements nommés → liste d'identifiants) + `events[]` (séries de la galerie).
Clés actuelles et limites (`api/_lib/manifest.ts`, dupliquées dans `js/admin/placement.js`) : `intro` (5), `accueil:0..5` (6 chacun), `service:0..5` (1 chacun) ; séries : 20 max, 200 photos chacune.
Le site traduit les identifiants en indices dans `PHOTOS` (`data/cms.js` → `data/cms-fusion.js` → `choixCms()`), les pages gardent leur logique par indice.

## 2. Site PC

| # | Page | Emplacement | Nb de cadres | Comment la photo est choisie | Branché CMS |
|---|------|-------------|--------------|------------------------------|-------------|
| P1 | Intro (`index.html`, `intro.js`) | Collage d'ouverture | **5 cadres fixes** : positions et formats en dur (portrait 240×360, paysage 420×180, portrait 200×300, paysage 400×172, portrait 220×330). La photo est recadrée (cover) | par rang dans `COLLAGE` | oui, `intro` (par rang) |
| P2 | Accueil (`accueil.js`) | Collage qui change selon le service survolé | **variable (3 à 6)** : mosaïque justifiée calculée (`rectsMosaique`) d'après le ratio réel de chaque photo | `SERVICES[i].set` (indices en dur) | oui, `accueil:0..5` |
| P2b | Accueil | Légendes du collage | 5 mots en dur (`CAPS` : Les mariés, Plein air, Le balcon, Complicité, Instant), noir & blanc en dur une photo sur deux (`i % 2`) | en dur | non |
| P3 | Galerie (`galerie.js`) | Séries d'événements + visionneuse | **variable** : séries de n photos, légende = titre de la série | `EVT` (7 séries de test) | oui, `events[]` (remplace tout) |
| P4 | Services (`services.js`) | Photo de la fiche de chaque service | 1 par service (6) | dégradé de couleur, **aucune vraie photo** | non |
| P5 | À propos (`apropos.html`) | Portrait du photographe | 1 (420×620) | dégradé, **aucune vraie photo** | non |
| P6 | Contact (`contact.html`) | Deux portes : `#g-photo` (mariage) et `#d-photo` (portrait) | 2 | dégradés | non |
| P7 | Mes dossiers (`mes-dossiers.js`) | Vignette de chaque dossier client | 1 par dossier | dégradé | hors CMS (données client) |

## 3. Site mobile (`m/`)

| # | Écran | Emplacement | Nb de cadres | Comment la photo est choisie | Branché CMS |
|---|-------|-------------|--------------|------------------------------|-------------|
| M1 | Intro (`intro.js`) | Plan défilant 390×1120 | **5 cadres fixes** (position, taille, délai, « finit en couleur » en dur) | par rang dans une liste d'identifiants | oui, `intro` (par rang) |
| M2 | Accueil (`accueil.js`) | Photos réparties dans la page : 1 grande, une rangée de 2, 2 pleines | **5 fixes**, rattachées à 2 séances (Mariage ×3, Engagement ×2) avec légendes en dur | identifiants en dur (château, bouquet, baiser, grand-champ, champ) | partiel : `accueil:0` (3 premières) et `accueil:1` (2 premières) seulement si assez fournies |
| M3 | Services (`services.js`) | Photo de la fiche | 1 par service | `PHOTOS[80+n]` | oui, `service:N` |
| M4 | Galerie (`galerie.js`) | Séries + citation intercalée | variable | `EVT` | oui, `events[]` (le « Tout » prend les 3 premières photos de chaque série) |
| M5 | Contact (`contact.js`) | 2 photos (baiser, château) | 2 | identifiants en dur | non |
| M6 | À propos (`apropos.js`) | Portrait | 1 | dégradé | non |

## 4. Ce que cette carte montre

1. **Deux familles d'emplacements** : *adaptatifs* (accueil PC, galeries : le nombre de photos change la mise en page tout seul) et *à cadres fixes* (intro PC et mobile, accueil mobile, services, contact, à propos : la mise en page attend un nombre précis de photos).
2. **Six emplacements ne sont pas branchés** : services PC, à propos (PC et mobile), contact (PC et mobile), légendes de l'accueil.
3. **Rien ne s'« habille » aujourd'hui** : légende, noir & blanc / couleur, recadrage, ordre d'apparition sont codés en dur dans les pages. Le manifeste garde un point focal (`fx`, `fy`) par photo mais aucune page ne le lit.
4. **La structure est répétée à 3 endroits** (limites dans `manifest.ts`, dans `placement.js`, ensembles par défaut dans chaque page). Un registre unique des emplacements éviterait les écarts.
