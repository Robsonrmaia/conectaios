-- 1) Brokers: garantir upsert por user_id e username único "case-insensitive"
create unique index if not exists ux_brokers_user_id on public.brokers(user_id);
create unique index if not exists ux_brokers_username_ci
  on public.brokers (lower(username))
  where username is not null and username <> '';

-- 2) RLS de brokers: dono pode ler/escrever
alter table public.brokers enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='brokers' and policyname='brokers_owner_rw'
  ) then
    create policy brokers_owner_rw
    on public.brokers
    for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;

-- 3) minisite_configs: garantir 1 por usuário (usado como provisionamento do minisite)
create unique index if not exists ux_minisite_configs_user on public.minisite_configs(user_id);

alter table public.minisite_configs enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='minisite_configs' and policyname='minisite_configs_owner_rw'
  ) then
    create policy minisite_configs_owner_rw
    on public.minisite_configs
    for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;

-- 4) gatilho de updated_at (caso falte)
create or replace function public.fn_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='tg_brokers_updated') then
    create trigger tg_brokers_updated before update on public.brokers
    for each row execute procedure public.fn_set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname='tg_minisite_configs_updated') then
    create trigger tg_minisite_configs_updated before update on public.minisite_configs
    for each row execute procedure public.fn_set_updated_at();
  end if;
end $$;