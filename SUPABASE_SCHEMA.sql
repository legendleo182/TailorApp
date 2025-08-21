-- Auth is handled by Supabase Auth (email/password)
-- Tables: shops, customers, bills

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now(),
  owner uuid references auth.users(id) on delete cascade
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  created_at timestamp with time zone default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  stitching_amount numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  status text not null check (status in ('paid_sf','unpaid')) default 'unpaid',
  image_url text,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.shops enable row level security;
alter table public.customers enable row level security;
alter table public.bills enable row level security;

-- Policies: each user can CRUD rows where they are the owner (shops) or related via shop_id
create policy "users can read own shops" on public.shops
  for select using (auth.uid() = owner);
create policy "users can insert own shops" on public.shops
  for insert with check (auth.uid() = owner);
create policy "users can update own shops" on public.shops
  for update using (auth.uid() = owner);
create policy "users can delete own shops" on public.shops
  for delete using (auth.uid() = owner);

create policy "users read customers of own shops" on public.customers
  for select using (exists (
    select 1 from public.shops s where s.id = customers.shop_id and s.owner = auth.uid()
  ));
create policy "users modify customers of own shops" on public.customers
  for all using (exists (
    select 1 from public.shops s where s.id = customers.shop_id and s.owner = auth.uid()
  )) with check (exists (
    select 1 from public.shops s where s.id = customers.shop_id and s.owner = auth.uid()
  ));

create policy "users read bills of own shops" on public.bills
  for select using (exists (
    select 1 from public.shops s where s.id = bills.shop_id and s.owner = auth.uid()
  ));
create policy "users modify bills of own shops" on public.bills
  for all using (exists (
    select 1 from public.shops s where s.id = bills.shop_id and s.owner = auth.uid()
  )) with check (exists (
    select 1 from public.shops s where s.id = bills.shop_id and s.owner = auth.uid()
  ));

-- Trigger to set owner on insert if not provided
create or replace function public.set_owner_default()
returns trigger as $$
begin
  if new.owner is null then
    new.owner := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_shops_owner on public.shops;
create trigger set_shops_owner before insert on public.shops
for each row execute function public.set_owner_default();

-- Storage: create a bucket named 'bills' and make it public
-- Run in Supabase Storage UI or SQL:
-- select storage.create_bucket('bills', public := true);

-- Storage RLS Policies for 'bills' bucket
-- Allow public read
create policy if not exists "public read bills" on storage.objects
  for select using (bucket_id = 'bills');

-- Allow authenticated users to upload
create policy if not exists "authenticated upload bills" on storage.objects
  for insert to authenticated with check (bucket_id = 'bills');

-- Allow owners to update/delete their own files
create policy if not exists "owners update bills" on storage.objects
  for update to authenticated using (bucket_id = 'bills' and owner = auth.uid()) with check (bucket_id = 'bills' and owner = auth.uid());
create policy if not exists "owners delete bills" on storage.objects
  for delete to authenticated using (bucket_id = 'bills' and owner = auth.uid());


