create unique index if not exists uq_crm_admin_single_owner
  on public.crm_admin_users ((role))
  where role = 'owner';
