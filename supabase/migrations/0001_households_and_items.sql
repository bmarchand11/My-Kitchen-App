-- Households, their members, and the food each household has.
-- Everyone in a household can see and change that household's food; nobody else can.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx on public.household_members (user_id);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  sticker text not null,
  section_id text not null,
  quantity numeric not null default 1 check (quantity >= 0),
  unit text not null default '',
  expires_on date,
  added_on date not null default current_date,
  added_by uuid default auth.uid() references auth.users (id) on delete set null,
  added_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_household_id_idx on public.items (household_id);

create function public.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- Security definer so policies can check membership without recursing into
-- household_members' own policy.
create function public.is_household_member(target uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = target and m.user_id = auth.uid()
  );
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.items enable row level security;

create policy "Members can see their household"
  on public.households for select to authenticated
  using (public.is_household_member(id));

create policy "Members can rename their household"
  on public.households for update to authenticated
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

create policy "Members can see who else is in the household"
  on public.household_members for select to authenticated
  using (public.is_household_member(household_id));

create policy "People can leave a household"
  on public.household_members for delete to authenticated
  using (user_id = auth.uid());

create policy "Members can see household food"
  on public.items for select to authenticated
  using (public.is_household_member(household_id));

create policy "Members can add household food"
  on public.items for insert to authenticated
  with check (public.is_household_member(household_id));

create policy "Members can change household food"
  on public.items for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Members can remove household food"
  on public.items for delete to authenticated
  using (public.is_household_member(household_id));

-- Households are created and joined only through these functions, so the
-- creator or joiner is always added as a member in the same step.
create function public.create_household(household_name text, member_name text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.households;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  insert into public.households (name, created_by)
    values (trim(household_name), auth.uid())
    returning * into created;
  insert into public.household_members (household_id, user_id, display_name)
    values (created.id, auth.uid(), trim(member_name));
  return created;
end;
$$;

create function public.join_household(code text, member_name text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  found public.households;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  select * into found from public.households where invite_code = upper(trim(code));
  if found.id is null then
    raise exception 'No household has that invite code';
  end if;
  insert into public.household_members (household_id, user_id, display_name)
    values (found.id, auth.uid(), trim(member_name))
    on conflict (household_id, user_id) do nothing;
  return found;
end;
$$;

revoke execute on function public.create_household(text, text) from public, anon;
revoke execute on function public.join_household(text, text) from public, anon;
revoke execute on function public.is_household_member(uuid) from public, anon;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;

-- Let phones in the same household see each other's changes live.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.items;
  end if;
end;
$$;
