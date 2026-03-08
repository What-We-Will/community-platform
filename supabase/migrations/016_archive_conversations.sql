-- Allow users to archive a conversation on their end without affecting other participants.
-- Archiving hides the thread from their list; a new incoming message automatically unarchives it.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_participants'
      AND column_name = 'archived'
  ) THEN
    ALTER TABLE conversation_participants
      ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for the common query pattern: fetch non-archived participations for a user.
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_archived
  ON conversation_participants (user_id, archived);

-- Trigger: when a new message arrives, unarchive the conversation for any participant who had it archived.
CREATE OR REPLACE FUNCTION unarchive_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_participants
  SET archived = false
  WHERE conversation_id = NEW.conversation_id
    AND archived = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_unarchive_on_new_message ON messages;
CREATE TRIGGER trigger_unarchive_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION unarchive_on_new_message();
