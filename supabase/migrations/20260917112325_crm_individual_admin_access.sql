-- Individual CRM administrator profiles, user-managed access keys, and revocable sessions.
create table if not exists public.crm_admin_users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 2 and 100),
  email text,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  access_key_hash text not null unique,
  active boolean not null default true,
  last_login_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text
);

create table if not exists public.crm_admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.crm_admin_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_crm_admin_users_active on public.crm_admin_users(active);
create index if not exists idx_crm_admin_sessions_user on public.crm_admin_sessions(admin_user_id);
create index if not exists idx_crm_admin_sessions_token_active
  on public.crm_admin_sessions(token_hash, expires_at)
  where revoked_at is null;

alter table public.crm_admin_users enable row level security;
alter table public.crm_admin_sessions enable row level security;
alter table public.crm_admin_users force row level security;
alter table public.crm_admin_sessions force row level security;

revoke all on table public.crm_admin_users from public, anon, authenticated;
revoke all on table public.crm_admin_sessions from public, anon, authenticated;
grant all on table public.crm_admin_users to service_role;
grant all on table public.crm_admin_sessions to service_role;

comment on table public.crm_admin_users is
  'Private CRM administrator directory. Access keys are stored only as keyed hashes.';
comment on table public.crm_admin_sessions is
  'Private revocable CRM administrator sessions. Browser tokens are stored only as hashes.';
