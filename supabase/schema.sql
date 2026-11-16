-- SQL Schema for SP5 Piastów Szkolna Podłoga
-- Tables: sp5_notes, sp5_accounts, sp5_respects

create table if not exists public.sp5_notes (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  class_name text not null,
  year_written integer not null,
  message text not null,
  paper_style text not null default 'grid', -- 'grid', 'lined', 'sticky', 'gold'
  rotation numeric not null default 0, -- -4 to 4 degrees
  ip_address text not null,
  respect_count integer not null default 0,
  user_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.sp5_accounts (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  class_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.sp5_respects (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  note_id uuid not null references public.sp5_notes(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_note_respect unique (user_email, note_id)
);

-- Enable Row Level Security
alter table public.sp5_notes enable row level security;
alter table public.sp5_accounts enable row level security;
alter table public.sp5_respects enable row level security;

-- Policies
create policy "Allow public read access notes" on public.sp5_notes for select using (true);
create policy "Allow public insert access notes" on public.sp5_notes for insert with check (true);
create policy "Allow public update notes" on public.sp5_notes for update using (true);
create policy "Allow public delete notes" on public.sp5_notes for delete using (true);

create policy "Allow public read access accounts" on public.sp5_accounts for select using (true);
create policy "Allow public insert access accounts" on public.sp5_accounts for insert with check (true);
create policy "Allow public update accounts" on public.sp5_accounts for update using (true);

create policy "Allow public read access respects" on public.sp5_respects for select using (true);
create policy "Allow public insert access respects" on public.sp5_respects for insert with check (true);
create policy "Allow public delete respects" on public.sp5_respects for delete using (true);

-- Indexes
create index if not exists idx_sp5_notes_ip on public.sp5_notes(ip_address);
create index if not exists idx_sp5_notes_email on public.sp5_notes(user_email);
create index if not exists idx_sp5_accounts_email on public.sp5_accounts(email);
create index if not exists idx_sp5_respects_email_note on public.sp5_respects(user_email, note_id);

-- Verification codes table for Gmail OTP
create table if not exists public.sp5_verification_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sp5_verification_codes enable row level security;

create policy "Allow public read access verification_codes" on public.sp5_verification_codes for select using (true);
create policy "Allow public insert access verification_codes" on public.sp5_verification_codes for insert with check (true);
create policy "Allow public delete access verification_codes" on public.sp5_verification_codes for delete using (true);

create index if not exists idx_sp5_verification_email on public.sp5_verification_codes(email);
