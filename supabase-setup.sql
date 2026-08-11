create table if not exists public.app_store (
  id text primary key,
  payload text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_store enable row level security;

revoke all on table public.app_store from anon, authenticated;
