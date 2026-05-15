-- Storage RLS for the `syllabi` bucket (§A1.3): owner-only access.
-- Files are stored at `<user_id>/<course_id>/<filename>`, so the first path
-- segment must equal the authenticated user's id.
-- Apply via Supabase Dashboard → SQL Editor.

create policy "syllabi owner select"
  on storage.objects for select
  using (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "syllabi owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "syllabi owner update"
  on storage.objects for update
  using (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "syllabi owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
