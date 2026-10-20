-- ProConnect: free first service listing + ProConnect Professional (R50/month) enforcement.
--
-- Additive and non-destructive:
--   * Adds a tracking column to professional_profiles (defaults to false).
--   * Backfills professionals who already have service listings so they do
--     NOT receive a second free listing.
--   * Never deletes or modifies existing professional profiles or services.
--   * Enforces the rules with a database trigger on NEW service inserts only,
--     so updates and deletes of existing services are unaffected.
--   * Customer job posting (public.jobs) is untouched.

-- ============================================================
-- 1. Track whether a professional used their one-time free listing
-- ============================================================

alter table public.professional_profiles
  add column if not exists free_listing_used boolean not null default false;

-- ============================================================
-- 2. Backfill: anyone who already has a service listing has used
--    their free listing and must not receive another one.
-- ============================================================

update public.professional_profiles pp
set free_listing_used = true
where exists (
  select 1
  from public.services s
  where s.professional_id = pp.user_id
);

-- ============================================================
-- 3. Helper: does this professional have an active, unexpired
--    subscription? Expired billing periods never count as active.
-- ============================================================

create or replace function public.has_active_subscription(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.professional_id = p_professional_id
      and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

grant execute on function public.has_active_subscription(uuid) to authenticated, service_role;

-- ============================================================
-- 4. Enforcement trigger: first service listing free, once.
--    Additional inserts require an active subscription.
--    Runs BEFORE INSERT on public.services only.
-- ============================================================

create or replace function public.enforce_service_listing_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professional_id uuid := coalesce(new.professional_id, auth.uid());
  v_free_listing_used boolean;
begin
  -- Platform operators (service role / admins) bypass the gate so
  -- support tooling and seeding keep working.
  if coalesce(auth.role(), '') = 'service_role' or public.is_admin() then
    return new;
  end if;

  -- Lock the profile row so two simultaneous inserts cannot both
  -- consume the single free listing.
  select pp.free_listing_used
    into v_free_listing_used
  from public.professional_profiles pp
  where pp.user_id = v_professional_id
  for update;

  if not found then
    raise exception 'SUBSCRIPTION_REQUIRED: No professional profile found for this account.'
      using errcode = 'P0001';
  end if;

  if v_free_listing_used then
    -- Free listing already used: an active subscription is required.
    if not public.has_active_subscription(v_professional_id) then
      raise exception 'SUBSCRIPTION_REQUIRED: Your first service listing was free. An active ProConnect Professional subscription (R50/month) is required to add more service listings.'
        using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- Consume the one-time free listing.
  perform set_config('proconnect.free_listing_enforced', 'on', true);
  update public.professional_profiles
  set free_listing_used = true
  where user_id = v_professional_id;

  return new;
end;
$$;

drop trigger if exists services_enforce_listing_rules on public.services;
create trigger services_enforce_listing_rules
  before insert on public.services
  for each row
  execute function public.enforce_service_listing_rules();

-- ============================================================
-- 5. Guard: professionals must not reset their own free listing flag.
--    Only the enforcement trigger, admins and the service role may
--    change free_listing_used.
-- ============================================================

create or replace function public.protect_free_listing_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.free_listing_used is distinct from old.free_listing_used
     and coalesce(current_setting('proconnect.free_listing_enforced', true), '') <> 'on'
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    new.free_listing_used := old.free_listing_used;
  end if;
  return new;
end;
$$;

drop trigger if exists professional_profiles_protect_free_listing on public.professional_profiles;
create trigger professional_profiles_protect_free_listing
  before update on public.professional_profiles
  for each row
  execute function public.protect_free_listing_flag();
