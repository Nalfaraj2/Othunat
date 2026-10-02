-- إذونات — Phase 2: private storage bucket for permission attachment photos (e.g. fingerprint sign-in
-- screenshots). Each user can only read/write objects under their own uid folder prefix
-- ("<uid>/<filename>"), enforced the same way as every other table: server-side RLS, not the client.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments bucket: owner select"
  on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments bucket: owner insert"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments bucket: owner delete"
  on storage.objects for delete
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
