# Canvas smartphone (DA Morphic)

Sources des planches du canvas « DA Morphic — Smartphone » (https://claude.ai/artifact/18ENQTSvUHonk7GaAB1BoJ).
Les fichiers vivent dans l'Artifact ; cette copie sert d'archive et de référence pour l'implémentation.

- `Parcours.dc.html` : parcours complet sur une seule planche (intro, accueil, galerie, services, simulateur, compte). Il garde les écrans chargés, enchaîne sortie puis entrée, et porte la navigation persistante (bannière Ernest H. en haut, menu de verre en bas avec sous-navigation, inclinaison 3D).
- `PIntro`, `PAccueil`, `PGalerie`, `PServices`, `PSimulateur`, `PCompte` : pièces du parcours (à éditer ici, le parcours les importe).
- `Main`, `AccueilIndex`, `AccueilFil`, `Intro` : historique des 3 structures d'accueil (C « Fil » retenue).
- Photos et grain : assets de l'Artifact (identifiants `/_blob/...`), non copiés ici.
