-- Evaluate auth.uid() once per query and index the remaining foreign keys.
alter policy "People can leave a household" on public.household_members
  using (user_id = (select auth.uid()));

create index households_created_by_idx on public.households (created_by);
create index items_added_by_idx on public.items (added_by);
