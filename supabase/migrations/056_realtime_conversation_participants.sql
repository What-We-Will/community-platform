-- Enable Realtime on conversation_participants so the client can detect
-- when the current user is added to a new conversation.
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
