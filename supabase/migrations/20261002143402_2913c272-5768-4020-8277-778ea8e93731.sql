create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select to authenticated using (true);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled document',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;

create table public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  shared_with uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  unique (document_id, shared_with)
);
grant select, insert, update, delete on public.document_shares to authenticated;
grant all on public.document_shares to service_role;
alter table public.document_shares enable row level security;

create or replace function public.is_document_shared_with(_user_id uuid, _document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.document_shares
    where document_id = _document_id and shared_with = _user_id
  )
$$;

create policy "Owners can read own documents" on public.documents for select to authenticated using (auth.uid() = owner_id);
create policy "Shared users can read documents" on public.documents for select to authenticated using (public.is_document_shared_with(auth.uid(), id));
create policy "Owners can insert documents" on public.documents for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update documents" on public.documents for update to authenticated using (auth.uid() = owner_id);
create policy "Owners can delete documents" on public.documents for delete to authenticated using (auth.uid() = owner_id);

create policy "Owners can manage shares" on public.document_shares for all to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()))
  with check (exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()));
create policy "Recipients can read their shares" on public.document_shares for select to authenticated using (auth.uid() = shared_with);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger set_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();