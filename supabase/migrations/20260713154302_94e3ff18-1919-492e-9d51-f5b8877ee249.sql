
REVOKE EXECUTE ON FUNCTION public.exp_registrar_evento(uuid,text,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.exp_transicionar(uuid,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.exp_separar_lote(uuid,uuid,uuid,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.exp_registrar_evento(uuid,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exp_transicionar(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exp_separar_lote(uuid,uuid,uuid,numeric) TO authenticated;
