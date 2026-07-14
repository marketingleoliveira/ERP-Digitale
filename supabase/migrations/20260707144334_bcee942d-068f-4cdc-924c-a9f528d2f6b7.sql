CREATE POLICY "artigos read auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'artigos');
CREATE POLICY "artigos insert auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'artigos');
CREATE POLICY "artigos update auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'artigos');
CREATE POLICY "artigos delete auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'artigos');