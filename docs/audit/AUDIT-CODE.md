# AUDIT-CODE : maquette web statique (`maquette/`)

> Agent 2 « Clean code » · lecture seule du code · à destination de l'agent 3 (implémentation).
> Aucun fichier de code n'a été modifié. Ce document est le seul fichier écrit.

---

## 1. En-tête

| | |
|---|---|
| Date | 2026-11-14 |
| Branche | `design/da-morphic` |
| Périmètre | `maquette/` : pages `*.html`, `js/` (`amorce.js`, `lib/`, `pages/`), `css/` (`base`, `site`, `atelier`, `pages/`), `data/`, `atelier/*.html`, `reserve/`, `README.md`, `vercel.json` |
| Hors périmètre | `src/` (ancienne app Next.js), `docs/front/canvas-da-morphic/`, `node_modules/` |
| Doublon à éviter | l'audit visuel est dans `docs/audit/AUDIT-UX.md` (agent 1) : ici on reste sur le code |

### Méthode

1. Lecture complète de `js/lib/*`, `js/amorce.js`, `data/tarifs.js`, `css/base.css`, `accueil.js`, `intro.js`, `simulateur.js` ; lecture ciblée de `galerie.js`, `preciser.js`, `contact.js`, des pages atelier et des CSS de page.
2. Recherches textuelles (Grep) pour chaque soupçon de code mort ou de doublon, avec comptage des occurrences. Chaque « jamais utilisé » ci-dessous a été vérifié par une recherche sur `js/`, `css/`, `data/`, `*.html`, `atelier/` et `reserve/`.
3. Outils jetables, écrits hors dépôt (dans le dossier temporaire de la session) :
   - **acorn** (analyseur syntaxique JavaScript déjà présent dans `node_modules`) pour mesurer la longueur de chaque fonction ;
   - **ESLint** (outil qui repère les erreurs et le code inutile) avec une configuration temporaire limitée à la règle `no-unused-vars` (variables déclarées mais jamais lues) ;
   - `node --check` (contrôle de syntaxe) sur tous les `.js` : **tous passent**.
4. `git ls-files --eol` pour les fins de ligne, `git check-ignore` pour les fichiers ignorés.

### Limites (à lire avant de se fier au document)

- **Rien n'a été exécuté dans un navigateur** : je n'ai ni lancé de serveur ni ouvert de page. Tout ce qui touche au comportement à l'écran (courses entre transitions, rendu, focus réel) est une **hypothèse** tant qu'elle n'est pas rejouée, et marqué comme telle.
- Les pages atelier (`atelier-*.js`, ≈ 2 550 lignes) ont été parcourues par recherches ciblées et mesures, **pas relues ligne à ligne**. Des doublons y existent probablement au-delà de ceux cités.
- Les CSS ont été comparés par sélecteurs et par blocs identiques ; la valeur visuelle d'une règle n'a pas été rendue.
- L'accessibilité est jugée **dans le code** (attributs, gestion du clavier), pas avec un lecteur d'écran.
- Les chiffres de lignes sont ceux de l'arbre de travail local (fins de ligne CRLF ou LF sans effet sur le nombre de lignes).

### Vocabulaire utilisé

