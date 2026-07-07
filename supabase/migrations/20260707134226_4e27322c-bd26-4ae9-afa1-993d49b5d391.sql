DROP POLICY IF EXISTS "customers delete dev" ON public.customers;
CREATE POLICY "customers delete mgmt"
ON public.customers FOR DELETE
TO authenticated
USING (is_admin_or_gerente(auth.uid()) OR owner_id = auth.uid());