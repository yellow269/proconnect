-- ProConnect initial schema. Run via `supabase db push`.
create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.user_role as enum ('customer','professional','admin');
create type public.job_status as enum ('draft','open','quoted','assigned','in_progress','completed','cancelled');
create type public.quote_status as enum ('pending','accepted','rejected','withdrawn');
create type public.subscription_plan as enum ('free','pro','business');
create type public.subscription_status as enum ('inactive','trialing','active','past_due','cancelled');
create type public.notification_type as enum ('job','quote','review','subscription','system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text check (phone is null or char_length(phone) <= 30),
  avatar_url text,
  city text,
  province text,
  location geography(point,4326),
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  bio text check (char_length(bio) <= 2000),
  website text,
  years_experience smallint check (years_experience between 0 and 80),
  verified boolean not null default false,
  available boolean not null default true,
  average_rating numeric(3,2) not null default 0 check (average_rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 120),
  description text check (char_length(description) <= 2000),
  price_from numeric(12,2) check (price_from >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, category_id, title)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (char_length(title) between 5 and 160),
  description text not null check (char_length(description) between 20 and 5000),
  status public.job_status not null default 'draft',
  budget_min numeric(12,2) check (budget_min >= 0),
  budget_max numeric(12,2) check (budget_max >= budget_min),
  city text not null,
  province text not null,
  location geography(point,4326),
  desired_date date,
  assigned_professional_id uuid references public.professional_profiles(user_id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_images (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  message text not null check (char_length(message) between 10 and 3000),
  estimated_days integer check (estimated_days > 0),
  status public.quote_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, professional_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  response text check (char_length(response) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, professional_id),
  check (customer_id <> professional_id)
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  title text not null,
  description text,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  unique (professional_id, weekday, start_time)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null unique references public.professional_profiles(user_id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'inactive',
  payfast_token text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','job','review')),
  subject_id uuid not null,
  reason text not null check (char_length(reason) between 10 and 1000),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index profiles_location_idx on public.profiles using gist(location);
create index profiles_role_idx on public.profiles(role);
create index jobs_discovery_idx on public.jobs(status, category_id, province, city, published_at desc);
create index jobs_customer_idx on public.jobs(customer_id, created_at desc);
create index jobs_location_idx on public.jobs using gist(location);
create index quotes_job_idx on public.quotes(job_id, status);
create index quotes_professional_idx on public.quotes(professional_id, created_at desc);
create index reviews_professional_idx on public.reviews(professional_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index services_category_idx on public.services(category_id) where active;

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, role)
  values(new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
    case when new.raw_user_meta_data->>'role' = 'professional' then 'professional'::public.user_role else 'customer'::public.user_role end);
  return new;
end; $$;

create function public.update_professional_rating() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid := coalesce(new.professional_id, old.professional_id);
begin
  update public.professional_profiles p set average_rating = coalesce(s.avg_rating,0), review_count = coalesce(s.total,0)
  from (select round(avg(rating)::numeric,2) avg_rating, count(*) total from public.reviews where professional_id=target) s
  where p.user_id=target;
  return coalesce(new,old);
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger professional_profiles_updated before update on public.professional_profiles for each row execute function public.set_updated_at();
create trigger services_updated before update on public.services for each row execute function public.set_updated_at();
create trigger jobs_updated before update on public.jobs for each row execute function public.set_updated_at();
create trigger quotes_updated before update on public.quotes for each row execute function public.set_updated_at();
create trigger reviews_updated before update on public.reviews for each row execute function public.set_updated_at();
create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger conversations_updated before update on public.conversations for each row execute function public.set_updated_at();
create trigger reviews_rating after insert or update or delete on public.reviews for each row execute function public.update_professional_rating();

alter table public.profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.jobs enable row level security;
alter table public.job_images enable row level security;
alter table public.quotes enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.availability enable row level security;
alter table public.subscriptions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

create policy "profiles publicly readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid() and role=(select role from public.profiles where id=auth.uid()));
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "professional profiles readable" on public.professional_profiles for select using (true);
create policy "professionals manage business" on public.professional_profiles for all using (user_id=auth.uid()) with check (user_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='professional'));
create policy "categories readable" on public.categories for select using (active or public.is_admin());
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "services readable" on public.services for select using (active or professional_id=auth.uid() or public.is_admin());
create policy "professionals manage services" on public.services for all using (professional_id=auth.uid()) with check (professional_id=auth.uid());
create policy "open jobs visible" on public.jobs for select using (status not in ('draft','cancelled') or customer_id=auth.uid() or assigned_professional_id=auth.uid() or public.is_admin());
create policy "customers create jobs" on public.jobs for insert with check (customer_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='customer'));
create policy "customers update own jobs" on public.jobs for update using (customer_id=auth.uid()) with check (customer_id=auth.uid());
create policy "customers delete draft jobs" on public.jobs for delete using (customer_id=auth.uid() and status='draft');
create policy "admins manage jobs" on public.jobs for all using (public.is_admin()) with check (public.is_admin());
create policy "job images follow job visibility" on public.job_images for select using (exists(select 1 from public.jobs where id=job_id));
create policy "job owners manage images" on public.job_images for all using (exists(select 1 from public.jobs where id=job_id and customer_id=auth.uid())) with check (exists(select 1 from public.jobs where id=job_id and customer_id=auth.uid()));
create policy "quote parties read" on public.quotes for select using (professional_id=auth.uid() or exists(select 1 from public.jobs where id=job_id and customer_id=auth.uid()) or public.is_admin());
create policy "professionals submit quotes" on public.quotes for insert with check (professional_id=auth.uid() and exists(select 1 from public.jobs where id=job_id and status in ('open','quoted')));
create policy "professionals update pending quotes" on public.quotes for update using (professional_id=auth.uid() and status='pending') with check (professional_id=auth.uid());
create policy "reviews readable" on public.reviews for select using (true);
create policy "customers review completed jobs" on public.reviews for insert with check (customer_id=auth.uid() and exists(select 1 from public.jobs where id=job_id and customer_id=auth.uid() and assigned_professional_id=professional_id and status='completed'));
create policy "customers update reviews" on public.reviews for update using (customer_id=auth.uid()) with check (customer_id=auth.uid());
create policy "favorites private" on public.favorites for all using (customer_id=auth.uid()) with check (customer_id=auth.uid());
create policy "portfolio readable" on public.portfolio_items for select using (true);
create policy "professionals manage portfolio" on public.portfolio_items for all using (professional_id=auth.uid()) with check (professional_id=auth.uid());
create policy "availability readable" on public.availability for select using (true);
create policy "professionals manage availability" on public.availability for all using (professional_id=auth.uid()) with check (professional_id=auth.uid());
create policy "subscriptions owner readable" on public.subscriptions for select using (professional_id=auth.uid() or public.is_admin());
create policy "admins manage subscriptions" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());
create policy "notifications private" on public.notifications for select using (user_id=auth.uid());
create policy "users mark notifications read" on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "users create reports" on public.reports for insert with check (reporter_id=auth.uid());
create policy "users read own reports" on public.reports for select using (reporter_id=auth.uid() or public.is_admin());
create policy "admins manage reports" on public.reports for all using (public.is_admin()) with check (public.is_admin());
create policy "conversations participants read" on public.conversations for select using (customer_id=auth.uid() or professional_id=auth.uid());
create policy "conversations participants insert" on public.conversations for insert with check (customer_id=auth.uid() or professional_id=auth.uid());
create policy "messages participants read" on public.messages for select using (exists(select 1 from public.conversations where id=conversation_id and (customer_id=auth.uid() or professional_id=auth.uid())));
create policy "messages participants insert" on public.messages for insert with check (sender_id=auth.uid() and exists(select 1 from public.conversations where id=conversation_id and (customer_id=auth.uid() or professional_id=auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('portfolio','portfolio',true,10485760,array['image/jpeg','image/png','image/webp']),
 ('job-images','job-images',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public images readable" on storage.objects for select using (bucket_id in ('avatars','portfolio'));
create policy "users upload own public images" on storage.objects for insert with check (bucket_id in ('avatars','portfolio') and (storage.foldername(name))[1]=auth.uid()::text);
create policy "users manage own public images" on storage.objects for update using (bucket_id in ('avatars','portfolio') and owner_id=auth.uid()::text);
create policy "users delete own public images" on storage.objects for delete using (bucket_id in ('avatars','portfolio') and owner_id=auth.uid()::text);
create policy "job parties read job images" on storage.objects for select using (bucket_id='job-images' and exists(select 1 from public.jobs j where j.id::text=(storage.foldername(name))[1] and (j.customer_id=auth.uid() or j.assigned_professional_id=auth.uid() or public.is_admin())));
create policy "customers upload job images" on storage.objects for insert with check (bucket_id='job-images' and exists(select 1 from public.jobs j where j.id::text=(storage.foldername(name))[1] and j.customer_id=auth.uid()));

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;