- **Code smell** (mauvaise odeur) : signe que le code est difficile à lire, à maintenir ou fragile, sans être forcément faux.
- **Clean code** : code lisible, sans répétition ni reste inutile.
- **DRY** (Don't Repeat Yourself, « ne te répète pas ») : chaque règle ou donnée n'existe qu'à un seul endroit.
- **YAGNI** (You Aren't Gonna Need It, « tu n'en auras pas besoin ») : ne pas inventer d'abstraction sans besoin réel.
- **Code mort** : code jamais exécuté ou jamais lu.
- **Fuite** : ressource (écouteur, minuterie, nœud) qui n'est jamais libérée.
- **CSP** (Content Security Policy, politique qui liste les sources autorisées pour scripts, styles, polices) : en-tête HTTP de défense contre l'injection de code.
- **ARIA** (Accessible Rich Internet Applications, attributs `aria-*` qui décrivent l'interface aux lecteurs d'écran).
- **Focus trap** (piège de focus : le Tab reste dans une fenêtre modale tant qu'elle est ouverte).
- **Keyframes** (`@keyframes` : définition CSS d'une animation image par image).
- **EOL** (End Of Line, fin de ligne : CRLF sous Windows, LF sous Unix).

---

## 2. Tableau de bord chiffré

### 2.1 Fichiers et lignes par dossier

| Dossier | Fichiers | Lignes |
|---|---:|---:|
| `maquette/` (racine : 10 `.html`, `README.md`, `vercel.json`) | 12 | 945 |
| `js/` (`amorce.js`) | 1 | 12 |
| `js/lib/` | 13 | 902 |
| `js/pages/` | 31 | 4 784 |
| `css/` (`base`, `site`, `atelier`) | 3 | 218 |
| `css/pages/` | 17 | 254 |
| `data/` | 6 | 307 |
| `atelier/` (16 `.html`) | 16 | 1 107 |
| `reserve/precision-journee/` | 3 | 711 |
| **Total** | **102 suivis par git** (104 sur disque : 2 fichiers `.vercel/` ignorés) | **≈ 9 240** (`.js`, `.css`, `.html` seuls : 9 139) |

`css/pages/*.css` pèse 254 lignes mais des lignes de 240 à 250 caractères : le CSS est écrit « compact » (une règle par ligne). Les chiffres de lignes CSS sous-estiment donc le volume (46,9 Ko de CSS).

### 2.2 Les 10 plus gros fichiers (lignes)

| # | Fichier | Lignes |
|---:|---|---:|
| 1 | `reserve/precision-journee/simulateur-panneau.js` | 445 |
| 2 | `js/pages/preciser.js` | 443 |
| 3 | `js/pages/accueil.js` | 440 |
| 4 | `js/pages/simulateur.js` | 349 |
| 5 | `js/pages/galerie.js` | 317 |
| 6 | `js/pages/atelier-dossier-logique.js` | 314 |
| 7 | `js/pages/atelier-catalogue-logique.js` | 300 |
| 8 | `js/pages/atelier-dossier.js` | 236 |
| 9 | `reserve/precision-journee/simulateur-panneau.html` | 206 |
| 10 | `preciser.html` | 206 |

Aucun fichier n'est démesuré en soi ; c'est l'**intérieur** des fichiers qui est monolithique (voir 2.3).

### 2.3 Les 10 fonctions les plus longues (mesurées avec acorn)

| # | Fonction | Fichier:ligne de début | Lignes |
|---:|---|---|---:|
| 1 | `init` | `reserve/precision-journee/simulateur-panneau.js:14` | 427 |
| 2 | `init` | `js/pages/preciser.js:16` | 423 |
| 3 | `monterAccueil` | `js/pages/accueil.js:84` | 352 |
| 4 | `init` | `js/pages/simulateur.js:22` | 323 |
| 5 | `init` | `js/pages/galerie.js:11` | 305 |
| 6 | `monterPanneaux` | `js/pages/atelier-dossier-logique.js:71` | 235 |
| 7 | `init` | `js/pages/atelier-dossier.js:15` | 216 |
| 8 | `init` | `js/pages/atelier-clients.js:11` | 175 |
| 9 | `render` | `js/pages/accueil.js:208` | 157 |
| 10 | `render` | `js/pages/galerie.js:117` | 156 |

Suivent : `monterFormulaire` (149, `atelier-catalogue-logique.js:152`), `init` d'`atelier-planning.js` (143), `mes-dossiers.js` (135), `atelier-modeles.js` (133).

### 2.4 Comptage des constats

| Priorité | Sens | Nombre |
|---|---|---:|
| **P1** | sécurité ou bug probable | **3** |
| **P2** | maintenabilité importante | **17** |
| **P3** | confort | **8** |
| **Total** | | **28** |

### 2.5 Constats rassurants (faits établis, sécurité)

À conserver tels quels :

- **Aucun `eval`, `new Function`, `document.write`** dans `maquette/`.
- **Un seul `innerHTML`** : `js/pages/atelier-fiche.js:78`, et il reçoit une constante statique (`POIGNEE`), jamais une donnée saisie. Tout le reste passe par `el()`/`textContent` (`js/lib/dom.js`).
- **Paramètres d'URL** (`js/lib/params.js`) : le texte lu n'est jamais affiché ; il sert seulement à choisir **dans une liste blanche** (`valides.find(...)`) avec valeur par défaut. Pas d'injection possible par ce chemin.
- **`sessionStorage`** (`js/lib/brouillon.js`) : le JSON relu est validé champ par champ (`lignesValides` : service existant, options existantes, bornes de durée, `adr` tronquée à 200 caractères). Le brouillon **public** impose `c: -3, adr: ''` à la lecture : une adresse exacte ne peut pas traverser le simulateur public même si le stockage est falsifié (règle « aucune adresse exacte avant l'inscription » respectée).
- **Aucun secret**, aucune clé, aucune donnée personnelle réelle : tous les e-mails de `data/` sont en `@example.com` ou `.example`.
- **Aucun lien externe cliquable** : les seules URL `https://` des `.html` sont les polices Google (`<link>`), donc pas de `target="_blank"` à protéger.
- **Aucune requête réseau** hors `fetch` same-origin du routeur et polices Google.
- `submit` est neutralisé globalement (`js/lib/scene.js:42`, en phase de capture) : aucun formulaire ne peut partir.

---

## 3. Constats

Légende des champs : **Catégorie** · **Priorité** · **Où** · **Pourquoi** · **Preuve** · **Proposition** · **Risque de régression** · **Vérification « visuel identique »**.

Recette de vérification commune (référencée « R-VIS » plus bas) : voir section 4.0.

---

### CC-01 · Règles métier et prix recopiés hors de `data/tarifs.js`

- **Catégorie** : duplication / nombres magiques · **Priorité : P1** (la règle « prix issus de `data/tarifs.js` » est validée par l'utilisateur ; une 2e source de vérité finira par diverger)
- **Où** :
  - TVA 21 % codée en dur : `js/lib/format.js:8` (`Math.round(ht * .21)`) et `js/pages/atelier-dossier-logique.js:26` (copie identique de `totaux`, ré-exportée ligne 27), alors que `data/tarifs.js:4` exporte déjà `TVA = 0.21` et que `data/tarifs.js:70` / `atelier-clients-logique.js:24` l'utilisent.
  - Franchise et prix au kilomètre écrits dans les **libellés** : `data/tarifs.js:51` et `:62` contiennent `'… 25 km offerts, 0,50 € / km'` alors que les constantes `KM_OFFERTS = 25, PRIX_KM = 0.5` sont ligne 24 du même fichier.
  - `Math.round(KM[...] * 2 * 10) / 10` (distance aller-retour arrondie) répété : `tarifs.js:49` et `:60`.
  - Durée **minimum 2 h / maximum 14 h** dispersée : `js/lib/brouillon.js:20` (`borner(c.dur, 2, 14)`), `js/pages/simulateur.js:79-82`, `js/pages/preciser.js:268-269` (`Math.max(2, Math.min(14, …))`, `fin - 2`).
- **Pourquoi** : si le tarif au km ou la TVA change, il faut penser à 4 endroits ; les libellés affichés peuvent alors mentir sur le prix réellement calculé. Le minimum de 2 h est une règle commerciale validée : elle ne doit exister qu'une fois.
- **Preuve** : `format.js:8 tva = Math.round(ht * .21)` · `tarifs.js:62 'aller-retour … 25 km offerts, 0,50 € / km'` · `brouillon.js:20 borner(c.dur, 2, 14)` · `simulateur.js:81 c.dur = Math.max(2, Math.min(14, fin - v2))`.
- **Proposition** :
  1. Dans `data/tarifs.js`, ajouter `export const DUREE_MIN = 2, DUREE_MAX = 14;` et `export const kmAllerRetour = (zoneOuIndice) => Math.round(KM[zoneOuIndice] * 2 * 10) / 10;` (nom proposé ; signature : `(i: number) => number`).
  2. Construire les libellés avec les constantes : `` `… ${KM_OFFERTS} km offerts, ${virgule(PRIX_KM)} € / km` `` (attention : `virgule` formate à 1 décimale ; prévoir `PRIX_KM.toFixed(2).replace('.', ',')` pour rester à « 0,50 »).
  3. `js/lib/format.js` : `import { TVA } from '../../data/tarifs.js'` et `tva = Math.round(ht * TVA)`.
  4. `atelier-dossier-logique.js:26-27` : supprimer la copie et `import { totaux } from '../lib/format.js'` ; ré-exporter pour ne pas toucher `atelier-dossier.js:10` (`export { totaux } from '../lib/format.js'`).
  5. Remplacer les bornes 2/14 de `brouillon.js`, `simulateur.js`, `preciser.js` par `DUREE_MIN`/`DUREE_MAX`. **Ne pas** confondre avec `incl: 2` (heures incluses dans le forfait, autre notion).
- **Risque** : **faible** (mêmes valeurs). Seul piège : le formatage « 0,50 » du libellé.
- **Vérification** : (a) texte des libellés identique avant/après sur le simulateur avec une zone lointaine (ex. Gand) et sur `preciser.html` ; (b) mêmes totaux HTVA/TVA/TVAC sur 3 devis (mariage 2 h, mariage 8 h + album + Anvers, culinaire 10 plats) ; (c) tirer la poignée de fin jusqu'à 14 h et la ramener à 2 h : mêmes bornes.

---

### CC-02 · Mot de passe : le libellé promet 8 caractères, le code n'en exige aucun

- **Catégorie** : robustesse / validation aux frontières · **Priorité : P1**
- **Où** : `simulateur.html:114` et `preciser.html:181` (`placeholder="8 caractères minimum"`) ; `js/pages/simulateur.js:59` et `js/pages/preciser.js:71` (`if (!mdp) {…}` seulement) ; `mes-dossiers.html:71` (`type="password" autocomplete="off"`).
- **Pourquoi** : l'interface annonce une règle qu'elle n'applique pas (fait). Dans la maquette rien n'est envoyé, donc sans conséquence réelle ; mais l'agent qui portera ça dans PID (Laravel) risque de copier la validation « non vide ». Les champs mot de passe n'ont pas non plus `autocomplete="new-password"` / `"current-password"` (les gestionnaires de mots de passe ne savent pas quoi proposer ; `autocomplete="off"` sur un mot de passe est ignoré par les navigateurs).
- **Preuve** : `simulateur.js:59 if (!mdp) { st.subErr = st.subMode === 'login' ? 'Indiquez votre mot de passe.' : 'Choisissez un mot de passe.'; …}`.
- **À valider côté vrai back-end (hors maquette)** : e-mail (regex de forme, longueur max 254, unicité), mot de passe (longueur ≥ 8, hachage Argon2/bcrypt, jamais journalisé), limitation de tentatives, protection CSRF (Cross-Site Request Forgery, requête forgée depuis un autre site) sur tous les formulaires, adresse exacte (≤ 200 car., stockée côté serveur après authentification, jamais en `sessionStorage`), champs `p-nom`/`p-msg` du contact (longueur max, anti-spam), lien de livraison `https://` (déjà testé dans `atelier-production.js:63`, à refaire côté serveur).
- **Proposition** : dans les deux `envoyer()` : `if (st.subMode === 'create' && mdp.length < 8) { st.subErr = 'Au moins 8 caractères.'; … }` (message à valider par l'utilisateur) ; `autocomplete="new-password"` (création) / `"current-password"` (connexion, à basculer selon `subMode`) ; `maxlength` sur `p-nom`, `p-mail`, `p-msg`. Après l'extraction du CC-04, la règle n'existera qu'une fois.
- **Risque** : **faible** (comportement de validation, pas de rendu).
- **Vérification** : saisir « abc » : le message d'erreur apparaît sans changer la mise en page (zone `subErr` existante, `rendreSub`) ; saisir 8 caractères : parcours inchangé jusqu'à « Votre brouillon est enregistré ».

---

### CC-03 · Écouteur `scene:resize` de l'en-tête jamais retiré ; `demonterEntete()` incomplet

- **Catégorie** : cycle de vie / fuite · **Priorité : P1** (bug probable, prouvé par lecture)
- **Où** : `js/lib/entete.js:54` (`window.addEventListener('scene:resize', filets)`), `js/lib/entete.js:104-108` (`demonterEntete`), appelé par `js/pages/intro.js:65`.
- **Pourquoi** : `monterEntete` ajoute un écouteur sur `window` à chaque **montage réel**. `demonterEntete()` retire les nœuds mais pas l'écouteur ; la fermeture `filets` garde donc des nœuds détachés en mémoire, et chaque « Rejouer l'intro » (`intro.js:68-72`, qui démonte puis remonte l'accueil) ajoute un écouteur de plus. Effet visible faible (le tracé `d` d'un SVG détaché), effet réel : accumulation.
- **Preuve** : `entete.js:54 filets(); window.addEventListener('scene:resize', filets);` ; aucun `removeEventListener` dans le fichier.
- **Proposition** : stocker `filets` dans `refs` (`refs.filets = filets`) et, dans `demonterEntete()`, `window.removeEventListener('scene:resize', refs.filets)` avant `refs = null`. Signature inchangée. (Alternative plus lourde, inutile ici : passer `vie`.)
- **Risque** : **faible**.
- **Vérification** : ouvrir `index.html`, laisser l'intro finir, cliquer 3 fois « Rejouer l'intro », puis redimensionner la fenêtre : le trait sous l'en-tête suit toujours ; dans les outils développeur, `getEventListeners(window)['scene:resize']` ne doit pas grossir à chaque rejeu (avant : +1 par rejeu).

---

### CC-04 · `simulateur.js` et `preciser.js` : ≈ 15 fonctions copiées-collées

- **Catégorie** : duplication · **Priorité : P2**
- **Où** : `js/pages/simulateur.js` (349 l.) et `js/pages/preciser.js` (443 l.). Comparaison par `diff` des corps de fonctions :

| Fonction | simulateur | preciser | lignes qui diffèrent |
|---|---|---|---:|
| `bande` | `:29` | `:24` | **0** (identique) |
| `hh` (formatage `HH:MM`) | `:25` | `:21` | 0 |
| `fermerSub` | `:49` | `:61` | 2 (focus de retour) |
| `rendreSub` | `:314` | `:408` | 2 (libellé du bouton) |
| `rythmes` | `:98` | `:86` | 4 (clé `n4` en plus) |
| `envoyer` | `:55` | `:67` | 7 (textes finaux, `viderPrecision` vs `viderBrouillons`) |
| `monterCatalogue` | `:142` | `:128` | 7 (ajout direct vs ouverture du panneau) |
| `soumettre`, `creerLigne`, `lier`, `sauver`… | oui | oui | variantes |

- **Pourquoi** : toute correction (ex. CC-02) doit être faite deux fois ; les deux copies ont déjà commencé à diverger (clé `n4`, focus de retour). C'est le plus gros gisement de duplication du code applicatif (≈ 150 lignes).
- **Proposition** (extraire seulement ce qui est identique, YAGNI) :
  - `js/lib/frise.js` : `export function bande(cfg, s, x0, sc)` et `export const hh = (h) => …` (ce `hh` remplace aussi `hhmm` de `atelier-planning-production-logique.js:76`, voir CC-06).
  - `js/lib/panneau-compte.js` : `export function creerPanneauCompte({ vie, st, rendre, textesFin, onCree, onFerme })` regroupant `soumettre`, `fermerSub`, `envoyer`, `rendreSub`. Les différences deviennent des paramètres : `textesFin: { titre, detail }`, `libelles: { occupe, creer, connexion }`, `apresEnvoi: () => void` (vider les brouillons), `retourFocus`.
  - `rythmes(again)` : voir CC-08 (variante « rapide » à intégrer à `anim.js`).
  - Laisser dans chaque page ce qui est vraiment spécifique (`monterCatalogue`, `creerLigne`, `rendre`).
- **Risque** : **moyen** (code interactif dense, état partagé `st`, minuteries `tS`). À faire **après** les lots sûrs et par petits pas : d'abord `bande`/`hh`, puis le panneau compte.
- **Vérification** : R-VIS sur `simulateur.html` et `preciser.html` + parcours complet : créer un compte (formulaire → chargement → « Votre brouillon est enregistré » / « Merci, votre dossier est en cours d'examen »), fermer par Échap et par le bouton, vérifier que le focus revient sur le bouton d'origine dans `preciser.html` (comportement actuel) et que la durée 1,3 s du « chargement » est inchangée.

---

### CC-05 · Table d'animations de l'en-tête recopiée dans 6 fichiers alors que `animationsEntete()` existe

- **Catégorie** : duplication · **Priorité : P2**
- **Où** : la ligne `n0: T(.5, .45), n1: T(.6, .45), n2: T(.7, .45), n3: T(.8, .45)…` (avec `sep`, `logo`, `sig`, `hFl`, `hCta`) existe dans `entete.js:94-101` (la version « officielle », `animationsEntete(R)`) **et** recopiée dans `accueil.js:221-223`, `galerie.js`, `contact.js:~86-88`, `simulateur.js:103-105`, `preciser.js:~91`. Les pages `apropos`, `services`, `dossier`, `mes-dossiers` utilisent déjà `animationsEntete(R)` correctement (`apropos.js:12`, `services.js:13`, `contact.js:14`, `dossier.js:18`, `mes-dossiers.js:22`).
  - Tables « vides » (`sep: 'none', logo: { o: '', f: '' }, … n3: { o: '', f: '' } …`) : `accueil.js:112` et `galerie.js:~63`.
  - Paramètre mort : `monterEntete(_parent, …)` (`entete.js:23`, doc `:18` « ignoré (compatibilité) ») : tous les appelants passent un 1er argument inutile (`$('#entete')`, `racine`, `hote`, `$('#fond')`).
  - Incohérence : `figerEntete()` (`entete.js:88`) liste `n0…n4`, mais `accueil.js:284`, `simulateur.js:113` ne gèrent que `n0…n3` ; `preciser.js` ajoute `n4`.
- **Pourquoi** : changer le rythme de l'en-tête oblige à toucher 6 fichiers ; les deux variantes (`n4` présent ou non) sont une source d'erreur.
- **Proposition** :
  1. Ajouter dans `entete.js` `export const ANIM_ENTETE_VIDE = {…}` (la table « rien encore ») et réutiliser dans accueil/galerie.
  2. Dans accueil/galerie/simulateur/preciser/contact : `a: { ...animationsEntete(R), …surcharges }`. Pour le mode « rapide » (`again`), prévoir `animationsEntete(R, { rapide: true })` (voir CC-08).
  3. Retirer le paramètre `_parent` : `monterEntete({ actif, cta, a, avecDossiers })`, et adapter les 11 appels (recherche `monterEntete(`).
- **Risque** : **moyen** (l'en-tête est « figé » entre pages : la logique `fige`/`dejaLa` dans `accueil.js:282-285` et `galerie.js:17-20` ne doit surtout pas changer ; seul le **contenu** de la table peut être factorisé).
- **Vérification** : R-VIS sur chaque page publique, **arrivée directe** puis **arrivée par clic** depuis une autre page (l'en-tête ne doit pas se redessiner) ; comparer `getAnimations()` de l'en-tête (noms, durées, délais) avant/après.

---

### CC-06 · Petits utilitaires redéfinis page par page

- **Catégorie** : duplication · **Priorité : P2**
- **Où** (tous vérifiés par Grep) :
  - Formatage `HH:MM` : `simulateur.js:25`, `preciser.js:21`, `atelier-planning-production-logique.js:76` (`hhmm`) : 3 copies de `String(Math.floor(h)).padStart(2,'0') + ':' + …`.
  - Clone profond `JSON.parse(JSON.stringify(x))` : `simulateur.js:40`, `preciser.js:39` et `:52` (3 fois ; `structuredClone` existe dans tous les navigateurs récents).
  - Regex d'e-mail `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` : `simulateur.js:58`, `preciser.js:70`, `reserve/…/simulateur-panneau.js:75`, et exportée sous le nom `EMAIL_RE` dans `atelier-clients-logique.js:10` (jamais importée ailleurs).
  - Chemin SVG « cadre d'une photo » `M1 1 L${w+1} 1 L… Z` : `accueil.js:247`, `galerie.js:34` (`frame`), `intro.js:33`.
  - `SVG_PATH`/`P` (créer un `<path pathLength="100">`) : `accueil.js:12`, `galerie.js:35`.
  - `setMot(w, texte, anim)` : `accueil.js:366`, `galerie.js:109`.
  - `FRAGMENT` (fragment DOM) : `accueil.js:13`.
- **Pourquoi** : micro-duplications faciles à réunir, chacune fautive en cas de correction (ex. arrondi des minutes de `hh`).
- **Proposition** (nouveaux petits modules, seulement pour ce qui est utilisé ≥ 2 fois) :
  - `js/lib/format.js` : ajouter `export const hhmm = (h) => …`.
  - `js/lib/validation.js` (nouveau, 5 lignes) : `export const EMAIL_RE = …; export const emailValide = (s) => EMAIL_RE.test(s);` ; supprimer l'export mort de `atelier-clients-logique.js` ou le ré-exporter d'ici.
  - `js/lib/dom.js` : ajouter `cheminSvg(d, extra)` (le `P`/`SVG_PATH`), `cadrePhoto(w, h)` (le `d` du cadre), et `setMot` (même signature que celle de `galerie.js:109` ; vérifier que la variante d'`accueil.js` y correspond avant de fusionner).
  - Remplacer `JSON.parse(JSON.stringify(x))` par `structuredClone(x)` (sans changement de résultat pour ces objets simples).
- **Risque** : **faible** pour `hhmm`, `EMAIL_RE`, `structuredClone` ; **moyen** pour `setMot` (deux implémentations légèrement différentes à confronter).
- **Vérification** : mêmes textes d'heure sur la frise du simulateur et sur le planning atelier ; mêmes cadres de photos (R-VIS accueil, galerie, intro).

---

### CC-07 · Accès à la largeur de scène : `window.__scene` et `260` en dur

- **Catégorie** : état global / nombres magiques · **Priorité : P2**
- **Où** : 8 lectures de `window.__scene` : `entete.js:53`, `vagabond.js:26`, `accueil.js:231`, `apropos.js:61`, `atelier-planning.js:54`, `contact.js:48`, `galerie.js:139`, `services.js:87` ; alors que `mesures` est **exporté** par `scene.js:16` et déjà importé par `dossier.js:8`, `mes-dossiers.js:9`, `preciser.js:10`, `simulateur.js:16`. Le plafond `260` (`CAP_SITE - L` de `scene.js:15`) est recopié en dur : `apropos.js:61` et `services.js:87` (`gx = Math.min(dx, 260)`), alors que `scene.js:29` calcule déjà `gx` (variable CSS `--gx`) mais ne le met pas dans `mesures`. `1440` est répété comme valeur de repli (`entete.js:53`, `vagabond.js:26`).
- **Pourquoi** : `window.__scene` est un état global caché (couplage implicite, repli `|| 0` à chaque lecture) ; le plafond 260 existe à deux endroits qui doivent rester synchrones.
- **Proposition** : dans `scene.js`, `export const mesures = { W: L, k: 1, dx: 0, gx: 0 }` et mettre `gx` à jour dans `ajuster()` (ligne ~30) ; garder `window.__scene = mesures` tant que les outils de test manuel l'utilisent. Remplacer les 8 lectures par `import { mesures } from …` (`mesures.dx`, `mesures.W`, `mesures.gx`). Aucune valeur ne change.
- **Risque** : **faible**.
- **Vérification** : aux largeurs de fenêtre 1440, 1600, 1900 et 2560 px (hauteur 900), mêmes `getBoundingClientRect()` pour la nav, les cartes de contact et le flux de la galerie (méthode DOM de l'utilisateur, pas de capture d'écran).

---

### CC-08 · Tables de rythme `T/F/H/DR/TR` redéfinies dans 5 pages et constante d'easing en 7 fichiers

- **Catégorie** : duplication · **Priorité : P2**
- **Où** :
  - Courbe `cubic-bezier(.45,0,.2,1)` écrite **7 fois** : `anim.js:2` (la source `E`), `routeur.js:14`, `surligneur.js:20` (et **jamais utilisée** dans ce dernier : `E` jamais lue), `vagabond.js:14`, `galerie.js`, `preciser.js`, `simulateur.js` ; plus `reserve/`.
  - `T` (texte écrit) redéfini avec une variante « rapide » identique dans `contact.js:19` (`mkT`), `simulateur.js:99-100`, `preciser.js:87` (`again ? { o: 'wIn .3s…' }`), puis une variante « on/off » dans `accueil.js:214` ; `galerie.js:118` ajoute `wIn2`. `H` (`habille`) : `simulateur.js:101`, `preciser.js:89`. `TR`/`F`/`Sx`/`P`/`Rr` : `accueil.js:211-219`, `intro.js:52`.
- **Pourquoi** : trois pages portent chacune leur copie d'une même variante « rapide ».
- **Proposition** : étendre `anim.js` sans casser l'existant :
  - `export function rythme(K, { rapide = false } = {})` : quand `rapide`, `T` et `H` renvoient les formes `wIn .3s … (dl*.04)` / `habille .35s ease .1s both` (formules copiées des 3 pages, identiques). Les pages `simulateur`, `preciser`, `contact` remplacent leurs copies par `rythme(K, { rapide: again })`.
  - `routeur.js`, `surligneur.js`, `vagabond.js`, `galerie.js`, `preciser.js`, `simulateur.js` : `import { E } from '../lib/anim.js'` (`surligneur.js` : supprimer la constante inutile).
  - **Ne pas** fusionner `accueil.js` (variantes `on`/`fast` propres à l'animation d'entrée/sortie validée) ni `intro.js` : leur logique est spécifique (voir « à ne pas toucher »).
- **Risque** : **moyen** (les chaînes d'animation doivent rester **caractère pour caractère** identiques : `toFixed(2)`, ordres des arguments).
- **Vérification** : script de comparaison des animations (section 4.0, recette B) : pour chaque page, la liste `nom + durée + délai + easing` de toutes les animations actives est identique avant/après.

---

### CC-09 · Code mort JavaScript (variables, paramètres, imports, exports)

- **Catégorie** : code mort · **Priorité : P2** (bruit ; ex. `R`/`rythme` donne l'impression que `accueil.js` utilise le module de rythme alors que non)
- **Constat vérifié** (ESLint `no-unused-vars` + Grep) :

| Fichier:ligne | Élément | Statut |
|---|---|---|
| `accueil.js:86` | `R = rythme(.62)` | jamais lu ; l'import `rythme` (`:4`) ne sert qu'à ça |
| `accueil.js:88` | `navI: -1` dans l'état `S` | jamais lu ni écrit ailleurs |
| `accueil.js:94` | `const vignette = el('div', …)` | créé, jamais ajouté au DOM (commentaire `:109` le dit) |
| `accueil.js:84` | option `vignette: avecVignette` | jamais lue ; `intro.js:64` passe `vignette: true` pour rien |
| `accueil.js:87,203,282` | `rejoue` | passe à `true` au 1er « Rejouer » et n'est **jamais remis à `false`** (comportement figé après le 1er rejeu : à confirmer en navigateur, hypothèse) |
| `galerie.js:14` | `R = rythme(K)` | jamais lu |
| `galerie.js:61` | `tNav`, `tTq` | écrits (`:104`, `:106`), jamais lus (inutiles : `vie` nettoie déjà) |
| `vagabond.js:22` | `tPas` | écrit, jamais lu |
| `entete.js:95` | `H` dans `animationsEntete` | déstructuré, jamais lu |
| `routeur.js:14` | `E` | jamais lu |
| `surligneur.js:20` | `E` | jamais lu |
| `atelier-catalogue-logique.js:4` | import `mot` | jamais lu |
| `atelier-dossier.js:10` | import `PROCH` | jamais lu |
| `atelier-planning.js:25` | `CW` | jamais lu |
| `simulateur.js:12` | import `texte` ; `:15` import `hm` | jamais lus |

- **Exports jamais importés** (vérifiés sur `js/` et `data/`) : `DATE_JOUR_LONGUE`, `dossiersDe` (`data/dossiers.js`), `NB_COMMUNES_ADRESSE` (`data/tarifs.js:23`), `MP` et `PAGES` (`atelier-shell.js:30,45` : utilisés **dans** le fichier, l'`export` est superflu), `$$` (`dom.js`), `OMBRES` (`params.js:13`, utilisé seulement dans le fichier), `montrerFenetre` (`scene.js:50`, utilisé dans le fichier), `servicesDuType` (`atelier-catalogue2-logique.js`), `NUM_NOUVEAU`, `EMAIL_RE` (`atelier-clients-logique.js`), `TRL`, `lireMontant` (`atelier-dossier-logique.js`), `WDL`, `ALL` (`atelier-planning-production-logique.js`), `CLE_PUBLIC`, `CLE_PRECIS` (`brouillon.js`).
- **Proposition** : supprimer ce qui est **prouvé** inutile (colonne « Statut »). Pour les exports : retirer le mot `export` quand l'élément sert dans son fichier, supprimer l'élément s'il est mort. **Ne pas** toucher à `NB_COMMUNES_ADRESSE` sans demander (documente une règle métier : « seules les 5 premières communes sont reconnues dans une adresse », peut servir au futur back-end) : le **garder en commentaire** plutôt que le supprimer. Consigne utilisateur : ne rien supprimer de ce qui a été généré sans demande ; ici la demande est celle de l'audit, mais garder un commit dédié « suppression code mort » pour pouvoir l'annuler d'un `git revert`.
- **Risque** : **faible** (variables jamais lues). Seul point à vérifier : `rejoue` (modification de comportement si on le « corrige » : ne pas toucher, voir ci-dessous).
- **`rejoue`** : ne **pas** le corriger dans ce lot ; seulement le consigner. Le comportement actuel est validé visuellement.
- **Vérification** : `node --check` sur chaque fichier modifié + ESLint temporaire (0 avertissement `no-unused-vars` attendu) + ouverture de chaque page : console du navigateur sans erreur.

---

### CC-10 · Code mort CSS : `@keyframes` jamais utilisés et définitions contradictoires

- **Catégorie** : code mort / règles contradictoires · **Priorité : P2**
- **Constat vérifié** (62 `@keyframes` au total ; Grep du nom sur `css/`, `js/`, `*.html`, `atelier/`, `reserve/`) :
  - **Jamais référencés** : `hlIn` (`base.css:104`), `rIn2` (`base.css:93`), `melt2` (`:116`), `reform` (`:117`), `haloIn` (`:124`), `derive2` (`:123`), `habille2` (`css/pages/galerie.css:15`).
  - **Contradiction** : `@keyframes melt` existe dans `base.css:115` (`scale(2.2,.35)`) **et** dans `css/pages/intro.css:11` (`scale(2,.4)`). Seule `intro.js:55` l'utilise, et `index.html:13` charge `intro.css` **après** `base.css` : la version d'`intro.css` gagne, celle de `base.css` est donc morte et trompeuse.
  - **Doublon identique** : `retourC` et `retourNB` définis dans `css/pages/contact.css:2-3` **et** `css/pages/galerie.css:16-17` (mêmes règles).
  - **Ne sont PAS morts** (faux positifs d'une recherche naïve, à ne pas supprimer) : `alt0`…`alt4` (utilisés par `ombres.js:14` via `` `alt${k}` ``), `wIn2`, `dev2`, `devNB2`, `trace2`, `retire2`, `cadreFin2` (variantes « 2 » qui servent à **relancer** une animation en changeant son nom : mécanisme voulu, commenté `base.css:82`), `drawS2` (`services.js:122`).
- **Pourquoi** : 8 définitions mortes dans le socle ; la double `melt` peut faire croire qu'on change l'effet de l'intro en éditant le mauvais fichier.
- **Proposition** : supprimer `hlIn`, `rIn2`, `melt2`, `reform`, `haloIn`, `derive2`, `habille2` et le `melt` de `base.css` (garder celui d'`intro.css`) ; déplacer `retourC`/`retourNB` dans `base.css` (une seule définition) et les retirer de `contact.css`/`galerie.css` ; **déplacer `drawS2` dans `base.css`** pour que toutes les variantes « 2 » soient au même endroit (facultatif).
- **Risque** : **faible** pour les suppressions prouvées ; **faible** pour le déplacement `retourC/NB` (mêmes règles, `base.css` toujours chargé avant).
- **Vérification** : R-VIS sur `index.html` (intro : le point rouge se « fond » à 0,3 s), `contact.html` et `galerie.html` (changement de service : fondu de retour des photos). Console sans avertissement.

---

### CC-11 · Blocs CSS identiques répétés dans 4 fichiers de page, et en double entre site et atelier

- **Catégorie** : duplication CSS · **Priorité : P2**
- **Où** :
  - Les règles `.err`, `.err i`, `.flux`, `.ico`, `.ico:hover`, `.ico[aria-disabled="true"]`, `.ico svg`, `.ico:focus-visible`, `.champ select`, `.champ select:focus`, `a.btn.encre` sont **identiques** dans `css/pages/atelier-catalogue.css`, `atelier-catalogue2.css` (diff vide entre les deux) et `atelier-clients.css` ; `.flux` et `.ico*` aussi dans `css/pages/planning.css`. `css/pages/production.css` et `contact.css` en reprennent une partie (`.err`, `.champ select`).
  - `.btn{gap:10px;border-radius:20px}` répété dans 5 CSS de page publique (`apropos.css:7`, `contact.css:4`, `dossier.css:4`, `mes-dossiers.css:6`, `services.css:3`, `simulateur.css:3`) en surcharge de `site.css:7` (`border-radius:24px`).
  - `.mini`, `.note`, `.champ input` : redéfinis dans `dossier.css`, `mes-dossiers.css`, `simulateur.css` avec des variantes de **taille de police différentes** (`.mini` : 13,5 px / 13 px / 12,5 px ; `.note` : 13 px/1,6 / 12,5 px) alors que `atelier.css:13-14` les définit déjà.
- **Pourquoi** : une modification de l'icône `.ico` doit être faite 4 fois.
- **Proposition** :
  1. **Sûr** : déplacer les blocs **strictement identiques** (`.err*`, `.flux`, `.ico*`, `.champ select*`, `a.btn.encre`) dans `css/atelier.css` (chargé sur toutes les pages atelier) et les retirer des 4 fichiers de page. Contrôler d'abord par `diff` que les blocs sont identiques à l'octet près.
  2. **Ne pas** unifier les variantes de taille (`.mini`, `.note`, `.champ input`) sans accord : elles sont peut-être voulues par planche ; au mieux les exposer en variables CSS locales (`--mini-taille`). À traiter seulement si l'utilisateur le demande.
  3. `.btn{gap:10px;border-radius:20px}` : laisser tel quel (le CSS de page est volontairement échangé par le routeur, voir `data-page-css`) ou créer `css/site-form.css` ; gain faible, **optionnel**.
- **Risque** : **faible** (1), **moyen** (2, non recommandé).
- **Vérification** : pour chaque page atelier concernée (`categories`, `fiche`, `fiches`, `modeles`, `service(s)`, `option(s)`, `clients`, `planning`), mêmes valeurs calculées (`getComputedStyle`) pour un échantillon `.ico`, `.err`, `.flux` ; recette B (section 4.0).

---

### CC-12 · Dossier `reserve/` : code parqué, cassé et servi publiquement

- **Catégorie** : code mort / hygiène · **Priorité : P2**
- **Où** : `maquette/reserve/precision-journee/` (3 fichiers, 711 lignes, 18 % du JS applicatif en volume). Le README (ligne « `reserve/precision-journee/` ») dit lui-même que ce code a été « retiré de la page publique et gardé comme source de la page Préciser ma journée (traduite le 14/11) » : la traduction est faite (`preciser.js:1` : « reprend le code parqué dans reserve/ »).
- **Preuves** :
  - Aucune référence depuis le code actif : Grep `reserve` hors du dossier = 2 commentaires seulement (`preciser.js:1`, `simulateur.js:7`).
  - **Il ne peut plus s'exécuter** : `simulateur-panneau.js:4-10` importe `'../lib/anim.js'`, `'../../data/tarifs.js'`… relatifs à `reserve/precision-journee/`, donc vers `reserve/lib/anim.js` qui **n'existe pas** (et `reserve/data/…` non plus) ; `simulateur-panneau.html` charge `css/base.css` en chemin relatif au mauvais dossier. C'est un fichier mort, pas une « réserve utilisable ».
  - Il est **déployé** : vercel sert tout le dossier `maquette/` (README : racine du projet Vercel = `maquette/`).
  - Il duplique en entier `bande`, `rythmes`, `envoyer`… (CC-04).
- **Proposition** : **demander à l'utilisateur** (règle : « ne rien supprimer sans demande, garder une sauvegarde »). Deux options sûres : (a) supprimer le dossier (l'historique git `git log -- maquette/reserve` suffit comme sauvegarde ; mentionner le dernier commit qui le contient dans le README) ; (b) le déplacer hors du dossier servi, vers `docs/front/archives/precision-journee/`. Recommandation : (a), après accord. Mettre à jour les 2 commentaires et le README.
- **Risque** : **faible** (aucun import entrant).
- **Vérification** : Grep `reserve` = 0 occurrence active ; toutes les pages s'ouvrent ; `vercel`/serveur local ne propose plus `/reserve/…`.

---

### CC-13 · Fonctions à responsabilités multiples (`init`/`monter*` de 300 à 430 lignes)

- **Catégorie** : fonctions trop longues / état mutable · **Priorité : P2** (à traiter **en dernier**, risque élevé)
- **Où** : voir 2.3. Exemples précis :
  - `accueil.js:84-435` (`monterAccueil`, 352 lignes) mélange : construction du DOM (`:91-169`), mesure de texte (`:171-181`), actions (`:183-205`), `render()` de 157 lignes (`:208-364`) qui recalcule **tout** (mosaïque, menu, héros, services, lightbox) à chaque événement, et le lightbox `renderLb` (`:373-414`).
  - `galerie.js:11-315` : `init` de 305 lignes dont **toutes les fonctions internes sont à la colonne 0** (non indentées : `function justifie` `:38`, `render` `:117`, `renderLb` `:276`, `vie.ecouter` `:313`), alors qu'elles sont imbriquées dans `init` : lecture trompeuse.
  - `preciser.js:16-438` : 423 lignes, 20 fonctions imbriquées, état `st` partagé par fermeture.
  - État global mutable : `let vie = null;` répété dans **21 modules** (+ `fondPage` dans 3) ; objet `S`/`st` modifié depuis des dizaines d'endroits dans `accueil.js`, `galerie.js`.
- **Pourquoi** : lecture lente, tests impossibles, régression facile. Mais le comportement est validé visuellement : chaque découpage doit être « mécanique ».
- **Proposition** (découpages mécaniques, pas de nouvelle architecture) :
  - `accueil.js` : extraire dans `js/lib/mosaique.js` la fonction pure `rectsMosaique(ratios, dx)` (`:47-69`, déjà pure, sans dépendance) ; dans `js/lib/lightbox.js` (nom proposé) le rendu du lightbox commun à `accueil.js:373-414` et `galerie.js:276-310` **seulement si** une comparaison détaillée montre qu'ils sont proches (non vérifié ici : hypothèse).
  - `galerie.js` : **réindenter** (changement purement typographique, aucune ligne de logique modifiée) ou transformer en `function monterGalerie(racine) {…}` appelée par `init`.
  - Ne **pas** découper `render()` d'`accueil.js` : sa structure suit celle de la planche du canvas (animations coordonnées). Au plus extraire `const at`, `T`, `Sx`… en haut de fichier si pur.
  - Page atelier : introduire un petit gabarit pour le cycle de vie (voir CC-14).
- **Risque** : **élevé** pour `accueil.js`/`preciser.js` ; **faible** pour la réindentation de `galerie.js` et l'extraction de `rectsMosaique`.
- **Vérification** : R-VIS complète + recette B + test manuel des états (survol des services, clic photo, flèches du lightbox, Échap, « Rejouer »).

---

### CC-14 · Gabarit de cycle de vie répété dans 21 modules ; nettoyage de `#fond` copié 10 fois

- **Catégorie** : duplication · **Priorité : P3**
- **Où** : `let vie = null; … export function destroy() { if (vie) vie.nettoyer(); vie = null; }` dans 21 `js/pages/*.js` (ex. `services.js:128-131`, `contact.js:110-113`, `atelier-services.js:11-15`). Dix modules atelier ajoutent `const fond = document.getElementById('fond'); if (fond) fond.style.animation = '';` (`atelier-categories.js:121`, `-fiche.js:136`, `-fiches.js:66`, `-modeles.js:149`, `-option(s).js:14`, `-planning.js:154`, `-production.js:123`, `-service(s).js:14`) et trois autres le font via `fondPage` + `animer(fondPage, '')` (`atelier-dossier.js:235`, `-dossiers.js:126`, `-demandes.js:102`).
- **Pourquoi** : 2 formes différentes d'un même nettoyage ; oubli facile pour la prochaine page.
- **Proposition** : le routeur appelle déjà `destroy()` ; le nettoyage de `#fond` (animations posées par les panneaux) peut se faire **une fois** dans `atelier-shell.js` (retour de `monterAtelier` : `aFaire` de `vie`) ou dans le routeur après `destroy()` pour la famille « atelier ». Garder le contrat `init(racine)` / `destroy()` du README. Ne pas introduire de classe de base (YAGNI).
- **Risque** : **moyen** (certains modules animent `#fond` et le nettoient exprès pour « le menu inclus » : voir le commentaire de `atelier-dossiers.js:126`).
- **Vérification** : sur l'atelier, ouvrir un panneau (dossier : « Traiter la demande »), quitter la page par le menu : le menu latéral reste visible et opaque, pas de clignotement ; `document.getElementById('fond').style.animation === ''` après chaque navigation.

---

### CC-15 · Couleurs de la palette et durées en dur (aucune variable CSS ni constante nommée)

- **Catégorie** : nombres magiques · **Priorité : P3**
- **Où** (comptages vérifiés par Grep) :
  - Cyan `#3AA6B5` : 27 occurrences dans `js/`, 16 dans `css/`, 6 `.html` ; orange `#D9783A` : 19 `js/`, 23 `.html` ; bordeaux `#7A1F33` : 15 `js/`, 8 `css/` ; encre `#0D0E10` : 45 `js/`, 94 `css/`, 11 `.html`. Aucun `:root{--…}` dans `base.css`.
  - Listes de couleurs de comètes recopiées : `accueil.js:40-41` (`COMC`, `COUL`), `vagabond.js:12` (`COULEURS`), `intro.css:9` (`teinte`).
  - Durées JS couplées à des durées CSS : `accueil.js:198` (`820` ms = durée de la fermeture du lightbox), `:188` (`300`), `simulateur.js:53` (`380`), `intro.js:44` (`6400` vs `END = 5.5` `:11` et README « 6,4 s »), `routeur.js:63` (`320`) et `:67` (`340`).
- **Pourquoi** : changer la palette exige ~200 remplacements ; deux durées couplées (JS/CSS) peuvent se désynchroniser sans signal.
- **Proposition** : (1) dans `css/base.css`, ajouter `:root{--cyan:#3AA6B5;--orange:#D9783A;--bordeaux:#7A1F33;--encre:#0D0E10}` **sans** remplacer les occurrences existantes dans un premier temps (remplacer au fil de l'eau seulement dans les fichiers déjà modifiés) ; (2) `js/lib/palette.js` : `export const CYAN = '#3AA6B5', ORANGE = …` pour les tables JS (`COMC`, `COUL`, `COULEURS`) ; (3) pour les durées couplées, une constante nommée par module avec un commentaire « = durée de … dans accueil.css » (pas de refonte).
- **Risque** : **faible** (les valeurs ne changent pas).
- **Vérification** : `grep -c "#3AA6B5"` avant/après n'a de sens que pour (2) ; sinon R-VIS : couleurs de comète, de soulignement, de point rouge de l'intro identiques (`getComputedStyle(...).stroke`).

---

### CC-16 · Routeur : points de fragilité (hypothèses à rejouer)

- **Catégorie** : cycle de vie / robustesse · **Priorité : P2** (tout est **hypothèse** sauf la 1re puce, établie par lecture)
- **Où** : `js/lib/routeur.js`
  - **Fait** : `const cache = new Map()` (`:16`) n'est jamais purgé ni borné : toute page visitée reste en mémoire pour la session. Négligeable ici (≈ 26 pages statiques), à signaler pour la reprise.
  - **Fait** : aucun délai maximum sur `fetch` (`:29`) : une page lente fige la transition (le contenu sortant reste fondu à 0 avec `fill: 'forwards'`, `:82`) tant que la requête n'a pas abouti ou échoué ; pas d'`AbortController`.
  - **Hypothèse (course entre clics rapides)** : après `destroy()` de l'ancienne page (`:89-91`) et `changerStyles` (`:94`), si un 2e clic incrémente `sequence`, le 1er appel sort (`:95`) alors que le CSS de la page précédente a **déjà été retiré** (`changerStyles` retire les anciens `<link data-page-css>`, `:44`) et que l'ancien DOM, déjà « détruit », est encore à l'écran jusqu'à l'arrivée du 2e remplacement. Au pire : un contenu non stylé pendant ≈ 0,3-0,5 s. À reproduire : 2 clics très rapides sur deux liens du menu avec le réseau bridé.
  - **Hypothèse** : `popstate` (`:142`) rappelle `aller(location.href)` même pour un simple changement d'ancre (`#…`), ce qui recharge le contenu inutilement ; la détection « ancre seule » n'existe que pour le clic (`:121`).
  - **Fait** : `document.addEventListener('click'|'pointerover'|'focusin')` et `popstate` ne sont jamais retirés : acceptable (routeur singleton, jamais « démonté »), à documenter.
- **Proposition** (petite, pas de réécriture) : (a) un `AbortController` + délai de 8 s sur `recuperer` avec repli `classique(url)` ; (b) ne retirer l'ancien CSS (`changerStyles`) **qu'après** le test `id !== sequence` suivant (ordre : tester la séquence avant de retirer les anciens liens), ou ne l'exécuter qu'en même temps que `replaceChildren` ; (c) dans `popstate`, comparer `cle()` à l'URL courante et ne rien faire si seule l'ancre change ; (d) commentaire d'en-tête « singleton, écouteurs permanents ».
- **Risque** : **moyen** (le routeur gère le fondu blanc avec en-tête figé, comportement validé : ne pas toucher à l'ordre `figerEntete()` → `changerStyles` → `replaceChildren`).
- **Vérification** : naviguer 20 fois entre les 8 pages publiques par clics rapides et par Retour/Avancer : jamais de page non stylée, titre et focus corrects (`document.activeElement.tagName === 'H1'`), aucune erreur console ; comparaison visuelle du fondu blanc inchangée.

---

### CC-17 · `amorce.js` / routeur : import dynamique sans liste blanche ni gestion d'erreur

- **Catégorie** : robustesse / sécurité (défense en profondeur) · **Priorité : P2**
- **Où** : `js/amorce.js:10` (`await import(\`./pages/${nom}.js\`)`, où `nom = document.body.dataset.module`), `js/lib/routeur.js:36` (`import(new URL(nom + '.js', dossierPages).href)`, où `nom` vient du `data-module` d'une page **récupérée par fetch**).
- **Pourquoi** : (fait) la valeur n'est validée par aucune liste ; un `data-module="../lib/vie"` importerait un autre module du même site. **Exploitation réaliste faible** : il faudrait contrôler le HTML servi par la même origine (déjà une compromission). C'est de la défense en profondeur. Plus concret : (fait) `amorce.js` est un module avec `await` de haut niveau **sans `try/catch`** : si `import()` ou `init()` lève, la page reste **blanche** sans message (le routeur, lui, a un repli `classique()`). Sans JavaScript : `#contenu` est vide dans chaque `.html` (README : « Sans JavaScript les liens restent de vrais liens » reste vrai, mais la page n'affiche rien) : pas de `<noscript>`.
- **Proposition** : dans `js/lib/pages.js` (nouveau, ≈ 10 lignes) : `export const PAGES_VALIDES = new Set([...])` (les 26 noms de `js/pages/*.js` hors `*-logique.js`) et `export const moduleValide = (n) => PAGES_VALIDES.has(n)` ; refuser sinon (`classique(url)`). `amorce.js` : `try { … } catch (e) { document.getElementById('contenu').textContent = 'Cette page n’a pas pu se charger. Rechargez la page.'; }` (texte à valider par l'utilisateur). Ajouter un `<noscript>` minimal dans les `.html` seulement si l'utilisateur le souhaite (la reprise PID rendra le HTML côté serveur).
- **Risque** : **faible** (liste fermée, repli classique).
- **Vérification** : toutes les pages s'ouvrent en accès direct et par clic ; en renommant temporairement un module (copie de travail), un message clair s'affiche au lieu d'une page blanche.

---

### CC-18 · Fenêtres modales (`role="dialog" aria-modal="true"`) sans Échap, sans piège ni retour de focus

- **Catégorie** : accessibilité · **Priorité : P2**
- **Où** (11 dialogues dont 10 avec `aria-modal`) : `accueil.js:396`, `galerie.js:286`, `atelier-dossier-logique.js:108,126,147`, `atelier/clients.html:60`, `mes-dossiers.html:58`, `preciser.html:87,154`, `simulateur.html:87`, `atelier/planning.html:46` (sans `aria-modal`). **Seul `preciser.js:435`** gère la touche Échap (`keydown` sur `document`) et le retour du focus (`retour.focus`, `:50,65`).
- **Pourquoi** : `aria-modal="true"` promet au lecteur d'écran que le reste de la page est inerte, mais le Tab peut sortir de la fenêtre et rien ne ferme le lightbox au clavier. (fait pour l'absence de gestionnaire ; l'effet réel sur lecteur d'écran est une hypothèse.)
- **Proposition** : un seul utilitaire `js/lib/modale.js` : `export function pieger(racine, { fermer, retour })` qui (1) écoute `Escape` → `fermer()`, (2) boucle le Tab entre le 1er et le dernier élément focalisable de `racine`, (3) mémorise `document.activeElement` à l'ouverture et le restitue à la fermeture ; branché via `vie.ecouter(...)` pour le nettoyage. L'appliquer aux lightbox d'accueil et de galerie, puis aux autres. **Ne change aucun visuel.**
- **Risque** : **faible** pour le comportement ; vérifier que les touches ←/→ des lightbox (si elles existent : non vérifié ici) ne sont pas captées.
- **Vérification** : clavier seul : ouvrir une photo (Entrée), Tab ×N reste dans la fenêtre, Échap ferme, focus revient sur la vignette d'origine.

---

### CC-19 · Éléments d'action non natifs et sémantique manquante

- **Catégorie** : accessibilité · **Priorité : P2**
- **Où** :
  - Liens `<a href="#">` utilisés comme **boutons** : `atelier/modeles.html:29` (`#nouveau`), `atelier/client.html:40`, `atelier/planning.html:49`, `dossier.html:82` (`data-sans-effet`) et `:94` ; `atelier-shell.js:110` (« Se déconnecter », `preventDefault`) ; `atelier-shell.js:124` (`href = m.h || '#'` : 16 entrées de menu « non dessinées » restent focalisables et mènent à `#`, géré `:152`). Au total 5 `href="#"` dans 4 `.html` et 5 `href: '#'` dans le JS.
  - **Aucun `<main>`** dans les 26 pages (Grep `<main` = 0 ; `role="main"` = 0) : pas de repère « contenu principal » ni de lien d'évitement.
  - 3 pages sans `<h1>` statique (23 `<h1>` pour 26 pages, certains créés par JS : non vérifié page par page) ; le routeur donne le focus au `h1` (`routeur.js:108`) ou à `#contenu` sinon.
  - `onglets` : `role="tab"` créés dans `dossier.js:55` et `atelier-dossier.js:174` avec `aria-selected` mais sans gestion des flèches ←/→ (hypothèse sur le niveau d'exigence attendu ; le `role="tablist"` existe bien dans le HTML).
- **Proposition** : `<button type="button">` pour les actions (« + Nouveau modèle », « Gérer… », « Bloquer cette date », « Compléter la fiche ») en gardant les classes ; menu atelier : `<span aria-disabled="true">` (sans `href`) pour les entrées sans page ; ajouter `role="main"` (ou `<main>`) sur `#contenu` dans les 26 `.html` (changement d'attribut seulement : `#contenu` est déjà l'unique zone de contenu) ; (optionnel) flèches sur les onglets.
- **Risque** : **moyen** pour le passage `a`→`button` (les CSS `a.btn.encre` ciblent la balise : CC-11 ; `button.btn` existe déjà `site.css`/`atelier.css`) ; **faible** pour `role="main"`.
- **Vérification** : mêmes dimensions/positions (`getBoundingClientRect`) des contrôles avant/après ; navigation clavier : Entrée/Espace déclenchent bien l'action.

---

### CC-20 · `prefers-reduced-motion` : couverture partielle (hypothèse)

- **Catégorie** : accessibilité · **Priorité : P3**
- **Où** : `css/base.css:142` (`*{animation-duration:0s !important; animation-delay:0s !important; transition-duration:0s !important}`) ; en JS : `routeur.js:20` et `vagabond.js:75` testent `matchMedia`, **pas** `intro.js:91` ni `surligneur.js` (qui s'appuie sur les transitions CSS, donc couvert par la règle globale).
- **Pourquoi** : (hypothèse, à tester dans le navigateur) avec `animation-duration:0s`, les animations **infinies** (`comete`, `rebatit`, `souffle`, `.om-i` `alt*`/`glisse*`, `pulse`) peuvent boucler instantanément ; la bonne pratique est aussi `animation-iteration-count:1 !important`. L'intro dure 6,4 s même en mouvement réduit (le minuteur `planifier()` n'en tient pas compte).
- **Proposition** : ajouter `animation-iteration-count:1 !important;` à la règle de `base.css:142` ; dans `intro.js`, si `reduit()`, passer directement `S.fin = true` (page d'accueil immédiate). À valider avec l'utilisateur car l'intro est une pièce de la direction artistique.
- **Risque** : **faible** pour le CSS (seulement si mouvement réduit demandé) ; **moyen** pour l'intro.
- **Vérification** : activer « Réduire les animations » dans l'OS : plus aucun mouvement perpétuel, aucune page vide ; sans la préférence : visuel strictement identique.

---

### CC-21 · `intro.js` : hors contrat des modules et copie du routeur

- **Catégorie** : duplication / cycle de vie · **Priorité : P3**
- **Où** : `js/pages/intro.js`. Le README impose « `init(racine)` et `destroy()` (aucun effet de bord à l'import) » ; or l'intro exécute tout à l'import (`:9` `monterScene()`, `:22-75` DOM et minuteurs, `:80` `document.addEventListener('click')`, `:98` `window.addEventListener('pageshow')`), n'exporte ni `init` ni `destroy`, et n'est pas routée (c'est voulu : page de sortie vers une autre famille). Doublons avec `routeur.js` : conditions de lien interne (`intro.js:81-87` ≈ `routeur.js:116-122`), clé de fondu `FONDU` (`intro.js:93` ≈ `routeur.js:63`), test `reduit()` (`:91` ≈ `routeur.js:20`). Écouteurs jamais retirés : sans conséquence (page terminale, pas de routeur).
- **Proposition** : extraire dans `js/lib/liens.js` : `export function lienInterne(e)` (la fonction de `routeur.js:116-125`, déjà indépendante) et `export const FONDU_SORTIE`, `export const mouvementReduit = () => matchMedia(…).matches` ; `intro.js` et `routeur.js` les importent. Mettre à jour le README (« l'intro est une page autonome, hors contrat »). Ne **pas** convertir l'intro au contrat `init/destroy` (YAGNI).
- **Risque** : **faible** (extraction de fonctions pures).
- **Vérification** : depuis `index.html`, clic sur « Galerie » : fondu gris puis blanc de 0,32 s (même durée), puis chargement ; Retour du navigateur : la page ne reste pas effacée (`pageshow`).

---

### CC-22 · Nommage : mélange français/anglais et abréviations obscures

- **Catégorie** : nommage · **Priorité : P3**
- **Où** :
  - Même rôle, noms différents : `render()` (`accueil.js:208`, `galerie.js:117`) / `rendre()` (`simulateur.js`, `preciser.js`, `dossier.js`…) ; `renderLb` / `rendreSub` ; `init`/`destroy` (contrat, anglais) vs `monterAccueil`/`monterEntete`/`creerVie` (français) ; `aller()` (routeur, navigation) et `aller()` (`accueil.js:200`, photo suivante) et `surf.aller(i)` (surligneur) : trois sens du même mot.
  - Anglicismes dans les états : `again`, `fast`, `on`, `out`, `growing`, `atSrc`, `dissolve`, `retour` (`accueil.js:209,379`, `simulateur.js:98`, `galerie.js:17`).
  - Abréviations d'une lettre : `T`, `H`, `DR`, `DV`, `TR`, `F`, `Sx`, `P`, `Rr` (tables d'animations), `S`/`st` (état), `tm`, `ent`, `vag`, `dx`/`gx`/`sx`, `cy`, `mots`, `hs` ; clés d'animation `a.n0…n4`, `hFl`, `hCta`, `navU`, `eyeL`, `ak`/`at`, `lb1`/`lb2`.
  - Mélange de noms de fichiers : `atelier-catalogue-logique.js` et `atelier-catalogue2-logique.js` (le « 2 » n'indique rien : il regroupe les utilitaires de fiches/catégories/modèles, pas un 2e catalogue ; CSS `atelier-catalogue2.css` idem).
- **Pourquoi** : ralentit la lecture d'un nouvel arrivant ; les lettres `T/H/DR/DV` sont documentées dans `anim.js` mais pas là où elles sont redéfinies.
- **Proposition** : **ne pas renommer en masse** (risque de régression sans gain visuel). (1) Écrire un court glossaire en tête de `js/lib/anim.js` (T = texte écrit, H = habillage, DR = dessin de trait, DV = développement de photo, TR = tracé photo) et y renvoyer par un commentaire dans les pages. (2) Renommer **seulement** `atelier-catalogue2-logique.js` en `atelier-formulaires-logique.js` (6 imports : `atelier-categories.js:6`, `-fiche.js:6`, `-fiches.js:5`, `-modeles.js:6` + `-catalogue-logique`) et le CSS associé, si l'utilisateur est d'accord. (3) Convention pour le futur : verbes français pour les fonctions (`rendre`, `monter`, `creer`), sauf le contrat `init`/`destroy`.
- **Risque** : **faible** (glossaire) ; **moyen** (renommage de fichier : mettre à jour les `<link>` des 4 `.html` qui référencent `atelier-catalogue2.css`).
- **Vérification** : Grep de l'ancien nom = 0 ; les 4 pages atelier concernées s'ouvrent, console sans erreur 404.

---

### CC-23 · Commentaires périmés et README en retard

- **Catégorie** : documentation · **Priorité : P3**
- **Où** (faits) :
  - `README.md` : le tableau « Carte des pages » **ne liste pas `preciser.html`** (page existante) et sa ligne « Options de planche » ne la mentionne pas ; la structure `js/lib/` ne cite ni `surligneur.js`, ni `vagabond.js`, ni `brouillon.js` ; « Rien n'a été déployé » alors que `maquette/.vercel/project.json` (ignoré par git) lie le dossier au projet Vercel « portfolio-maquette » (un lien n'est pas un déploiement : hypothèse à confirmer avec l'utilisateur) ; la section « Navigation sans rechargement » dit « aucun effet de bord à l'import » alors que `intro.js` en a (CC-21).
  - `simulateur.js:7-8` : « Le panneau … est conservé dans maquette/reserve/precision-journee/ pour l'écran connecté » : périmé, la page `preciser.html` existe (CC-12).
  - `entete.js:18` : paramètre `_parent` documenté « ignoré (compatibilité) » (CC-05).
  - `accueil.js:109` : « la vignette est désormais le calque plein fenêtre… » commente du code supprimé (le `const vignette` de `:94` est resté).
  - `css/pages/*.css` : mention « Reprend le `<style>` propre à PIntro.dc.html » (`intro.css:1`) : renvoi à un fichier du canvas, hors périmètre ici, à garder.
- **Proposition** : mettre à jour le README (ajouter `preciser.html` : planche « PPreciser », `?…` si des paramètres existent ; ajouter les trois modules ; corriger le contrat) ; supprimer ou corriger les commentaires cités.
- **Risque** : **nul**.
- **Vérification** : relecture ; tous les liens et noms de fichiers du README existent (`ls`).

---

### CC-24 · Fins de ligne : pas de `.gitattributes` ni de `.editorconfig`

- **Catégorie** : hygiène du dépôt · **Priorité : P2**
- **Constat établi** (`git ls-files --eol maquette`) : dans l'**index** git, 102 fichiers sont tous en LF ; dans l'**arbre de travail**, 56 sont en CRLF, 45 en LF et **1 en mélange** (`css/pages/production.css` : `w/mixed`). La cause est `core.autocrlf=true` sur cette machine (réglage local), non reproductible ailleurs. Aucun `.gitattributes` ni `.editorconfig` n'existe dans le dépôt (`ls` à la racine). Risque réel : sur une autre machine ou un autre éditeur, des diffs complets de fichiers et des avertissements « LF will be replaced by CRLF ».
- **Proposition** : ajouter à la racine du dépôt un `.gitattributes` : `* text=auto eol=lf` (plus `*.png *.jpg binary` si besoin) et un `.editorconfig` : `root = true` / `[*]` `end_of_line = lf`, `charset = utf-8`, `indent_style = space`, `indent_size = 2`, `insert_final_newline = true`. Puis **normaliser** une seule fois (`git add --renormalize .` en commit dédié, **après revue et accord**, car ça touche beaucoup de fichiers ; ce n'est pas un `git add -A` aveugle). Corriger `production.css` (mixte) dans ce même commit.
- **Risque** : **faible** (aucun effet à l'exécution) mais **gros diff** : à isoler dans son propre commit, hors `src/`.
- **Vérification** : `git ls-files --eol` : plus aucun `w/crlf` ni `w/mixed` ; `git diff --stat` du commit ne montre que des fins de ligne (`git diff -w --stat` vide).

---

### CC-25 · `vercel.json` : aucun en-tête de sécurité

- **Catégorie** : sécurité / déploiement · **Priorité : P2**
- **Constat** : `maquette/vercel.json` contient seulement `cleanUrls` et `trailingSlash`. Aucun en-tête de sécurité ; les polices viennent de Google Fonts (requête externe : l'adresse IP du visiteur est transmise à Google, point de conformité RGPD à examiner pour un site belge, **hypothèse juridique non tranchée ici** ; auto-héberger les fichiers de police supprimerait ce flux).
- **Proposition** (à tester avant déploiement, **non testée ici**) :
  ```json
  {
    "cleanUrls": true,
    "trailingSlash": false,
    "headers": [{
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" }
      ]
    }]
  }
  ```
  Raisons : pas de `<script>` inline dans les pages (Grep : tous `type="module" src=`), donc `script-src 'self'` suffit ; `'unsafe-inline'` est **nécessaire** côté styles car ≈ 890 attributs `style="…"` dans les `.html` et `setAttribute('style', …)` dans `dom.js` sont bloqués sans lui. Cache : les JS/CSS ne sont pas « hachés » ; garder le comportement par défaut de Vercel (revalidation) et **ne pas** ajouter `immutable`.
- **Risque** : **moyen** (une CSP trop stricte casse les polices ou le routeur) : tester toutes les pages avec la console ouverte ; déploiement de prévisualisation d'abord. Demander l'accord de l'utilisateur (règle : ne pas modifier la config de déploiement sans revue).
- **Vérification** : console sans « Refused to … because it violates the following Content Security Policy » sur toutes les pages ; polices Instrument Serif/Inter/IBM Plex Mono chargées ; navigation AJAX fonctionnelle.

---

### CC-26 · Absence de tests sur la logique pure (prix, brouillon, paramètres)

- **Catégorie** : tests · **Priorité : P2**
- **Constat** : aucun test dans `maquette/` ; `tests/` à la racine concerne l'ancienne app Next.js. Or une partie du code est **pure et critique** : `calculer()`, `totalCentimes()`, `ville()` (`data/tarifs.js`), `lignesValides` (`brouillon.js`), `param()` (`params.js`), `eurC`/`eurN`/`totaux` (`format.js`), `rectsMosaique` (`accueil.js:47`).
- **Proposition** : `maquette/tests/*.test.mjs` avec le test runner intégré à Node (`node --test`, **aucune dépendance à ajouter**). Cas minimaux : minimum 2 h (`dur` 1 → borné à 2 par `brouillon`) ; dépassement par demi-heure entamée (`calculer`, `dur: 2.25` ⇒ facture 0,5 h) ; franchise 25 km (zone Namur = 0 €, Anvers > 0 €) ; mode P4 (culinaire 10 plats = 150 € HTVA) ; TVA 21 % sur total en centimes (arrondi) ; `ville('1000 Bruxelles') === 0`, `ville('') === -1`, `ville('Paris') === -2` ; `lignesValides` rejette un `sid` inconnu et une option inconnue et force `c: -3, adr: ''` en public ; `param` refuse une valeur hors liste. Nommage `should_<comportement>_when_<condition>` (règle utilisateur). **Prudence** : `brouillon.js` lit `sessionStorage` : prévoir un faux `globalThis.sessionStorage` dans le test.
- **Risque** : **nul** (fichiers neufs) ; à lancer avant et après chaque lot touchant `data/` ou `lib/`.
- **Vérification** : `node --test maquette/tests/` : tous verts ; ce filet sert ensuite pour CC-01.

---

### CC-27 · Rendu : recalcul global à chaque événement et animations infinies

- **Catégorie** : performance simple · **Priorité : P3** (aucun problème mesuré ; à surveiller)
- **Où** :
  - `accueil.js:208` : `render()` recompose tout (mosaïque via `rectsMosaique` qui énumère `2^(n-1)` découpages à chaque appel, `:50`, avec n ≤ 5 donc ≤ 16 itérations : négligeable ; remise à zéro des styles de ≈ 100 nœuds par `Object.assign`) à chaque survol d'un lien du menu (`:131-132` : 4 écouteurs par lien) ou d'un service (`:354`). `animer()` évite de relancer une animation identique (`dom.js` : `_anim`), donc **aucun effet visuel** ; c'est du travail inutile, pas un bug.
  - Mesures de texte : `accueil.js:176,181` créent un `canvas` par appel à `mesures()`/`mesure()` (mémoïsé pour la nav, `navW`; `mctx` mémoïsé pour le héros) : correct.
  - `getComputedStyle` en boucle : un seul usage (`surligneur.js:50`, à chaque début de survol : acceptable).
  - Animations infinies permanentes : `.om-i` (3 à 5 calques `glisse*`/`respire`, 17 à 25 s, avec `filter:blur`), comètes (`comete 9-22 s`), `rebatit`, `souffle` ; `body:has(.lb-fond)` (`base.css:21`) oblige le navigateur à réévaluer un sélecteur `:has()` sur `body` à chaque mutation du DOM (hypothèse de coût).
- **Proposition** : ne rien changer sans mesure. Si l'utilisateur ressent des saccades : (1) ne ré-exécuter que la section impactée dans `render()` (survol du menu → seulement le bloc « surligneur du menu ») ; (2) remplacer `body:has(.lb-fond)` par une classe `body.lb-ouvert` posée par `renderLb` ; (3) `will-change: transform` sur `.om-i>i` après mesure. Ces points ne sont **pas** des quick wins : ils touchent des animations validées.
- **Risque** : **élevé** pour (1), **faible** pour (2).
- **Vérification** : enregistrement de performance Chrome (onglet « Performance », 10 s sur l'accueil, survols du menu) avant/après : durée des tâches de style/mise en page ; aucun changement visuel.

---

### CC-28 · Données : doublon de logique dans `format.js`/données et dépendances croisées inutiles

- **Catégorie** : duplication / structure · **Priorité : P3**
- **Où** : `js/lib/format.js` définit `eurC`, `eurN`, `totaux` ; `atelier-clients-logique.js:24-26` redéfinit `ttc` et `totalDevis` ; `atelier-dossier-logique.js:26` redéfinit `totaux` (CC-01). `NB_COMMUNES_ADRESSE` (`tarifs.js:23`) n'est pas utilisé : `ville()` (`:77-84`) code en dur les 5 communes et leurs plages de codes postaux (`/\b1\d{3}\b/` pour Bruxelles : toute suite de 4 chiffres commençant par 1 est reconnue, y compris hors Bruxelles : **hypothèse** sur la justesse métier à valider avec l'utilisateur).
- **Proposition** : après CC-01, garder **un seul** `totaux` (`format.js`) et un seul `ttc` (celui de `atelier-clients-logique.js` utilise déjà `TVA`) ; documenter la règle « codes postaux » de `ville()` par un commentaire. Pas de refactor de `ville()`.
- **Risque** : **faible**.
- **Vérification** : tests CC-26 ; mêmes montants dans la liste clients et le dossier atelier.

---

## 4. Plan d'implémentation pour l'agent 3

### 4.0 Recettes de vérification « visuel identique »

Règle de l'utilisateur : **mesurer le DOM, pas les captures d'écran** (`getBoundingClientRect`, `getComputedStyle`, `getAnimations()`).

- **Recette A (positions)** : sur chaque page, aux fenêtres 1440×900, 1900×900 et 2560×900, relever pour une liste fixe de sélecteurs (`h1`, `.btn`, `nav a`, `.ph`, `.verre`, `.pastille`, `svg.ln path`, `#contenu > *`) `getBoundingClientRect()` arrondi à 0,5 px. Enregistrer **avant** le lot ; comparer **après**.
- **Recette B (animations)** : sur chaque page, 6 s après le chargement, relever `document.getAnimations().map(a => [a.animationName || a.transitionProperty, a.effect.getTiming().duration, a.effect.getTiming().delay, a.effect.getTiming().easing, a.effect.target.id || a.effect.target.className])`, trié. Doit être **identique** (c'est ainsi qu'on prouve qu'aucune table `T/H/DR` n'a bougé).
- **Recette C (états)** : parcours manuels listés dans chaque lot.
- **Avant tout lot** : `node --check` sur chaque `.js` touché ; console du navigateur sans erreur ni avertissement ; `git diff --stat` limité aux fichiers du lot.
- **Un commit par lot** (l'agent 3 ne commite **pas sans confirmation** de l'utilisateur ; règle globale).

### 4.1 « À ne SURTOUT PAS toucher » (comportements validés)

Valable pour **tous** les lots :

1. **Animations morphiques** : durées, délais, courbes et noms des `@keyframes` ; la **logique** de `render()` d'`accueil.js` (phases `on/off`, `fast`, `svcFade`, `heroOut`) ; les variantes « 2 » qui relancent une animation (`wIn2`, `dev2`, `devNB2`, `trace2`, `retire2`, `cadreFin2`, `drawS2`, `melt` d'`intro.css`) ; les `alt0…alt4`.
2. **Surligneur comète → boule → ligne** : tout `js/lib/surligneur.js` (tables `TR`, `RESSORT`, `VOYAGE`, délais 190/260/360/40 ms, `delaiSortie` 2 500 ms), les pastilles `pp.nLoop`/`pp.sLoop`, `fonduComete`.
3. **Trait vagabond** : tout `js/lib/vagabond.js` (durées aléatoires, opacité 0,4, axes X/Y, calque `.wd`). Seule suppression permise : la variable `tPas` (CC-09).
4. **Zoom photo sans voile** : `renderLb` (`accueil.js`) et `renderLb` (`galerie.js`), `body:has(.lb-fond) #fenetre{opacity:0}`, durées `820`/`760` ms de fermeture, `.lb-fond` (classe **utilisée**, ne pas la confondre avec du code mort).
5. **Fondu blanc entre pages avec en-tête figé** : `routeur.js` (`FONDU`, 320/340 ms, ordre `destroy` → `figerEntete` → `changerStyles` → `replaceChildren`), `figerEntete()`, la logique `dejaLa`/`fige` d'`accueil.js:282-285` et `enteteAnim` de `galerie.js:17-20`. Le lot « routeur » (CC-16) ne modifie que le **traitement d'erreur** et le **test de séquence**, pas la séquence visuelle.
6. **Règles de répartition `--dx` / `--gx` / `--sx`** : classes `.ad .ac .as`, `pos()`, `larg()`, `posf()`, valeurs `calc(… var(--dx) …)` des `.html` et des pages ; `scene.js` (seule extension permise : ajouter `gx` à `mesures`, CC-07). Règles par page dans `docs/front/maquette-ecarts.md`.
7. **Prix** : `data/tarifs.js` reste la **référence unique** ; ses valeurs (`base`, `incl`, `extra`, `unit`, `KM`, `OPTIONS`, `KM_OFFERTS`, `PRIX_KM`, `TVA`) ne changent pas. **Minimum 2 h** : conservé (CC-01 ne fait que le nommer).
8. **Aucune adresse exacte avant l'inscription** : `brouillon.js` (`c: -3, adr: ''` en public), `calculer()` branche `z.c === -3`, `lieux` du simulateur public. Ne jamais autoriser `adr` non vide dans `CLE_PUBLIC`.
9. **Intro** : minutage (6,4 s, `END = 5.5`), collage, « Passer l'intro », « Rejouer l'intro ».
10. Les données d'exemple de `data/` (e-mails `.example`, montants) ; le texte des planches.

### 4.2 Lots, du plus sûr au plus risqué

Chaque lot est indépendant et se termine par ses vérifications ; **ne pas enchaîner deux lots sans accord**. L'ordre ci-dessous est l'ordre recommandé.

#### Lot 0 · Filet et hygiène (aucun effet à l'exécution)
- **Constats** : CC-26 (tests), CC-23 (README), CC-24 (fins de ligne).
- **Fichiers** : nouveau `maquette/tests/*.test.mjs` ; `maquette/README.md` ; `.gitattributes`, `.editorconfig` (à la racine du dépôt) ; `maquette/css/pages/production.css` (EOL).
- **Ordre** : (1) tests d'abord (ils protègent CC-01) ; (2) README ; (3) `.gitattributes`/`.editorconfig` ; (4) normalisation en **commit séparé** après accord.
- **Vérifications** : `node --test` vert ; liens du README valides ; `git ls-files --eol` propre.

#### Lot 1 · Code mort sans risque
- **Constats** : CC-09, CC-10.
- **Fichiers** : `accueil.js`, `galerie.js`, `vagabond.js`, `entete.js`, `routeur.js`, `surligneur.js`, `simulateur.js`, `atelier-catalogue-logique.js`, `atelier-dossier.js`, `atelier-planning.js`, `intro.js` (retirer `vignette: true`), `css/base.css`, `css/pages/galerie.css`, `css/pages/contact.css`, `css/pages/intro.css` (garder), exports mal placés.
- **Ordre** : variables JS prouvées inutiles → exports → keyframes CSS → déplacement `retourC/retourNB`.
- **À ne pas toucher dans ce lot** : `rejoue`, `NB_COMMUNES_ADRESSE` (laisser un commentaire), les variantes « 2 », `alt0-4`, `.lb-fond`.
- **Vérifications** : ESLint temporaire sans `no-unused-vars` ; recette B sur toutes les pages ; console propre.

#### Lot 2 · Règles métier et constantes
- **Constats** : CC-01, CC-28, CC-15 (partie 1 : variables `:root` sans remplacement).
- **Fichiers** : `data/tarifs.js`, `js/lib/format.js`, `js/lib/brouillon.js`, `js/pages/simulateur.js`, `js/pages/preciser.js`, `js/pages/atelier-dossier-logique.js`, `js/pages/atelier-clients-logique.js`, `css/base.css` (variables).
- **Ordre** : constantes dans `tarifs.js` → `format.js` → `brouillon.js` → pages.
- **Vérifications** : tests CC-26 + totaux sur 3 devis + libellés (voir CC-01).

#### Lot 3 · Cycle de vie de l'en-tête et de la scène
- **Constats** : CC-03, CC-07.
- **Fichiers** : `js/lib/entete.js`, `js/lib/scene.js`, `js/lib/vagabond.js`, `accueil.js`, `apropos.js`, `atelier-planning.js`, `contact.js`, `galerie.js`, `services.js`.
- **Ordre** : correctif d'écouteur → `gx` dans `mesures` → remplacement des 8 lectures.
- **Vérifications** : Recette A à 4 largeurs + rejeu de l'intro (CC-03).

#### Lot 4 · Utilitaires partagés
- **Constats** : CC-06, CC-08 (partie « importer `E` »), CC-21.
- **Fichiers** : `js/lib/format.js` (`hhmm`), nouveau `js/lib/validation.js`, `js/lib/dom.js` (`cheminSvg`, `cadrePhoto`), nouveau `js/lib/liens.js`, `routeur.js`, `intro.js`, `surligneur.js`, `vagabond.js`, `galerie.js`, `preciser.js`, `simulateur.js`, `atelier-planning-production-logique.js`.
- **Ordre** : `hhmm` → `EMAIL_RE` → `structuredClone` → `liens.js` → import de `E`. **Reporter `setMot`** au lot 6 (voir CC-06).
- **Vérifications** : tests ; heures de la frise ; fondu de sortie de l'intro identique (recette B).

#### Lot 5 · CSS dupliqué
- **Constats** : CC-11 (point 1 seulement).
- **Fichiers** : `css/atelier.css` (ajout), `css/pages/atelier-catalogue.css`, `atelier-catalogue2.css`, `atelier-clients.css`, `planning.css`, `production.css`, `contact.css` (retraits).
- **Ordre** : `diff` octet par octet des blocs → déplacer → retirer des pages une à une.
- **Vérifications** : recette A et `getComputedStyle` sur `.ico`, `.err`, `.flux`, `.champ select`, `a.btn.encre`.

#### Lot 6 · Accessibilité (comportement, sans rendu)
- **Constats** : CC-18, CC-19, CC-20 (partie CSS seulement), CC-02 (autocomplete/validation).
- **Fichiers** : nouveau `js/lib/modale.js`, `accueil.js`, `galerie.js`, `atelier-dossier-logique.js`, `mes-dossiers.js`, `simulateur.js`, `preciser.js`, les `.html` concernés (`role="main"`, boutons), `atelier-shell.js`, `css/base.css`.
- **Ordre** : `role="main"` → `autocomplete` → modales → `a`→`button` (en dernier ; contrôler `a.btn.encre` dans les CSS).
- **Vérifications** : clavier seul ; recette A sur les contrôles modifiés.

#### Lot 7 · Routeur et amorce
- **Constats** : CC-16, CC-17.
- **Fichiers** : `js/amorce.js`, `js/lib/routeur.js`, nouveau `js/lib/pages.js`.
- **Ordre** : `try/catch` d'`amorce` → liste blanche → `AbortController` → test de séquence avant retrait du CSS → `popstate` ancre. **Un seul changement à la fois**, test de 20 navigations rapides entre chaque.
- **Vérifications** : voir CC-16. **Ne pas toucher** l'ordre visuel de la transition.

#### Lot 8 · Déduplication `simulateur` / `preciser`
- **Constats** : CC-04, CC-05, CC-08 (variante « rapide »).
- **Fichiers** : nouveaux `js/lib/frise.js`, `js/lib/panneau-compte.js` ; `js/lib/anim.js`, `js/lib/entete.js` ; `simulateur.js`, `preciser.js`, `contact.js`, `accueil.js`, `galerie.js`.
- **Ordre** : `bande`/`hh` → `animationsEntete` unique → `rythme(K, { rapide })` → panneau compte. Après chaque étape : recettes A/B/C sur les deux pages.
- **Risque : moyen**.

#### Lot 9 · Suppression de `reserve/` (après accord explicite)
- **Constats** : CC-12.
- **Fichiers** : `maquette/reserve/` (suppression ou déplacement), `preciser.js:1`, `simulateur.js:7-8`, `README.md`.
- **Vérifications** : Grep `reserve` = 0.

#### Lot 10 · En-têtes de déploiement (après accord)
- **Constats** : CC-25.
- **Fichiers** : `maquette/vercel.json`.
- **Vérifications** : déploiement de **prévisualisation** puis console sans violation de CSP (Content Security Policy).

#### Lot 11 · Gros découpages (optionnel, à la demande)
- **Constats** : CC-13, CC-14, CC-22 (renommage), CC-27.
- **Fichiers** : `galerie.js` (réindentation), `accueil.js` (extraction de `rectsMosaique` vers `js/lib/mosaique.js`), `atelier-shell.js` (nettoyage de `#fond`), `atelier-catalogue2-logique.js` (renommage).
- **Risque : élevé** pour `accueil.js`/`preciser.js` : **ne pas** les redécouper sans demande.

---

## 5. Quick wins (moins d'une heure, risque nul)

Aucun ne modifie le rendu ni le comportement.

1. **Supprimer les variables mortes** d'`accueil.js` (`R` ligne 86 et l'import `rythme`, `navI` ligne 88, `const vignette` ligne 94 et son commentaire ligne 109), de `galerie.js` (`R` ligne 14, `tNav`/`tTq` ligne 61), de `vagabond.js` (`tPas` ligne 22), `H` d'`entete.js:95`, `E` de `routeur.js:14` et `surligneur.js:20`. *(CC-09)*
2. **Retirer les imports inutiles** : `mot` (`atelier-catalogue-logique.js:4`), `PROCH` (`atelier-dossier.js:10`), `texte` et `hm` (`simulateur.js:12,15`), `CW` (`atelier-planning.js:25`). *(CC-09)*
3. **Supprimer 7 `@keyframes` jamais appelés** : `hlIn`, `rIn2`, `melt2`, `reform`, `haloIn`, `derive2` dans `base.css`, `habille2` dans `galerie.css`, et le `melt` de `base.css` (celui d'`intro.css` gagne déjà). *(CC-10)*
4. **Dédoublonner `retourC`/`retourNB`** : les mettre dans `base.css`, les retirer de `contact.css` et `galerie.css`. *(CC-10)*
5. **Retirer le mot `export`** des éléments utilisés seulement dans leur fichier : `MP`, `PAGES` (`atelier-shell.js`), `OMBRES` (`params.js`), `montrerFenetre` (`scene.js`), `$$` si vraiment inutilisé (`dom.js`). *(CC-09)*
6. **Supprimer `vignette: true`** passé par `intro.js:64` (option jamais lue). *(CC-09)*
7. **Ajouter `.gitattributes` (`* text=auto eol=lf`) et `.editorconfig`** (sans renormaliser les fichiers existants tout de suite). *(CC-24)*
8. **Mettre à jour le README** : ajouter `preciser.html` à la carte des pages ; citer `surligneur.js`, `vagabond.js`, `brouillon.js` ; corriger « aucun effet de bord à l'import » (intro hors contrat) ; supprimer le commentaire obsolète `simulateur.js:7-8`. *(CC-23)*
9. **Ajouter `role="main"` sur `#contenu`** dans les 26 `.html` (ajout d'attribut, aucun effet visuel). *(CC-19)*
10. **`autocomplete="new-password"`** sur `#sub-mdp` (`simulateur.html:114`, `preciser.html:181`) et `autocomplete="current-password"` sur `#sup-mdp` (`mes-dossiers.html:71`). *(CC-02)*
11. **Écrire un glossaire de 6 lignes** (T, H, DR, DV, TR, W) en tête de `js/lib/anim.js`. *(CC-22)*
12. **Remplacer `JSON.parse(JSON.stringify(...))` par `structuredClone(...)`** (3 occurrences, objets simples). *(CC-06)*
