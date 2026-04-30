-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null default '',
  email text not null default '',
  plan text check (plan in ('single', 'triple')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  phone text,
  created_at timestamptz default now() not null
);

-- Addresses table
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip text not null,
  country text not null default 'US',
  created_at timestamptz default now() not null
);

-- Letters table
create table public.letters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  address_id uuid references public.addresses(id) on delete set null,
  photos jsonb not null default '[]',
  layout text not null default 'hero-2-below',
  photo_area_height integer not null default 45,
  photo_area_width integer not null default 100,
  font text not null default 'serif' check (font in ('handwritten', 'serif', 'sans')),
  font_size text not null default 'medium' check (font_size in ('small', 'medium', 'large')),
  letter_text text not null default '',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'printed', 'mailed')),
  month_year text not null,
  submitted_at timestamptz,
  printed_at timestamptz,
  mailed_at timestamptz,
  created_at timestamptz default now() not null
);

-- Monthly usage table
create table public.monthly_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  month_year text not null,
  count integer not null default 0,
  unique(user_id, month_year)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.letters enable row level security;
alter table public.monthly_usage enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- Addresses policies
create policy "Users can manage own addresses" on public.addresses
  for all using (auth.uid() = user_id);

-- Letters policies
create policy "Users can manage own letters" on public.letters
  for all using (auth.uid() = user_id);

-- Monthly usage policies
create policy "Users can view own usage" on public.monthly_usage
  for select using (auth.uid() = user_id);

create policy "Users can upsert own usage" on public.monthly_usage
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for letter photos
insert into storage.buckets (id, name, public)
values ('letter-photos', 'letter-photos', true);

create policy "Users can upload photos" on storage.objects
  for insert with check (
    bucket_id = 'letter-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Photos are publicly accessible" on storage.objects
  for select using (bucket_id = 'letter-photos');

create policy "Users can delete own photos" on storage.objects
  for delete using (
    bucket_id = 'letter-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
