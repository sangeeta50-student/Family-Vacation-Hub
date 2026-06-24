create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.family_trips (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  destination_city text,
  flights jsonb not null default '[]'::jsonb,
  hotels jsonb not null default '[]'::jsonb,
  cars jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_trips
add column if not exists sort_order integer not null default 0;

create index if not exists family_trips_family_sort_order_idx
on public.family_trips (family_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists family_trips_set_updated_at on public.family_trips;

create trigger family_trips_set_updated_at
before update on public.family_trips
for each row
execute function public.set_updated_at();

create or replace function public.is_family_member(check_family_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.family_members member
    where member.family_id = check_family_id
      and member.user_id = auth.uid()
  );
$$;

grant execute on function public.is_family_member(uuid) to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_trips enable row level security;

drop policy if exists "Members can view their family" on public.families;
create policy "Members can view their family"
on public.families
for select
to authenticated
using (
  coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  and public.is_family_member(families.id)
);

drop policy if exists "Members can view family members" on public.family_members;
create policy "Members can view family members"
on public.family_members
for select
to authenticated
using (
  coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  and public.is_family_member(family_members.family_id)
);

drop policy if exists "Members can view trips" on public.family_trips;
create policy "Members can view trips"
on public.family_trips
for select
to authenticated
using (
  coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  and public.is_family_member(family_trips.family_id)
);

drop policy if exists "Members can create trips" on public.family_trips;
create policy "Members can create trips"
on public.family_trips
for insert
to authenticated
with check (
  coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  and public.is_family_member(family_trips.family_id)
);

drop policy if exists "Members can update trips" on public.family_trips;
create policy "Members can update trips"
on public.family_trips
for update
to authenticated
using (
  coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  and public.is_family_member(family_trips.family_id)
)
with check (
  coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  and public.is_family_member(family_trips.family_id)
);

drop policy if exists "Members can delete trips" on public.family_trips;
create policy "Members can delete trips"
on public.family_trips
for delete
to authenticated
using (
  coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  and public.is_family_member(family_trips.family_id)
);

-- Run this once, copy the returned id, then use it for VITE_SUPABASE_FAMILY_ID.
-- insert into public.families (name)
-- values ('Your Family Name')
-- returning id;

-- After each family member creates an account, add them to the family.
-- Replace the UUID and email values.
-- insert into public.family_members (family_id, user_id, role)
-- select 'YOUR_FAMILY_UUID', id, 'member'
-- from auth.users
-- where email in ('you@example.com', 'family@example.com');
