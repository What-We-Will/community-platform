-- Add new link categories for job boards and community/networking
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'job_board_general';
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'job_board_remote';
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'community';
