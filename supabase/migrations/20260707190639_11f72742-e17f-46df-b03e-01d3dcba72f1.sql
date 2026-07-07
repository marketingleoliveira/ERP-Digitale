CREATE POLICY "Admin/gerente lê fiscal" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fiscal' AND public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "Admin/gerente insere fiscal" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fiscal' AND public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "Admin/gerente atualiza fiscal" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fiscal' AND public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "Admin/gerente deleta fiscal" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fiscal' AND public.is_admin_or_gerente(auth.uid()));