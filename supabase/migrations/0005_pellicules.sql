-- Module Galerie (docs/modules/GALERIE.md) — page dediee "Pellicule" par mariage.
-- Table dediee plutot qu'extension de `photos` (dont la categorie est un CHECK
-- constraint ferme sur les emplacements uniques du site) — voir GALERIE.md §7.

create table pellicules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  noms_maries text not null,
  lieu text,
  date_mariage date,
  formule text,
  temoignage_citation text,
  temoignage_auteur text,
  actif boolean not null default false,
  ordre_affichage int not null default 0,
  created_at timestamptz not null default now()
);

create index pellicules_ordre_affichage_idx on pellicules (ordre_affichage);

create table pellicule_photos (
  id uuid primary key default gen_random_uuid(),
  pellicule_id uuid not null references pellicules (id) on delete cascade,
  url_cloudinary text not null,
  public_id_cloudinary text not null,
  titre text,
  ordre_affichage int not null default 0,
  created_at timestamptz not null default now()
);

create index pellicule_photos_pellicule_id_idx on pellicule_photos (pellicule_id);

alter table pellicules enable row level security;
alter table pellicule_photos enable row level security;

create policy "pellicules_public_read" on pellicules
  for select using (actif = true);
create policy "pellicules_admin_write" on pellicules
  for all using (is_admin()) with check (is_admin());

-- Photos publiques uniquement si la pellicule parente est publiee (meme si la ligne
-- photo elle-meme n'a pas de notion d'actif propre — le statut vit au niveau pellicule).
create policy "pellicule_photos_public_read" on pellicule_photos
  for select using (
    exists (select 1 from pellicules p where p.id = pellicule_id and p.actif = true)
  );
create policy "pellicule_photos_admin_write" on pellicule_photos
  for all using (is_admin()) with check (is_admin());
