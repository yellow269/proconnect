-- ProConnect Storefront tables: bookings, storefront settings, service enhancements

-- ============================================================
-- 1. Enhance services table
-- ============================================================

alter table public.services add column if not exists pricing_type text not null default 'starting_from'
  check (pricing_type in ('fixed','starting_from','quote'));
alter table public.services add column if not exists fixed_price numeric(12,2) check (fixed_price >= 0);
alter table public.services add column if not exists duration_minutes integer check (duration_minutes > 0);
alter table public.services add column if not exists image_url text;
alter table public.services add column if not exists sort_order integer not null default 0;

-- ============================================================
-- 2. service_bookings table
-- ============================================================

create table public.service_bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  booking_date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  status text not null default 'pending'
    check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','deposit_paid','paid','refunded')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  deposit_amount numeric(12,2) check (deposit_amount is null or deposit_amount >= 0),
  notes text check (notes is null or char_length(notes) <= 2000),
  address text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_bookings_professional_idx on public.service_bookings(professional_id, booking_date, status);
create index service_bookings_customer_idx on public.service_bookings(customer_id, created_at desc);
create index service_bookings_date_idx on public.service_bookings(booking_date, start_time, end_time) where status not in ('cancelled');
create index service_bookings_service_idx on public.service_bookings(service_id);

-- ============================================================
-- 3. professional_storefront_settings table
-- ============================================================

create table public.professional_storefront_settings (
  user_id uuid primary key references public.professional_profiles(user_id) on delete cascade,
  whatsapp_number text,
  custom_description text,
  cover_image_url text,
  service_area text,
  show_portfolio boolean not null default true,
  show_reviews boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. Triggers for updated_at
-- ============================================================

create trigger service_bookings_updated before update on public.service_bookings for each row execute function public.set_updated_at();
create trigger professional_storefront_settings_updated before update on public.professional_storefront_settings for each row execute function public.set_updated_at();

-- ============================================================
-- 5. Enable RLS
-- ============================================================

alter table public.service_bookings enable row level security;
alter table public.professional_storefront_settings enable row level security;

-- ============================================================
-- 6. RLS Policies — service_bookings
-- ============================================================

-- Anyone can see bookings (needed for double-booking check by service)
-- but customer/professional details are protected by their own table policies
create policy "bookings readable by parties"
  on public.service_bookings for select
  using (
    customer_id = auth.uid()
    or professional_id = auth.uid()
    or public.is_admin()
  );

-- Customers can create bookings
create policy "customers create bookings"
  on public.service_bookings for insert
  with check (
    customer_id = auth.uid()
    and exists(select 1 from public.profiles where id = auth.uid() and role = 'customer')
  );

-- Professional can update status of their bookings
create policy "professionals update booking status"
  on public.service_bookings for update
  using (professional_id = auth.uid())
  with check (professional_id = auth.uid());

-- Customer can cancel their own bookings
create policy "customers cancel own bookings"
  on public.service_bookings for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid() and status = 'cancelled');

-- Admins can manage all bookings
create policy "admins manage bookings"
  on public.service_bookings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 7. RLS Policies — professional_storefront_settings
-- ============================================================

-- Storefront settings are publicly readable (for public storefront page)
create policy "storefront settings readable"
  on public.professional_storefront_settings for select
  using (true);

-- Professionals manage their own settings
create policy "professionals manage storefront"
  on public.professional_storefront_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 8. Function: check double-booking
-- ============================================================

create or replace function public.has_booking_conflict(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.service_bookings
    where professional_id = p_professional_id
      and booking_date = p_date
      and status not in ('cancelled')
      and (p_exclude_booking_id is null or id != p_exclude_booking_id)
      and (start_time, end_time) overlaps (p_start_time, p_end_time)
  );
$$;

-- ============================================================
-- 9. Function: get available time slots for a professional on a date
-- ============================================================

create or replace function public.get_available_slots(
  p_professional_id uuid,
  p_date date,
  p_duration_minutes integer
)
returns table(slot_start time, slot_end time)
language sql
stable
security definer
set search_path = ''
as $$
  with availability_for_day as (
    select start_time, end_time
    from public.availability
    where professional_id = p_professional_id
      and weekday = extract(dow from p_date)::int
  ),
  possible_slots as (
    select
      a.start_time + (gs.n * (p_duration_minutes || ' minutes')::interval) as slot_start,
      a.start_time + ((gs.n + 1) * (p_duration_minutes || ' minutes')::interval) as slot_end
    from availability_for_day a
    cross join generate_series(0, 100) as gs(n)
    where a.start_time + ((gs.n + 1) * (p_duration_minutes || ' minutes')::interval) <= a.end_time
  )
  select ps.slot_start, ps.slot_end
  from possible_slots ps
  where not public.has_booking_conflict(
    p_professional_id,
    p_date,
    ps.slot_start::time,
    ps.slot_end::time
  )
  order by ps.slot_start;
$$;

-- ============================================================
-- 10. Add service_bookings to realtime
-- ============================================================

alter publication supabase_realtime add table public.service_bookings;
