
CREATE POLICY "Autenticados leem estampas storage" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'estampas');
CREATE POLICY "Autenticados enviam estampas storage" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'estampas');
CREATE POLICY "Autenticados atualizam estampas storage" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'estampas') WITH CHECK (bucket_id = 'estampas');
CREATE POLICY "Autenticados excluem estampas storage" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'estampas');
