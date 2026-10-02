create policy "Users can upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'document-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can read own folder" on storage.objects for select to authenticated
  using (bucket_id = 'document-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'document-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete own folder files" on storage.objects for delete to authenticated
  using (bucket_id = 'document-uploads' and (storage.foldername(name))[1] = auth.uid()::text);