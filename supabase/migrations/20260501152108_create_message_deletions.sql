CREATE TABLE IF NOT EXISTS message_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deleted_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(message_id, user_id)
);