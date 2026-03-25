-- Add approval_status column to profiles.
-- Used by onboarding (sets 'pending'), admin approvals (sets 'approved'/'rejected'),
-- and the auth proxy to gate access.
-- Existing rows default to 'approved' so current members aren't locked out.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';
