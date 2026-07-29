# Module — CMS admin
> PortfolioPhotographe · Brainstorm module · 2026-07-29
> Portée : back-office d'Ernest (compte unique) pour gérer photos, textes, tarifs,
> catalogue d'options à la carte, champs du dossier client, et suivi des leads. Aucune
> messagerie intégrée en MVP.

---

## 1. Concept

Un dashboard admin séparé (pas d'édition inline sur le site public) avec une sidebar à
6 sections. Objectif : autonomie totale d'Ernest sur le contenu et les tarifs du site,
sans jamais toucher au code ni redéployer.

## 2. Navigation

Sidebar, 6 sections (reste dans la règle "max 5-7 options par groupe" du CLAUDE.md
global) :

1. **Photos** — bibliothèque + catégories
2. **Textes** — champs nommés du site
3. **Tarifs & Formules** — prix des 3 formules + paramètres du calculateur km
4. **Services à la carte** — catalogue d'options du dossier (voir `DOSSIER.md`)
5. **Champs du dossier** — form builder de la logistique jour J (voir `DOSSIER.md` §3.2)
6. **Leads** — liste et suivi des demandes

Auth : Supabase Auth (email/password), compte unique (Ernest). Toutes les routes
`/admin/*` protégées par middleware Next.js — jamais de logique d'autorisation
uniquement côté client.

## 3. Photos — bibliothèque + catégories

- Upload libre vers une bibliothèque commune. Chaque photo est taguée par
  **catégorie** :
  - Catégories **slot unique** (une seule photo active à la fois) : `hero`,
    `about-portrait`, `about-travail`, `timeline-05h`, `timeline-14h`, `timeline-19h`,
    `timeline-23h`.
  - Catégorie **multi** : `galerie` — plusieurs photos actives simultanément
    (actuellement 3 affichées en page d'accueil), ordonnables (`ordre_affichage`), le
    reste de la bibliothèque taguée `galerie` reste en réserve pour une future page
    Galerie complète (v2).
- Dans chaque catégorie slot-unique, activer une photo désactive automatiquement
  l'ancienne (un seul `actif = true` possible par catégorie).
- Upload sécurisé : le fichier transite par une route serveur authentifiée qui
  l'envoie à Cloudinary via le SDK (clé API jamais exposée côté client), puis stocke
  `url_cloudinary` + `public_id_cloudinary` en DB.
- Suppression avec confirmation. Si la photo supprimée était la seule active d'une
  catégorie slot-unique, la section correspondante du site s'affiche sans image
  (dégradation propre, pas de crash) — un avertissement visuel dans l'admin signale
  les catégories sans photo active.

## 4. Textes — champs nommés

Liste de champs clairement étiquetés (pas d'éditeur clé/valeur brut) :

| Champ | Emplacement sur le site |
|-------|--------------------------|
| Titre principal (hero) | Hero — H1 |
| Sous-titre (hero) | Hero — paragraphe |
| Titre section À propos | About — H2 |
| Texte À propos | About — paragraphe |
| Citation témoignage | Section témoignage |
| Auteur témoignage | Section témoignage |

Stockage : table `contenus_site` (clé/valeur) déjà prévue dans `FONDATION.md`, mais
l'UI admin masque les clés techniques derrière des libellés humains.

## 5. Tarifs & Formules

- Édition des 3 formules : nom, prix de base, description, actif/inactif.
- Édition des paramètres du calculateur km : adresse de base, rayon gratuit (km),
  tarif/km.
- **Changer l'adresse de base déclenche un nouveau géocodage** (une seule fois, à la
  sauvegarde — voir `DEVIS.md` §6) pour rafraîchir les coordonnées stockées.
- Toute sauvegarde invalide le cache de données du site public (`revalidateTag`) pour
  que les nouveaux prix soient immédiatement visibles — pas de délai de propagation.

## 6. Services à la carte

CRUD complet sur `services_carte` (voir `DOSSIER.md` §7) : créer, modifier,
activer/désactiver, réordonner. Champs : nom, description, prix, image (Cloudinary),
catégorie, actif. Désactiver un service déjà présent dans un dossier client en cours ne
le supprime pas de ce dossier (snapshot déjà figé — voir `DOSSIER.md` §5).

## 6bis. Champs du dossier — form builder

Interface de construction du questionnaire logistique dynamique (`dossier_champs`, voir
`DOSSIER.md` §3.2) :

- Liste des champs actuels, groupés par section, réordonnables (drag & drop).
- Ajout d'un champ : libellé, type (texte court / texte long / date / heure / nombre /
  email / téléphone / choix unique / choix multiple), section de regroupement,
  obligatoire ou non.
- Pour les types choix unique/multiple : gestion des options possibles (liste libre).
- Désactivation plutôt que suppression par défaut (préserve l'historique des réponses
  déjà données — voir `DOSSIER.md` §3.2). Suppression définitive possible mais avec
  avertissement explicite sur la perte de traçabilité historique.
- Aperçu du formulaire tel que le client le verra, avant publication.

## 7. Leads — liste & suivi

- Liste filtrable par statut (`nouveau` / `configuré` / `contacté` / `signé`).
- Fiche lead : détail complet (formule, options si configuré, ville, date mariage,
  message), changement de statut, **notes internes** libres (horodatées) pour garder
  trace des échanges sans dépendre de la mémoire.
- Bouton **"Répondre par email"** : ouvre le client mail par défaut (`mailto:`) avec
  l'adresse du lead pré-remplie — pas de messagerie intégrée en MVP (webhook email
  entrant + stockage de threads = chantier v2, explicitement écarté pour l'instant).

## 8. Cas limites — base de tests

| # | Scénario | Comportement attendu |
|---|----------|----------------------|
| 1 | Upload d'un fichier non-image | Rejeté, message d'erreur clair |
| 2 | Suppression de la seule photo active d'un slot unique | Section du site sans image, avertissement visible dans l'admin |
| 3 | Activation d'une nouvelle photo dans une catégorie slot-unique | L'ancienne photo active repasse automatiquement inactive |
| 4 | Désactivation du dernier service actif d'une catégorie du configurateur | Catégorie vide côté configurateur, pas de crash |
| 5 | Changement d'adresse de base | Re-géocodage déclenché, nouvelles coordonnées utilisées dès le prochain calcul de devis |
| 6 | Sauvegarde d'un tarif | Prix visible immédiatement sur le site public (pas de cache périmé) |
| 7 | Accès à `/admin/*` sans session | Redirection vers la page de login |
| 8 | Session admin expirée en cours d'édition | Redirection propre au login, pas de perte silencieuse de données déjà saisies |
| 9 | Deux onglets admin ouverts, édition simultanée du même champ | Dernière sauvegarde gagne (pas de verrou optimiste en MVP — acceptable, usage mono-utilisateur) |
| 10 | Désactivation d'un champ du dossier déjà répondu par des clients | Réponses existantes conservées et lisibles, champ absent des nouveaux dossiers |
| 11 | Suppression définitive (pas juste désactivation) d'un champ du dossier | Avertissement explicite sur la perte de traçabilité avant confirmation |

## 9. Sécurité

- Middleware Next.js protège toutes les routes `/admin/*` (vérification session
  Supabase côté serveur, jamais côté client seul).
- Upload de fichiers : validation du type MIME et de la taille côté serveur avant envoi
  à Cloudinary.
- RLS Supabase : écriture sur `photos`, `contenus_site`, `formules`,
  `parametres_tarifs`, `services_carte`, `dossier_champs` réservée au rôle admin
  authentifié ; lecture publique pour l'affichage du site.
- Notes internes sur les leads : jamais exposées publiquement, lecture réservée à
  l'admin (déjà couvert par la RLS sur `leads`).

## 10. Prochaines étapes

- [ ] Implémenter l'auth admin + middleware de protection `/admin`
- [ ] Construire la sidebar + les 5 sections
- [ ] Upload Cloudinary sécurisé (route serveur signée)
- [ ] CRUD `services_carte`, édition `formules`/`parametres_tarifs`/`contenus_site`
- [ ] Form builder `dossier_champs` (ajout/édition/réordonnancement/désactivation)
- [ ] Dashboard leads (liste, statut, notes internes, lien mailto)
- [ ] Idée v2 à garder en tête : messagerie intégrée avec historique des échanges (webhook email entrant)
