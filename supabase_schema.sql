-- ═══════════════════════════════════════════════════════════════
-- RideNow — Complete Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. USERS (public profile extending auth.users) ─────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('rider', 'driver', 'admin')) default 'rider',
  full_name   text,
  phone       text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

create policy "Admins can read all users"
  on public.users for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can update all users"
  on public.users for update
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- ── 2. DRIVERS ────────────────────────────────────────────────────
create table if not exists public.drivers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  vehicle_make   text not null,
  vehicle_model  text not null,
  vehicle_plate  text not null,
  vehicle_color  text,
  is_approved    boolean not null default false,
  is_available   boolean not null default false,
  rating_avg     numeric(3,2) default 5.00,
  total_trips    integer default 0,
  created_at     timestamptz not null default now(),
  unique(user_id)
);

alter table public.drivers enable row level security;

create policy "Drivers can read own record"
  on public.drivers for select using (auth.uid() = user_id);

create policy "Drivers can update own record"
  on public.drivers for update using (auth.uid() = user_id);

create policy "Drivers can insert own record"
  on public.drivers for insert with check (auth.uid() = user_id);

create policy "Riders can read approved drivers"
  on public.drivers for select
  using (is_approved = true);

create policy "Admins full access to drivers"
  on public.drivers for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- ── 3. RIDES ─────────────────────────────────────────────────────
create type ride_status as enum (
  'requested', 'matched', 'in_progress', 'completed', 'cancelled'
);

create table if not exists public.rides (
  id                   uuid primary key default gen_random_uuid(),
  rider_id             uuid not null references public.users(id),
  driver_id            uuid references public.drivers(id),
  status               ride_status not null default 'requested',
  pickup_address       text not null,
  destination_address  text not null,
  pickup_lat           numeric(10,7),
  pickup_lng           numeric(10,7),
  dest_lat             numeric(10,7),
  dest_lng             numeric(10,7),
  distance_km          numeric(8,2),
  fare_estimate        numeric(8,2),
  created_at           timestamptz not null default now(),
  matched_at           timestamptz,
  started_at           timestamptz,
  completed_at         timestamptz
);

create index rides_rider_id_idx     on public.rides(rider_id);
create index rides_driver_id_idx    on public.rides(driver_id);
create index rides_status_idx       on public.rides(status);
create index rides_created_at_idx   on public.rides(created_at desc);

alter table public.rides enable row level security;

create policy "Riders can read own rides"
  on public.rides for select using (auth.uid() = rider_id);

create policy "Riders can insert rides"
  on public.rides for insert with check (auth.uid() = rider_id);

create policy "Riders can cancel own rides"
  on public.rides for update
  using (auth.uid() = rider_id and status in ('requested'));

create policy "Drivers can read available + own rides"
  on public.rides for select
  using (
    status = 'requested'
    or driver_id = (select id from public.drivers where user_id = auth.uid())
  );

create policy "Drivers can accept/update rides"
  on public.rides for update
  using (
    driver_id = (select id from public.drivers where user_id = auth.uid())
    or (status = 'requested' and driver_id is null)
  );

create policy "Admins full access to rides"
  on public.rides for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- ── 4. LOCATIONS ─────────────────────────────────────────────────
create table if not exists public.locations (
  id          bigserial primary key,
  driver_id   uuid not null references public.drivers(id),
  ride_id     uuid references public.rides(id),
  lat         numeric(10,7) not null,
  lng         numeric(10,7) not null,
  recorded_at timestamptz not null default now()
);

create index locations_driver_id_idx on public.locations(driver_id, recorded_at desc);
create index locations_ride_id_idx   on public.locations(ride_id);

alter table public.locations enable row level security;

create policy "Drivers can insert own location"
  on public.locations for insert
  with check (driver_id = (select id from public.drivers where user_id = auth.uid()));

create policy "Drivers can read own location"
  on public.locations for select
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));

create policy "Riders can read location of their active ride driver"
  on public.locations for select
  using (
    ride_id in (
      select id from public.rides
      where rider_id = auth.uid()
      and status in ('matched', 'in_progress')
    )
  );

-- ── 5. EARNINGS ──────────────────────────────────────────────────
create table if not exists public.earnings (
  id         uuid primary key default gen_random_uuid(),
  driver_id  uuid not null references public.drivers(id),
  ride_id    uuid not null references public.rides(id),
  amount     numeric(8,2) not null,
  created_at timestamptz not null default now(),
  unique(ride_id)
);

create index earnings_driver_id_idx on public.earnings(driver_id, created_at desc);

alter table public.earnings enable row level security;

create policy "Drivers can read own earnings"
  on public.earnings for select
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));

create policy "Admins full access to earnings"
  on public.earnings for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- ── 6. RATINGS ───────────────────────────────────────────────────
create table if not exists public.ratings (
  id         uuid primary key default gen_random_uuid(),
  ride_id    uuid not null references public.rides(id),
  rater_id   uuid not null references public.users(id),
  ratee_id   uuid not null references public.users(id),
  score      integer not null check (score between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique(ride_id, rater_id)
);

alter table public.ratings enable row level security;

create policy "Users can insert their own ratings"
  on public.ratings for insert with check (auth.uid() = rater_id);

create policy "Users can read ratings about them"
  on public.ratings for select using (auth.uid() = rater_id or auth.uid() = ratee_id);

-- ── 7. STORED FUNCTION: complete_ride ────────────────────────────
-- Atomically completes a ride and creates an earnings record.
create or replace function public.complete_ride(ride_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_driver_id  uuid;
  v_fare       numeric(8,2);
  v_dist       numeric(8,2);
begin
  select driver_id, fare_estimate, distance_km
  into v_driver_id, v_fare, v_dist
  from public.rides
  where id = ride_id and status = 'in_progress';

  if not found then
    raise exception 'Ride not found or not in progress';
  end if;

  -- Update ride to completed
  update public.rides
  set status = 'completed', completed_at = now()
  where id = ride_id;

  -- Insert earnings record (driver keeps 80% of fare)
  insert into public.earnings (driver_id, ride_id, amount)
  values (v_driver_id, ride_id, round(coalesce(v_fare, 5.00) * 0.80, 2));

  -- Increment driver total trips
  update public.drivers
  set total_trips = total_trips + 1
  where id = v_driver_id;
end;
$$;

-- ── 8. TRIGGER: sync auth.users → public.users ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'rider'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 9. ENABLE REALTIME ────────────────────────────────────────────
-- Run in Supabase Dashboard → Database → Replication
-- or run these commands:
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.locations;
