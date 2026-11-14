# Maquette statique : site d'Ernest H. et « l'atelier »

Traduction web (HTML/CSS/JavaScript, sans framework ni build) des planches validées du canvas « DA Morphic ».
Chaque page est conçue en 1440 × 900 puis mise à l'échelle et centrée dans la fenêtre (sans déformation).
Aucune donnée n'est envoyée : pas de requête réseau hors polices Google Fonts, aucun formulaire ne se soumet, aucun mot de passe n'est stocké. Toutes les données sont factices.

## Lancer en local

```
cd maquette
python -m http.server 5173        # ou : npx --yes serve . -l 5173
```
Puis ouvrir http://localhost:5173/ (l'intro). Les modules ES exigent un serveur HTTP (pas d'ouverture directe du fichier).
Déploiement Vercel : `vercel.json` active `cleanUrls` (dossier racine du projet Vercel = `maquette/`, projet `portfolio-maquette`). `404.html` est la page d'erreur servie pour toute adresse inconnue (autonome : sans scène ni script).

## Carte des pages

| Planche du canvas | Page |
|---|---|
| PIntro | `index.html` (débouche sur l'accueil à 6,4 s ; « Passer l'intro », « Rejouer l'intro ») |
| PAccueil | `accueil.html` |
| PGalerie | `galerie.html` |
| PServices | `services.html` |
| PApropos | `apropos.html` |
| PContact | `contact.html` |
| PSimulateur (+ soumission) | `simulateur.html` |
| PPreciser | `preciser.html` (espace client : « Préciser ma journée », reprend le brouillon du simulateur) |
| PMesDossiers (+ suppression du compte) | `mes-dossiers.html` |
| PDossier | `dossier.html` |
| ErpAtelier | `atelier/tableau-de-bord.html` |
| ErpDossiers / ErpDossier | `atelier/dossiers.html` / `atelier/dossier.html` |
| ErpDemandes | `atelier/demandes.html` |
| ErpServices / ErpService | `atelier/services.html` / `atelier/service.html` |
| ErpOptions / ErpOption | `atelier/options.html` / `atelier/option.html` |
| ErpCategories | `atelier/categories.html` |
| ErpFiches / ErpFiche | `atelier/fiches.html` / `atelier/fiche.html` |
| ErpModeles | `atelier/modeles.html` |
| ErpClients / ErpClient | `atelier/clients.html` / `atelier/client.html` |
| ErpPlanning / ErpProduction | `atelier/planning.html` / `atelier/production.html` |

Planches exclues (entrées de menu et liens désactivés : `aria-disabled="true"`, grisés, infobulle « Bientôt disponible », sans lien) : ErpDossierPupitre, ErpTable, ErpRegie, ErpEcheanciers, ErpChiffres, ErpStats et les entrées de menu non dessinées.
L'atelier s'ouvre depuis le site par « Voir le site » dans l'autre sens ; il n'y a pas de lien du site vers l'atelier (comme dans le canvas) : ouvrir `atelier/tableau-de-bord.html`.

## Options de planche (paramètres d'URL)

Valeurs par défaut = celles du canvas. Insensibles à la casse et aux accents.

| Page | Paramètres |
|---|---|
| toutes | `?ombre=Alternance` (défaut) · `Diagonale` · `Studio · latérale` · `Studio · spot` · `Studio · cyclo` · `Studio · strip` · `Sans` |
| `atelier/tableau-de-bord.html` | `?etat=Données` (défaut) · `Chargement` · `Vide` · `Erreur` |
| `atelier/dossiers.html` | `?etat=Données` · `Chargement` · `Aucun résultat` |
| `atelier/dossier.html` | `?panneau=Aucun` · `Traiter la demande` · `Retirer une ligne` · `Changer l’étape` |
| `atelier/demandes.html` | `?etat=Données` · `Vide` |
| `atelier/services.html`, `atelier/options.html` | `?etat=Données` · `Chargement` · `Vide` |
| `atelier/service.html`, `atelier/option.html` | `?tva=Réglée` · `Non réglée` |
| `atelier/clients.html` | `?etat=Données` · `Chargement` · `Vide` ; `?panneau=Nouveau client` |
| `atelier/production.html` | `?etat=Vide` |
| `simulateur.html` | `?exemple=Vide` (défaut) · `Mariage posé` |
| `mes-dossiers.html` | `?etat=Avec dossiers` · `Chargement` · `Vide` |

## Navigation sans rechargement (AJAX)

Un clic sur un lien interne (même origine, sans modificateur clavier, sans `target`, hors ancre seule) charge la page cible en `fetch`, remplace uniquement `#contenu` et laisse en place la partie persistante : l'en-tête du site public, ou, dans l'atelier, le menu latéral et ses ombres (le menu ne met à jour que l'entrée active et le badge ; son entrée animée ne se joue qu'au premier chargement). `history.pushState` et `popstate` (Retour / Avancer), titre mis à jour, focus sur le titre principal (`h1`), retour en haut. Le contenu sortant se résorbe (clip `wOut` rapide), le nouveau joue ses animations d'entrée. Préchargement au survol et au focus (cache mémoire). Passer du site à l'atelier (ou de l'intro au site), ou une erreur de `fetch`, retombe sur une navigation classique. Sans JavaScript les liens restent de vrais liens.
- `js/amorce.js` : charge le module de la page (`<body data-module data-famille>`) et installe `js/lib/routeur.js`.
- Contrat d'un module de page : `export function init(racine)` et `export function destroy()` (aucun effet de bord à l'import ; seule l'intro `js/pages/intro.js` est une page autonome hors contrat : elle s'exécute à l'import) ; `js/lib/vie.js` (`creerVie()`) regroupe minuteries, écouteurs et nœuds hors `#contenu` pour tout défaire dans `destroy()`.
- Le CSS propre à une page est un `<link data-page-css>` : le routeur le charge et retire l'ancien.

## Mise en page à largeur variable

La scène a une hauteur logique de 900 ; la mise à l'échelle suit la **hauteur**. La largeur logique `W` = largeur de fenêtre / échelle (si `W < 1440`, retour à la réduction « tenir en largeur »). À 1440 × 900 les pages sont identiques aux planches. `js/lib/scene.js` pose sur `#scene` les variables `--W`, `--dx` (= W − 1440), `--gx`, `--sx` ; classes `.ad` (ancré à droite), `.ac` (centré), `.as` (bloc central du site) ; helpers `pos()`, `larg()`, `posf()`. Fond, vignette et ombres mouvantes sont un calque plein fenêtre (`#fenetre`) derrière la scène : aucune coupure visible. Règles de répartition par page : `docs/front/maquette-ecarts.md`.

## Structure

```
maquette/
├── index.html, accueil.html, … (site public et espace client)
├── atelier/                 pages de l'atelier
├── css/
│   ├── base.css             scène, vignette, écriture du texte, verre, traits, photos, ombres, keyframes
│   ├── site.css             en-tête, boutons, encre (site public)
│   ├── atelier.css          menu latéral, puces, champs, onglets, cases (atelier)
│   └── pages/               CSS propre à chaque page
├── js/
│   ├── amorce.js            point d'entrée commun (module de page + routeur ; message si le module ne se charge pas)
│   ├── lib/                 scene (échelle, largeur logique, fond plein fenêtre), routeur, vie, anim (rythme T/H/DR/DV),
│   │                        dom (el, mot, liste), params, ombres, entete (en-tête persistant), atelier-shell (coque persistante), format,
│   │                        surligneur (comète, boule, ligne de l'accueil), vagabond (trait d'arrière-plan), brouillon (devis en sessionStorage),
│   │                        validation (e-mail, mot de passe : 8 caractères minimum), modale (Échap, piège de Tab, retour du focus)
│   └── pages/               un module par page (+ logiques partagées *-logique.js)
├── data/                    données d'exemple uniques ; tarifs.js = RÉFÉRENCE DES PRIX (celle du simulateur), dossiers/catalogue en dérivent
└── vercel.json
```

Règles de prix et de durée : tout vient de `data/tarifs.js` (`TVA`, `KM_OFFERTS`, `PRIX_KM`, `DUREE_MIN` = 2 h, `DUREE_MAX` = 14 h, `kmAllerRetour`) ; ne jamais les recopier dans une page.
Fenêtres modales (photo agrandie, panneau de compte, fenêtres de l'atelier) : `js/lib/modale.js` (Échap ferme, Tab reste dans la fenêtre, le focus revient sur l'élément déclencheur).

Conventions : `sc-if` des planches devient l'attribut `hidden` ; `sc-for` devient `liste()` (mise à jour par clés, sans relancer les animations) ; les calculs de `renderVals` sont des fonctions lisibles par page. Tout texte saisi puis réaffiché passe par `textContent`.
Pour la reprise dans PID (Laravel + Blade + jQuery) : `css/` se recopie tel quel, chaque module `js/pages/` correspond à une vue Blade, `data/` à ce que fournira le contrôleur.

L'ancien dossier `reserve/precision-journee/` (panneau « Configurer ce service », code parqué dont les imports étaient cassés) a été supprimé le 14/11 : la page « Préciser ma journée » (`preciser.html`) l'a repris ; il reste consultable dans l'historique git (`git log -- maquette/reserve`).

Écarts avec le canvas et données harmonisées : `docs/front/maquette-ecarts.md`.
