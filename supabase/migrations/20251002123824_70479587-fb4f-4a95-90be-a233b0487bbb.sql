-- === MENSAGERIA: Tabelas e RLS (idempotente) =========================
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean default false,
  created_by uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table if not exists public.chat_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null,
  role text default 'member',
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique(thread_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null,
  body text not null,
  content text,
  attachments jsonb default '[]'::jsonb,
  reply_to_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chat_receipts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null,
  status text default 'delivered',
  delivered_at timestamptz default now(),
  read_at timestamptz,
  created_at timestamptz default now(),
  unique(message_id, user_id)
);

-- RLS
alter table public.chat_threads enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_receipts enable row level security;

-- Drop existing policies if they exist
drop policy if exists chat_threads_participants on public.chat_threads;
drop policy if exists chat_participants_member on public.chat_participants;
drop policy if exists chat_messages_thread_participants on public.chat_messages;
drop policy if exists chat_receipts_access on public.chat_receipts;

-- Create new policies
create policy chat_threads_participants on public.chat_threads
for all using (
  exists (select 1 from public.chat_participants p where p.thread_id = chat_threads.id and p.user_id = auth.uid() and p.left_at is null)
);

create policy chat_participants_member on public.chat_participants
for all using (
  user_id = auth.uid()
  or exists (select 1 from public.chat_participants p where p.thread_id = chat_participants.thread_id and p.user_id = auth.uid() and p.left_at is null)
);

create policy chat_messages_thread_participants on public.chat_messages
for all using (
  exists (select 1 from public.chat_participants p where p.thread_id = chat_messages.thread_id and p.user_id = auth.uid() and p.left_at is null)
) with check (
  exists (select 1 from public.chat_participants p where p.thread_id = chat_messages.thread_id and p.user_id = auth.uid() and p.left_at is null)
);

create policy chat_receipts_access on public.chat_receipts
for all using (
  user_id = auth.uid()
  or exists (select 1 from public.chat_participants p where p.thread_id = chat_receipts.thread_id and p.user_id = auth.uid() and p.left_at is null)
);

-- Triggers de updated_at
create or replace function public.fn_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists tg_chat_threads_updated on public.chat_threads;
create trigger tg_chat_threads_updated before update on public.chat_threads
for each row execute procedure public.fn_set_updated_at();

drop trigger if exists tg_chat_messages_updated on public.chat_messages;
create trigger tg_chat_messages_updated before update on public.chat_messages
for each row execute procedure public.fn_set_updated_at();

-- RPC utilitárias
create or replace function public.find_or_create_direct_thread(user_a uuid, user_b uuid)
returns uuid
language plpgsql security definer set search_path=public as $$
declare t_id uuid;
begin
  select t.id into t_id
  from public.chat_threads t
  where t.is_group = false
    and exists (select 1 from public.chat_participants p1 where p1.thread_id=t.id and p1.user_id=user_a and p1.left_at is null)
    and exists (select 1 from public.chat_participants p2 where p2.thread_id=t.id and p2.user_id=user_b and p2.left_at is null)
  limit 1;

  if t_id is not null then return t_id; end if;

  insert into public.chat_threads (is_group, created_by) values (false, user_a) returning id into t_id;
  insert into public.chat_participants (thread_id, user_id) values (t_id, user_a), (t_id, user_b);
  return t_id;
end $$;

create or replace function public.send_message_new(p_thread_id uuid, p_body text, p_reply_to uuid default null)
returns public.chat_messages
language plpgsql security definer set search_path=public as $$
declare m public.chat_messages;
begin
  insert into public.chat_messages(thread_id, sender_id, body, content, reply_to_id)
  values (p_thread_id, auth.uid(), p_body, p_body, p_reply_to)
  returning * into m;
  
  update public.chat_threads set last_message_at = now(), updated_at = now() where id = p_thread_id;
  
  return m;
end $$;

-- === IMÓVEIS: permitir visibilidade simultânea ================================
alter table public.imoveis
  add column if not exists show_on_marketplace boolean not null default false,
  add column if not exists show_on_minisite     boolean not null default false;

-- Índices simples (opcional, idempotente)
create index if not exists idx_imoveis_marketplace on public.imoveis(is_public, show_on_marketplace);
create index if not exists idx_imoveis_minisite    on public.imoveis(is_public, show_on_minisite);