-- ==============================================================================
-- WARUNG POS PRO - SUPABASE DATABASE SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ROLES & ROLE PERMISSIONS TABLES
-- ------------------------------------------------------------------------------
create table if not exists public.roles (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  description text default '',
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.roles enable row level security;

create policy "Users can view roles"
  on public.roles for select
  to authenticated
  using (true);

create policy "Users can insert roles"
  on public.roles for insert
  to authenticated
  with check (true);

create policy "Users can update roles"
  on public.roles for update
  to authenticated
  using (true);

create policy "Users can delete non-system roles"
  on public.roles for delete
  to authenticated
  using (is_system = false);

create table if not exists public.role_permissions (
  id text primary key default uuid_generate_v4()::text,
  role_id text references public.roles(id) on delete cascade not null,
  module text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.role_permissions enable row level security;

create policy "Users can view role permissions"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "Users can modify role permissions"
  on public.role_permissions for all
  to authenticated
  using (true);

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  auth_user_id text,
  name text not null default '',
  username text unique,
  email text not null default '',
  phone text default '',
  role_id text references public.roles(id) on delete set null default 'role-owner-admin',
  status text not null default 'active' check (status in ('active', 'disabled')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Users can view own profile or all profiles in business"
  on public.profiles for select
  using (auth.uid() = id or auth.uid() is not null);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or auth.uid() is not null);

create policy "Users can update profile"
  on public.profiles for update
  using (auth.uid() = id or auth.uid() is not null);

-- ------------------------------------------------------------------------------
-- 2. BUSINESS SETTINGS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.business_settings (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  business_name text not null default 'Warung Juara',
  business_type text not null default 'Warung',
  whatsapp_number text default '',
  address text default '',
  logo text default '',
  brand_color text not null default '#C6A85A',
  owner_name text default '',
  owner_email text default '',
  owner_phone text default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.business_settings enable row level security;

create policy "Users can view own business settings"
  on public.business_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own business settings"
  on public.business_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own business settings"
  on public.business_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own business settings"
  on public.business_settings for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.categories enable row level security;

create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null,
  selling_price numeric not null default 0,
  cogs numeric not null default 0,
  stock integer not null default 0,
  unit text not null default 'Pcs',
  barcode text default '',
  image text default '',
  min_stock_threshold integer not null default 5,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.products enable row level security;

create policy "Users can view own products"
  on public.products for select
  using (auth.uid() = user_id);

create policy "Users can insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "Users can update own products"
  on public.products for update
  using (auth.uid() = user_id);

create policy "Users can delete own products"
  on public.products for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. RESTOCKS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.restocks (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  product_name text not null default '',
  quantity integer not null default 0,
  purchase_cost_per_item numeric not null default 0,
  total_cost numeric not null default 0,
  previous_stock integer not null default 0,
  resulting_stock integer not null default 0,
  previous_cogs numeric not null default 0,
  new_cogs numeric not null default 0,
  date timestamptz not null default timezone('utc'::text, now()),
  notes text default ''
);

alter table public.restocks enable row level security;

create policy "Users can view own restocks"
  on public.restocks for select
  using (auth.uid() = user_id);

create policy "Users can insert own restocks"
  on public.restocks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own restocks"
  on public.restocks for update
  using (auth.uid() = user_id);

create policy "Users can delete own restocks"
  on public.restocks for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. ORDERS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  total numeric not null default 0,
  total_cogs numeric not null default 0,
  payment_method text not null default 'Cash',
  payment_status text not null default 'Paid',
  order_status text not null default 'Finished',
  cash_tendered numeric default 0,
  change_amount numeric default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id);

create policy "Users can delete own orders"
  on public.orders for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. ORDER ITEMS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.order_items (
  id text primary key default uuid_generate_v4()::text,
  order_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  product_name text not null default '',
  quantity integer not null default 1,
  selling_price numeric not null default 0,
  cogs numeric not null default 0,
  subtotal numeric not null default 0
);

alter table public.order_items enable row level security;

create policy "Users can view own order items"
  on public.order_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own order items"
  on public.order_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own order items"
  on public.order_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own order items"
  on public.order_items for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. REVENUES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.revenues (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null default 0,
  source text not null default 'Manual',
  order_id text default '',
  description text not null default '',
  date timestamptz not null default timezone('utc'::text, now()),
  notes text default ''
);

alter table public.revenues enable row level security;

create policy "Users can view own revenues"
  on public.revenues for select
  using (auth.uid() = user_id);

create policy "Users can insert own revenues"
  on public.revenues for insert
  with check (auth.uid() = user_id);

create policy "Users can update own revenues"
  on public.revenues for update
  using (auth.uid() = user_id);

create policy "Users can delete own revenues"
  on public.revenues for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. COSTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.costs (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null default 0,
  category text not null default 'Other',
  source text not null default 'Manual',
  restock_id text default '',
  description text not null default '',
  date timestamptz not null default timezone('utc'::text, now()),
  notes text default ''
);

alter table public.costs enable row level security;

create policy "Users can view own costs"
  on public.costs for select
  using (auth.uid() = user_id);

create policy "Users can insert own costs"
  on public.costs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own costs"
  on public.costs for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. BRANCHES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.branches (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  code text not null,
  address text default '',
  phone text default '',
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.branches enable row level security;

create policy "Users can view own branches"
  on public.branches for select
  using (auth.uid() = user_id);

create policy "Users can insert own branches"
  on public.branches for insert
  with check (auth.uid() = user_id);

create policy "Users can update own branches"
  on public.branches for update
  using (auth.uid() = user_id);

create policy "Users can delete own branches"
  on public.branches for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. PRODUCT INVENTORIES (BRANCH-SPECIFIC STOCK)
-- ------------------------------------------------------------------------------
create table if not exists public.product_inventories (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  branch_id text references public.branches(id) on delete cascade not null,
  stock integer not null default 0,
  rack_id text,
  rack_name text,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(product_id, branch_id)
);

alter table public.product_inventories enable row level security;

create policy "Users can view own product inventories"
  on public.product_inventories for select
  using (auth.uid() = user_id);

create policy "Users can insert own product inventories"
  on public.product_inventories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own product inventories"
  on public.product_inventories for update
  using (auth.uid() = user_id);

create policy "Users can delete own product inventories"
  on public.product_inventories for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 12. USER BRANCH ACCESS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.user_branch_access (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete cascade not null,
  app_user_id text not null,
  branch_id text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(app_user_id, branch_id)
);

alter table public.user_branch_access enable row level security;

create policy "Users can view own user branch access"
  on public.user_branch_access for select
  using (auth.uid() = user_id);

create policy "Users can modify own user branch access"
  on public.user_branch_access for all
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 13. ALTER EXISTING TABLES TO INCLUDE branch_id
-- ------------------------------------------------------------------------------
alter table public.orders add column if not exists branch_id text;
alter table public.orders add column if not exists branch_name text;

alter table public.restocks add column if not exists branch_id text;
alter table public.restocks add column if not exists branch_name text;

alter table public.revenues add column if not exists branch_id text;
alter table public.revenues add column if not exists branch_name text;

alter table public.costs add column if not exists branch_id text;
alter table public.costs add column if not exists branch_name text;
