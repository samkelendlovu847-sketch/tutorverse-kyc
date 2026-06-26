-- Tutorverse KYC — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database
-- Last updated: June 2026

-- ============================================
-- VERIFICATIONS TABLE
-- ============================================
create table if not exists verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  id_number text not null, -- SHA-256 hash of ID number, never raw (POPIA compliance)
  status text not null default 'pending', -- pending | verified | failed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table verifications enable row level security;

create policy "Tutors can insert own submissions"
on verifications for insert
with check (auth.uid() = user_id);

create policy "Tutors can view own submissions"
on verifications for select
using (auth.uid() = user_id);

create policy "Tutors can update own submissions"
on verifications for update
using (auth.uid() = user_id);

create policy "Tutors can delete own submissions"
on verifications for delete
using (auth.uid() = user_id);

create policy "Service role has full access"
on verifications for all
using (auth.role() = 'service_role');

-- ============================================
-- QUALIFICATIONS TABLE
-- ============================================
create table if not exists qualifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  institution_name text,
  qualification_name text,
  qualification_type text, -- degree | diploma | certificate | teaching
  year_obtained text,
  ocr_text text, -- first 500 chars only (POPIA compliance)
  name_matched boolean default false,
  institution_verified boolean default false,
  status text default 'pending', -- pending | verified | review_needed | failed
  created_at timestamptz default now()
);

-- Row Level Security
alter table qualifications enable row level security;

create policy "Tutors can insert own qualifications"
on qualifications for insert
with check (auth.uid() = user_id);

create policy "Tutors can view own qualifications"
on qualifications for select
using (auth.uid() = user_id);

create policy "Tutors can delete own qualifications"
on qualifications for delete
using (auth.uid() = user_id);

create policy "Service role has full access to qualifications"
on qualifications for all
using (auth.role() = 'service_role');

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Row Level Security
alter table admin_users enable row level security;

create policy "Users can check own admin status"
on admin_users for select
using (auth.uid() = id);

create policy "Service role only for admin management"
on admin_users for all
using (auth.role() = 'service_role');

-- ============================================
-- AUDIT LOG TABLE (ISO 27001 compliance)
-- ============================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

alter table audit_logs enable row level security;

create policy "Service role has full access to audit logs"
on audit_logs for all
using (auth.role() = 'service_role');

-- ============================================
-- DATA RETENTION FUNCTION (POPIA compliance)
-- Auto-deletes records older than 2 years
-- ============================================
create or replace function delete_old_records()
returns void as $$
begin
  delete from verifications where created_at < now() - interval '2 years';
  delete from qualifications where created_at < now() - interval '2 years';
  delete from audit_logs where created_at < now() - interval '2 years';
end;
$$ language plpgsql;