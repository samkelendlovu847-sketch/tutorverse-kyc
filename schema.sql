-- Tutorverse KYC — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Verifications table
create table verifications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  id_number text not null, -- SHA-256 hash of ID number, never raw (POPIA compliance)
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Storage bucket for documents (synthetic/fake data only - POPIA compliance)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);