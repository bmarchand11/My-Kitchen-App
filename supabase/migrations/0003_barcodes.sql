-- Barcode scanning: remember which barcode an item came from, and what each
-- household calls a scanned product so the next scan fills itself in.

alter table public.items add column barcode text check (char_length(barcode) between 4 and 32);

create table public.household_products (
  household_id uuid not null references public.households (id) on delete cascade,
  barcode text not null check (char_length(barcode) between 4 and 32),
  name text not null check (char_length(name) between 1 and 100),
  sticker text not null,
  section_id text not null,
  unit text not null default '',
  updated_at timestamptz not null default now(),
  primary key (household_id, barcode)
);

create trigger household_products_touch_updated_at
  before update on public.household_products
  for each row execute function public.touch_updated_at();

alter table public.household_products enable row level security;

create policy "Members can see household products"
  on public.household_products for select to authenticated
  using (public.is_household_member(household_id));

create policy "Members can add household products"
  on public.household_products for insert to authenticated
  with check (public.is_household_member(household_id));

create policy "Members can change household products"
  on public.household_products for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
