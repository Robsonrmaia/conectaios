-- cria bucket público "avatars" (id e name iguais) se não existir
insert into storage.buckets (id, name, public)
select 'avatars','avatars', true
where not exists (select 1 from storage.buckets where id='avatars');

-- policies para bucket avatars
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='avatars_public_read') then
    create policy avatars_public_read
    on storage.objects for select
    using (bucket_id = 'avatars');
  end if;

  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='avatars_auth_write') then
    create policy avatars_auth_write
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'avatars');
  end if;

  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='avatars_auth_update') then
    create policy avatars_auth_update
    on storage.objects for update
    to authenticated
    using (bucket_id = 'avatars')
    with check (bucket_id = 'avatars');
  end if;

  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='avatars_auth_delete') then
    create policy avatars_auth_delete
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'avatars');
  end if;
end $$;

-- profiles: dono pode ler/escrever sua própria linha
alter table public.profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_owner_rw') then
    create policy profiles_owner_rw on public.profiles
    for all using (id = auth.uid()) with check (id = auth.uid());
  end if;
end $$;

-- brokers: dono (via user_id) pode ler/escrever sua linha
alter table public.brokers enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='brokers' and policyname='brokers_owner_rw') then
    create policy brokers_owner_rw on public.brokers
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;