-- Entrée directe dans le Dossier (sans être passé par le devis rapide) — voir
-- docs/modules/DOSSIER.md §2. Un lead peut alors être créé avec seulement l'email
-- connu (Ernest complète le reste manuellement depuis le CMS, ex: après un appel).
alter table leads alter column nom drop not null;
alter table leads alter column telephone drop not null;
alter table leads alter column date_mariage drop not null;
