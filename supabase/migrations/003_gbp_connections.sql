-- Migration 003: Google Business Profile OAuth connections
-- Run in Supabase SQL editor or via `supabase db push`

create table if not exists gbp_connections (
  id              uuid        primary key default gen_random_uuid(),
  studio_slug     text        not null unique,
  google_email    text,
  access_token    text,
  refresh_token   text,
  token_expiry    timestamptz,
  gbp_account_id  text,
  gbp_location_id text,
  rating          numeric(3,1),
  review_count    int,
  last_synced_at  timestamptz default now(),
  created_at      timestamptz default now()
);

-- Index for fast lookup by slug (already unique but explicit index helps query planner)
create index if not exists gbp_connections_slug_idx on gbp_connections (studio_slug);

-- Row-level security: service role only (no public access to tokens)
alter table gbp_connections enable row level security;

-- Only the service role (server-side) can read/write GBP connections
create policy "Service role full access to gbp_connections"
  on gbp_connections
  for all
  to service_role
  using (true)
  with check (true);

-- Comment
comment on table gbp_connections is
  'OAuth tokens and live rating data from Google Business Profile for Featured-tier studios.';
comment on column gbp_connections.studio_slug      is 'Matches the dance_studio WP post slug.';
comment on column gbp_connections.gbp_location_id  is 'GBP API location name, e.g. accounts/123/locations/456.';
comment on column gbp_connections.rating           is 'Live Google star rating (1.0–5.0).';
comment on column gbp_connections.review_count     is 'Live Google review count.';
comment on column gbp_connections.last_synced_at   is 'Last time /api/gbp/sync updated this row.';
