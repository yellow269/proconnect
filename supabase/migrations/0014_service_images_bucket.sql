-- Add service-images bucket for service photo uploads
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('service-images', 'service-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Anyone can read service images (public bucket)
create policy "public service images readable"
  on storage.objects for select
  using (bucket_id = 'service-images');

-- Professionals can upload service images to their own folder
create policy "professionals upload service images"
  on storage.objects for insert
  with check (
    bucket_id = 'service-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Professionals can update their own service images
create policy "professionals update service images"
  on storage.objects for update
  using (
    bucket_id = 'service-images'
    and owner_id = auth.uid()::text
  );

-- Professionals can delete their own service images
create policy "professionals delete service images"
  on storage.objects for delete
  using (
    bucket_id = 'service-images'
    and owner_id = auth.uid()::text
  );
