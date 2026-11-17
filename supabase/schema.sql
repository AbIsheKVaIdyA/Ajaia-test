-- ajaia-docs schema
-- Run this in the Supabase SQL Editor.
--
-- Auth is mocked in the app (a cookie stores the selected user id), so the
-- Data API is used with the publishable key (maps to the Postgres anon role).
-- RLS is enabled; policies allow the anon role to access these tables.
-- Real authorization is enforced in the app.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  title text not null default 'Untitled document',
  content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_shares (
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

grant select on public.users to anon;
grant select, insert, update, delete on public.documents to anon;
grant select, insert, delete on public.document_shares to anon;

drop policy if exists "anon can read users" on public.users;
create policy "anon can read users"
on public.users
for select
to anon
using (true);

drop policy if exists "anon can read documents" on public.documents;
create policy "anon can read documents"
on public.documents
for select
to anon
using (true);

drop policy if exists "anon can insert documents" on public.documents;
create policy "anon can insert documents"
on public.documents
for insert
to anon
with check (true);

drop policy if exists "anon can update documents" on public.documents;
create policy "anon can update documents"
on public.documents
for update
to anon
using (true)
with check (true);

drop policy if exists "anon can delete documents" on public.documents;
create policy "anon can delete documents"
on public.documents
for delete
to anon
using (true);

drop policy if exists "anon can read shares" on public.document_shares;
create policy "anon can read shares"
on public.document_shares
for select
to anon
using (true);

drop policy if exists "anon can insert shares" on public.document_shares;
create policy "anon can insert shares"
on public.document_shares
for insert
to anon
with check (true);

drop policy if exists "anon can delete shares" on public.document_shares;
create policy "anon can delete shares"
on public.document_shares
for delete
to anon
using (true);

insert into public.users (id, name, email)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alice', 'alice@demo.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob', 'bob@demo.com'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Carol', 'carol@demo.com')
on conflict (email) do nothing;
