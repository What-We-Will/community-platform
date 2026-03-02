-- Storage RLS: create buckets in Dashboard first (avatars public, resumes/attachments/recordings private)

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own resume"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own resume"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own resume"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Conversation participants can view attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments' AND (storage.foldername(name))[1] IN (
      SELECT conversation_id::text FROM public.conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation participants can upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments' AND (storage.foldername(name))[1] IN (
      SELECT conversation_id::text FROM public.conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view recordings"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'recordings');

CREATE POLICY "Authenticated users can upload recordings"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recordings');
