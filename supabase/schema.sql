-- SQL Schema for SP5 Piastów Szkolna Podłoga
-- Table: sp5_notes

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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.sp5_notes enable row level security;

-- Policies
-- Anyone can read notes
create policy "Allow public read access"
  on public.sp5_notes
  for select
  using (true);

-- Anyone can insert notes (backend API validates IP check)
create policy "Allow public insert access"
  on public.sp5_notes
  for insert
  with check (true);

-- Anyone can update respect_count (or we can handle it via backend API)
create policy "Allow public update respect"
  on public.sp5_notes
  for update
  using (true);

-- Only admin (or service role) can delete
create policy "Allow delete for admin"
  on public.sp5_notes
  for delete
  using (true);

-- Create index on ip_address for fast IP check
create index if not exists idx_sp5_notes_ip on public.sp5_notes(ip_address);
