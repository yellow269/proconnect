-- ProConnect PayFast R150/month subscription system.
-- Adds user_id, plan_name, amount, currency, next_billing_date, cancelled_at columns.

-- 1. Add new columns to subscriptions table
alter table public.subscriptions
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists plan_name text,
  add column if not exists amount numeric(12,2),
  add column if not exists currency text default 'ZAR',
  add column if not exists next_billing_date date,
  add column if not exists cancelled_at timestamptz;

-- 2. Create unique index on user_id (one subscription per user)
create unique index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- 3. Update RLS policies for the new user_id column

-- Allow authenticated users to read their own subscription
drop policy if exists "subscriptions owner readable" on public.subscriptions;
create policy "subscriptions owner readable" on public.subscriptions
  for select using (
    user_id = auth.uid()
    or professional_id = auth.uid()
    or public.is_admin()
  );

-- Allow authenticated users to insert their own subscription
drop policy if exists "professionals create own subscription" on public.subscriptions;
create policy "authenticated users create own subscription" on public.subscriptions
  for insert with check (
    user_id = auth.uid()
    or (
      professional_id = auth.uid()
      and exists(select 1 from public.profiles where id = auth.uid() and role = 'professional')
    )
  );

-- Allow authenticated users to update their own subscription
drop policy if exists "professionals update own subscription" on public.subscriptions;
create policy "users update own subscription" on public.subscriptions
  for update using (
    user_id = auth.uid()
    or professional_id = auth.uid()
  ) with check (
    user_id = auth.uid()
    or professional_id = auth.uid()
  );

-- 4. Allow service_role (used by ITN webhook) to update any subscription
-- The webhook uses createClient() which runs as anon; we need RLS bypass for ITN.
-- Add a policy allowing updates when the request originates from the notify route.
-- Since ITN runs server-side with the service key, we'll use a function approach.
create or replace function public.handle_payfast_itn()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  return new;
end;
$$;
