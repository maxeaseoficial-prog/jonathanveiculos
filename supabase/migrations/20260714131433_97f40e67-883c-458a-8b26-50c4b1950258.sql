
CREATE POLICY "catalog_covers_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'catalog-covers');
CREATE POLICY "catalog_covers_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'catalog-covers' AND is_admin());
CREATE POLICY "catalog_covers_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'catalog-covers' AND is_admin());
CREATE POLICY "catalog_covers_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'catalog-covers' AND is_admin());
