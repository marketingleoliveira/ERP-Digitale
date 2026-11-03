
(
set +e

# ALTERE SOMENTE ESTA LINHA:
DOMAINS="avancemodas.com.br www.avancemodas.com.br digitaletextil.com.br www.digitaletextil.com.br

PROJECT="/var/www/manutencao"
CONF="/etc/nginx/sites-available/manutencao-dominios"
LINK="/etc/nginx/sites-enabled/manutencao-dominios"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="/tmp/manutencao-dominios-$STAMP.conf"

echo "=== CONFIGURANDO DOMÍNIOS DA MANUTENÇÃO ==="

if [ ! -f "$PROJECT/index.html" ]; then
  echo "ERRO: página $PROJECT/index.html não encontrada."
  exit 10
fi

if [ -z "$DOMAINS" ]; then
  echo "ERRO: informe os domínios."
  exit 11
fi

if [ -f "$CONF" ]; then
  cp "$CONF" "$BACKUP"
fi

for DOMAIN in $DOMAINS; do
  CONFLICT="$(
    grep -RslE "server_name[^;]*\b${DOMAIN//./\\.}\b" \
      /etc/nginx/sites-enabled 2>/dev/null |
    grep -vF "$LINK" |
    head -1
  )"

  if [ -n "$CONFLICT" ]; then
    echo "ERRO: $DOMAIN já está configurado em $CONFLICT"
    echo "Nenhuma configuração foi publicada."
    exit 12
  fi
done

cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAINS;

    root $PROJECT;
    index index.html;

    access_log /var/log/nginx/manutencao-dominios.access.log;
    error_log /var/log/nginx/manutencao-dominios.error.log;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOF

WRITE_RC=$?

if [ "$WRITE_RC" -ne 0 ]; then
  echo "ERRO: não foi possível criar a configuração."
  exit 20
fi

if [ ! -L "$LINK" ]; then
  ln -s "$CONF" "$LINK"
  LINK_RC=$?
else
  LINK_RC=0
fi

nginx -t
NGINX_RC=$?

if [ "$LINK_RC" -ne 0 ] || [ "$NGINX_RC" -ne 0 ]; then
  if [ -f "$BACKUP" ]; then
    cp "$BACKUP" "$CONF"
  else
    mv "$LINK" "/tmp/manutencao-dominios-link-failed-$STAMP" 2>/dev/null
    mv "$CONF" "/tmp/manutencao-dominios-conf-failed-$STAMP" 2>/dev/null
  fi

  nginx -t
  echo "ERRO: configuração rejeitada. Nginx anterior preservado."
  exit 30
fi

systemctl reload nginx
RELOAD_RC=$?

if [ "$RELOAD_RC" -ne 0 ]; then
  if [ -f "$BACKUP" ]; then
    cp "$BACKUP" "$CONF"
  fi

  nginx -t && systemctl reload nginx
  echo "ERRO: reload falhou. Configuração anterior restaurada."
  exit 31
fi

if command -v ufw >/dev/null 2>&1; then
  ufw allow 'Nginx Full'
  UFW_RC=$?
else
  UFW_RC=0
fi

FIRST_DOMAIN="$(printf '%s\n' "$DOMAINS" | awk '{print $1}')"

HTTP_CODE="$(
  curl -sS \
    -H "Host: $FIRST_DOMAIN" \
    -o "/tmp/manutencao-domain-health-$STAMP.html" \
    -w "%{http_code}" \
    http://127.0.0.1/
)"
CURL_RC=$?

grep -q "Estamos em manutenção" \
  "/tmp/manutencao-domain-health-$STAMP.html"
CONTENT_RC=$?

echo "NGINX_RC=$NGINX_RC"
echo "RELOAD_RC=$RELOAD_RC"
echo "UFW_RC=$UFW_RC"
echo "CURL_RC=$CURL_RC"
echo "HTTP_CODE=$HTTP_CODE"
echo "CONTENT_RC=$CONTENT_RC"

if [ "$CURL_RC" -ne 0 ] || \
   [ "$HTTP_CODE" != "200" ] || \
   [ "$CONTENT_RC" -ne 0 ]; then
  echo "ERRO: o Nginx não entregou a página esperada."
  exit 40
fi

echo "CONCLUÍDO: todos os domínios foram associados à manutenção."
echo "Após a propagação do DNS, acesse:"
for DOMAIN in $DOMAINS; do
  echo "http://$DOMAIN"
done
)



CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','transferencia')),
  quantidade numeric NOT NULL,
  origem text, destino text, documento text, observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read stock" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert stock" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "manage stock" ON public.stock_movements FOR ALL TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero bigserial UNIQUE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  data_emissao date NOT NULL DEFAULT current_date,
  data_prevista date,
  valor_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberto',
  observacoes text,
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read po" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert po" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "manage po" ON public.purchase_orders FOR ALL TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL, empresa text, email text, telefone text,
  origem text, estagio text NOT NULL DEFAULT 'novo',
  valor_estimado numeric, proxima_acao date, observacoes text,
  owner_id uuid REFERENCES auth.users(id),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read leads" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert leads" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update leads" ON public.crm_leads FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())) WITH CHECK (owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "delete leads" ON public.crm_leads FOR DELETE TO authenticated USING (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
