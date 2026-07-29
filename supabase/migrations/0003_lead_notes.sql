-- Notes internes horodatées sur les leads — voir docs/modules/CMS.md §7.
create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  contenu text not null,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_id_idx on lead_notes (lead_id);

alter table lead_notes enable row level security;

-- Jamais exposées publiquement — admin uniquement (CMS.md §9).
create policy "lead_notes_admin_all" on lead_notes
  for all using (is_admin()) with check (is_admin());
