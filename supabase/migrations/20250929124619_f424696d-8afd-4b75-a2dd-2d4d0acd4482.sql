-- Garantir índice para lookup case-insensitive por username
create unique index if not exists ux_brokers_username_ci
  on public.brokers (lower(username))
  where username is not null and username <> '';

-- Garantir RLS está habilitado
alter table public.brokers enable row level security;
alter table public.minisite_configs enable row level security;

-- Leitura PÚBLICA (anon + authenticated) de corretores ATIVOS com username definido.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='brokers' and policyname='brokers_public_minisite'
  ) then
    create policy brokers_public_minisite
    on public.brokers
    for select
    to anon, authenticated
    using (
      coalesce(status,'active') = 'active'
      and username is not null and username <> ''
    );
  end if;
end $$;

-- Leitura PÚBLICA da config do minisite apenas quando o dono é um corretor "ativo" com username
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='minisite_configs' and policyname='minisite_configs_public_minisite'
  ) then
    create policy minisite_configs_public_minisite
    on public.minisite_configs
    for select
    to anon, authenticated
    using (
      exists (
        select 1 from public.brokers b
        where b.user_id = minisite_configs.user_id
          and coalesce(b.status,'active')='active'
          and b.username is not null and b.username <> ''
      )
    );
  end if;
end $$;