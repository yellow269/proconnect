-- Add payfast_subscription_id to subscriptions table.
alter table public.subscriptions
  add column if not exists payfast_subscription_id text;

-- Allow professionals to insert their own subscription (for checkout initiation).
drop policy if exists "professionals create own subscription" on public.subscriptions;
create policy "professionals create own subscription" on public.subscriptions
  for insert with check (
    professional_id = auth.uid()
    and exists(select 1 from public.profiles where id = auth.uid() and role = 'professional')
  );

-- Allow professionals to update their own subscription (for plan changes).
drop policy if exists "professionals update own subscription" on public.subscriptions;
create policy "professionals update own subscription" on public.subscriptions
  for update using (
    professional_id = auth.uid()
  ) with check (
    professional_id = auth.uid()
  );
