-- Rode este arquivo uma vez no SQL Editor do seu projeto Supabase.
-- Guarda o estado de cada usuário como um documento JSON, protegido por Row Level Security.

create table if not exists public.user_data (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  data           jsonb       not null default '{}'::jsonb,
  schema_version integer     not null default 2,
  revision       integer     not null default 1,
  updated_at     timestamptz not null default now(),
  -- teto de segurança contra abuso (≈ 2 MB de JSON por usuário)
  constraint user_data_size check (octet_length(data::text) < 2000000)
);

alter table public.user_data enable row level security;

-- Cada usuário enxerga e altera apenas a própria linha.
drop policy if exists "user_data_select_own" on public.user_data;
drop policy if exists "user_data_insert_own" on public.user_data;
drop policy if exists "user_data_update_own" on public.user_data;
drop policy if exists "user_data_delete_own" on public.user_data;

create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = user_id);
create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_data_delete_own" on public.user_data
  for delete using (auth.uid() = user_id);

-- Mantém updated_at correto.
create or replace function public.touch_user_data() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_user_data on public.user_data;
create trigger trg_touch_user_data before update on public.user_data
  for each row execute function public.touch_user_data();
