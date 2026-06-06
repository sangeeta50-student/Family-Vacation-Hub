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
