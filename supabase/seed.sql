-- Données de départ — valeurs indicatives, toutes éditables ensuite depuis le CMS.

insert into formules (nom, prix_base, description, ordre_affichage, actif) values
  ('Event unique', 350, 'Une prestation ciblée sur un moment précis de votre journée.', 1, true),
  ('Demi-journée', 650, 'Couverture sur une demi-journée — préparatifs ou cérémonie et réception.', 2, true),
  ('Journée complète', 1250, 'De l''aube des préparatifs à la dernière danse.', 3, true);

-- Adresse de base indicative — À CORRIGER par Ernest depuis le CMS (redéclenche un
-- géocodage automatique, voir docs/modules/DEVIS.md §6).
insert into parametres_tarifs (adresse_base, rayon_gratuit_km, tarif_par_km) values
  ('Bruxelles, Belgique', 15, 1.5);

insert into services_carte (nom, description, prix, categorie, actif, ordre_affichage) values
  ('Album photo', 'Album relié, sélection de vos meilleurs moments.', 150, 'produit', true, 1),
  ('Coffret photo gravé laser', 'Coffret en bois gravé, tirages inclus.', 80, 'produit', true, 2),
  ('Studio ambulant', 'Setup studio sur place (Godox AD600 Pro II).', 200, 'prestation', true, 3),
  ('Shooting mariés seuls', 'Séance en tenue, lieu de votre choix, sans les invités — idéal en solution de repli si pluie le jour J.', 120, 'prestation', true, 4);

insert into dossier_champs (libelle, cle, type, obligatoire, section, ordre_affichage, actif) values
  ('Adresse exacte du lieu de cérémonie', 'adresse_ceremonie', 'texte_court', true, 'Lieu & horaire', 1, true),
  ('Adresse exacte du lieu de réception (si différent)', 'adresse_reception', 'texte_court', false, 'Lieu & horaire', 2, true),
  ('Heure de début souhaitée', 'heure_debut', 'heure', true, 'Lieu & horaire', 3, true),
  ('Nombre d''invités précis', 'nombre_invites_precis', 'nombre', false, 'Lieu & horaire', 4, true),
  ('Contact wedding planner / salle', 'contact_prestataire', 'texte_court', false, 'Contacts', 5, true),
  ('Souhaits particuliers / contraintes', 'notes_libres', 'texte_long', false, 'Souhaits particuliers', 6, true);

insert into contenus_site (cle, valeur) values
  ('hero_titre', 'Je photographie la lumière qui ne repasse pas.'),
  ('hero_soustitre', 'De l''aube des préparatifs à la dernière danse — un fil du temps, pas une liste de poses.'),
  ('about_titre', 'Chaque mariage a son propre grain de lumière.'),
  ('about_texte', 'Je m''adapte à votre journée plutôt que de l''imposer dans un style unique — parfois cinématique, parfois épuré et doux — toujours documentaire, toujours discret.'),
  ('temoignage_citation', 'Il a su capturer des moments qu''on n''aurait même pas remarqués nous-mêmes.'),
  ('temoignage_auteur', 'Clémence & Antoine');
