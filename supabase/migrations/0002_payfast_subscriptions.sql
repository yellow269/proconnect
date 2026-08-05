-- Add payfast_subscription_id to subscriptions table.
alter table public.subscriptions
  add column payfast_subscription_id text;

-- Allow professionals to insert their own subscription (for checkout initiation).
create policy "professionals create own subscription" on public.subscriptions
  for insert with check (
    professional_id = auth.uid()
    and exists(select 1 from public.profiles where id = auth.uid() and role = 'professional')
  );

-- Allow professionals to update their own subscription (for plan changes).
create policy "professionals update own subscription" on public.subscriptions
  for update using (
    professional_id = auth.uid()
  ) with check (
    professional_id = auth.uid()
  );
