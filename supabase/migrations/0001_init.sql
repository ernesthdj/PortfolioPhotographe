-- PortfolioPhotographe — schema initial
-- Regroupe : modules Devis (docs/modules/DEVIS.md), Dossier (docs/modules/DOSSIER.md),
-- CMS (docs/modules/CMS.md), vue d'ensemble FONDATION.md §3.

-- =========================================================================
-- Admin
-- =========================================================================

create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- Trigger générique pour updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- Module Devis (DEVIS.md)
-- =========================================================================

create table formules (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prix_base numeric(10, 2) not null,
  description text,
  ordre_affichage int not null default 0,
  actif boolean not null default true
);

-- Singleton : une seule ligne, contrainte via id fixe applicatif (pas de PK forcée
-- singleton en SQL pur — le code applicatif lit/écrit toujours la même ligne).
create table parametres_tarifs (
  id uuid primary key default gen_random_uuid(),
  adresse_base text not null,
  lat numeric(9, 6),
  lon numeric(9, 6),
  rayon_gratuit_km numeric(6, 2) not null default 0,
  tarif_par_km numeric(6, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create trigger parametres_tarifs_updated_at
  before update on parametres_tarifs
  for each row execute function set_updated_at();

create table leads (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  telephone text not null,
  date_mariage date not null,
  ville_zone text,
  lat numeric(9, 6),
  lon numeric(9, 6),
  distance_km numeric(7, 2),
  nombre_invites int,
  formule_id uuid references formules (id),
  prix_estime numeric(10, 2),
  message text,
  statut text not null default 'nouveau'
    check (statut in ('nouveau', 'configure', 'contacte', 'signe')),
  created_at timestamptz not null default now()
);

create index leads_email_idx on leads (email);
create index leads_statut_idx on leads (statut);

-- Anti-spam (DEVIS.md §6) — pas de Redis/Upstash, comptage par IP en DB.
create table rate_limit_log (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_log_ip_created_idx on rate_limit_log (ip, created_at);

-- =========================================================================
-- Module Dossier (DOSSIER.md)
-- =========================================================================

create table dossiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lead_id uuid references leads (id),
  formule_id uuid references formules (id),
  statut text not null default 'brouillon'
    check (statut in ('brouillon', 'envoye')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index dossiers_user_id_idx on dossiers (user_id);

create trigger dossiers_updated_at
  before update on dossiers
  for each row execute function set_updated_at();

create table services_carte (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  prix numeric(10, 2) not null,
  image_url text,
  categorie text,
  actif boolean not null default true,
  ordre_affichage int not null default 0
);

create table dossier_options (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  service_id uuid not null references services_carte (id),
  prix_snapshot numeric(10, 2) not null,
  disponible_snapshot boolean not null default true,
  created_at timestamptz not null default now(),
  unique (dossier_id, service_id)
);

create table dossier_champs (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  cle text not null unique,
  type text not null
    check (type in (
      'texte_court', 'texte_long', 'date', 'heure', 'nombre',
      'email', 'telephone', 'choix_unique', 'choix_multiple'
    )),
  options_json jsonb,
  obligatoire boolean not null default false,
  section text,
  ordre_affichage int not null default 0,
  actif boolean not null default true
);

create table dossier_reponses (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  champ_id uuid not null references dossier_champs (id),
  valeur text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dossier_id, champ_id)
);

create trigger dossier_reponses_updated_at
  before update on dossier_reponses
  for each row execute function set_updated_at();

-- =========================================================================
-- Module CMS (CMS.md)
-- =========================================================================

create table photos (
  id uuid primary key default gen_random_uuid(),
  url_cloudinary text not null,
  public_id_cloudinary text not null,
  titre text,
  categorie text not null
    check (categorie in (
      'hero', 'about-portrait', 'about-travail',
      'timeline-05h', 'timeline-14h', 'timeline-19h', 'timeline-23h',
      'galerie'
    )),
  ordre_affichage int not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create index photos_categorie_idx on photos (categorie);

create table contenus_site (
  id uuid primary key default gen_random_uuid(),
  cle text not null unique,
  valeur text
);

-- =========================================================================
-- RLS
-- =========================================================================

alter table formules enable row level security;
alter table parametres_tarifs enable row level security;
alter table leads enable row level security;
alter table rate_limit_log enable row level security;
alter table dossiers enable row level security;
alter table services_carte enable row level security;
alter table dossier_options enable row level security;
alter table dossier_champs enable row level security;
alter table dossier_reponses enable row level security;
alter table photos enable row level security;
alter table contenus_site enable row level security;
alter table admin_users enable row level security;

-- Lecture publique des données d'affichage du site
create policy "formules_public_read" on formules
  for select using (actif = true);
create policy "formules_admin_write" on formules
  for all using (is_admin()) with check (is_admin());

-- parametres_tarifs contient l'adresse perso d'Ernest : jamais de lecture publique,
-- le calcul de devis passe toujours par une Server Action (clé service).
create policy "parametres_tarifs_admin_only" on parametres_tarifs
  for all using (is_admin()) with check (is_admin());

create policy "services_carte_public_read" on services_carte
  for select using (actif = true);
create policy "services_carte_admin_write" on services_carte
  for all using (is_admin()) with check (is_admin());

create policy "dossier_champs_public_read" on dossier_champs
  for select using (actif = true);
create policy "dossier_champs_admin_write" on dossier_champs
  for all using (is_admin()) with check (is_admin());

create policy "photos_public_read" on photos
  for select using (actif = true);
create policy "photos_admin_write" on photos
  for all using (is_admin()) with check (is_admin());

create policy "contenus_site_public_read" on contenus_site
  for select using (true);
create policy "contenus_site_admin_write" on contenus_site
  for all using (is_admin()) with check (is_admin());

-- leads : aucun accès direct client (insertion via Server Action + clé service),
-- lecture/écriture réservées à l'admin.
create policy "leads_admin_all" on leads
  for all using (is_admin()) with check (is_admin());

-- rate_limit_log : aucun accès client, uniquement clé service (Server Action).
-- (pas de policy public — RLS activée sans policy = tout refusé sauf service role)

-- dossiers et sous-tables : le client authentifié ne voit/modifie que son dossier.
create policy "dossiers_owner_all" on dossiers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dossiers_admin_read" on dossiers
  for select using (is_admin());

create policy "dossier_options_owner_all" on dossier_options
  for all using (
    exists (select 1 from dossiers d where d.id = dossier_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from dossiers d where d.id = dossier_id and d.user_id = auth.uid())
  );
create policy "dossier_options_admin_read" on dossier_options
  for select using (is_admin());

create policy "dossier_reponses_owner_all" on dossier_reponses
  for all using (
    exists (select 1 from dossiers d where d.id = dossier_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from dossiers d where d.id = dossier_id and d.user_id = auth.uid())
  );
create policy "dossier_reponses_admin_read" on dossier_reponses
  for select using (is_admin());

-- admin_users : lecture réservée à l'admin lui-même (pas d'écriture via API — géré
-- manuellement en base par Ernest lors de la création de son propre compte).
create policy "admin_users_self_read" on admin_users
  for select using (auth.uid() = user_id);
