
CREATE POLICY "vehicle_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-images');
CREATE POLICY "vehicle_images_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-images' AND public.is_admin());
CREATE POLICY "vehicle_images_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vehicle-images' AND public.is_admin());
CREATE POLICY "vehicle_images_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-images' AND public.is_admin());
