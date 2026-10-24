-- Enforce the 10 MB avatar upload ceiling server-side.
-- Mirrors AVATAR_LIMIT_MB in components/profile/AvatarUpload.tsx — update both together.
-- Supabase project-level limit is 50 MB; this tightens the avatars bucket specifically.
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'avatars';