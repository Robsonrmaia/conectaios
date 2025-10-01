-- =============== Tabelas (idempotente) ===============
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_participants (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  type text not null default 'text' check (type in ('text','image','system')),
  status text not null default 'sent' check (status in ('sent','delivered','read')),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists idx_chat_messages_thread_created
  on public.chat_messages (thread_id, created_at desc);

-- =============== RLS ===============
alter table public.chat_threads      enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages     enable row level security;

-- Threads: só vê quem participa; cria quem é o autor
drop policy if exists chat_threads_select on public.chat_threads;
create policy chat_threads_select on public.chat_threads
for select using (
  exists (
    select 1 from public.chat_participants p
    where p.thread_id = public.chat_threads.id
      and p.user_id   = auth.uid()
  )
);

drop policy if exists chat_threads_insert on public.chat_threads;
create policy chat_threads_insert on public.chat_threads
for insert with check (auth.uid() = created_by);

-- Participants: só vê quem está no mesmo thread; entra o próprio usuário
drop policy if exists chat_participants_select on public.chat_participants;
create policy chat_participants_select on public.chat_participants
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.chat_participants p2
    where p2.thread_id = public.chat_participants.thread_id
      and p2.user_id   = auth.uid()
  )
);

drop policy if exists chat_participants_insert on public.chat_participants;
create policy chat_participants_insert on public.chat_participants
for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.chat_threads t where t.id = thread_id)
);

-- Messages: só vê/enviam participantes; sender precisa ser o usuário logado
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages
for select using (
  exists (
    select 1 from public.chat_participants p
    where p.thread_id = public.chat_messages.thread_id
      and p.user_id   = auth.uid()
  )
);

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages
for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_participants p
    where p.thread_id = public.chat_messages.thread_id
      and p.user_id   = auth.uid()
  )
);

-- =============== Trigger: criador entra no thread automaticamente ===============
create or replace function public.chat_add_creator()
returns trigger language plpgsql as $$
begin
  insert into public.chat_participants(thread_id, user_id)
  values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end$$;

drop trigger if exists trg_chat_add_creator on public.chat_threads;
create trigger trg_chat_add_creator
after insert on public.chat_threads
for each row execute function public.chat_add_creator();