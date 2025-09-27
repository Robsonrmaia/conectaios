-- ===== CONECTAIOS SAAS SCHEMA COMPLETO - PARTE 3 CORRIGIDA =====
-- RLS Policies completas + RPC de busca + Storage (com nomes únicos)

-- 17) RLS POLICIES COMPLETAS

-- BROKERS (dropping existing and recreating)
DROP POLICY IF EXISTS "brokers_owner_rw" ON public.brokers;
CREATE POLICY "saas_brokers_owner_full_access"
ON public.brokers FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- IMOVEIS
CREATE POLICY "saas_imoveis_public_read"
ON public.imoveis FOR SELECT
USING (is_public = true AND visibility = 'public_site');

CREATE POLICY "saas_imoveis_owner_read"
ON public.imoveis FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "saas_imoveis_owner_insert"
ON public.imoveis FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "saas_imoveis_owner_update"
ON public.imoveis FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "saas_imoveis_owner_delete"
ON public.imoveis FOR DELETE
USING (owner_id = auth.uid());

-- IMOVEL_IMAGES
CREATE POLICY "saas_images_public_read"
ON public.imovel_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_images.imovel_id
      AND i.is_public = true
      AND i.visibility = 'public_site'
  )
);

CREATE POLICY "saas_images_imovel_owner_full"
ON public.imovel_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_images.imovel_id
      AND i.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_images.imovel_id
      AND i.owner_id = auth.uid()
  )
);

-- IMOVEL_FEATURES
CREATE POLICY "saas_features_public_read"
ON public.imovel_features FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_features.imovel_id
      AND i.is_public = true
      AND i.visibility = 'public_site'
  )
);

CREATE POLICY "saas_features_imovel_owner_full"
ON public.imovel_features FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_features.imovel_id
      AND i.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_features.imovel_id
      AND i.owner_id = auth.uid()
  )
);

-- MINISITES
CREATE POLICY "saas_minisites_public_read"
ON public.minisites FOR SELECT
USING (is_public = true);

CREATE POLICY "saas_minisites_owner_full"
ON public.minisites FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- LEADS
CREATE POLICY "saas_leads_broker_read"
ON public.leads FOR SELECT
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));

CREATE POLICY "saas_leads_broker_update"
ON public.leads FOR UPDATE
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
WITH CHECK (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));

CREATE POLICY "saas_leads_public_insert"
ON public.leads FOR INSERT
WITH CHECK (true);

-- MATCHES
CREATE POLICY "saas_matches_participants_read"
ON public.matches FOR SELECT
USING (requester_id = auth.uid() OR responder_id = auth.uid());

CREATE POLICY "saas_matches_requester_insert"
ON public.matches FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "saas_matches_participants_update"
ON public.matches FOR UPDATE
USING (requester_id = auth.uid() OR responder_id = auth.uid())
WITH CHECK (requester_id = auth.uid() OR responder_id = auth.uid());

-- MESSAGES
CREATE POLICY "saas_messages_match_participants_full"
ON public.messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.requester_id = auth.uid() OR m.responder_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.requester_id = auth.uid() OR m.responder_id = auth.uid())
  )
);

-- SUBSCRIPTIONS
CREATE POLICY "saas_subscriptions_owner_full"
ON public.subscriptions FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- AUDIT_LOG e WEBHOOK_LOGS (somente admins leem)
CREATE POLICY "saas_ops_admin_read_audit"
ON public.audit_log FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "saas_ops_admin_read_webhooks"
ON public.webhook_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 18) RPC DE BUSCA (FTS) - search_imoveis
CREATE OR REPLACE FUNCTION public.search_imoveis(
  q text DEFAULT '', 
  city_filter text DEFAULT null, 
  purpose_filter text DEFAULT null, 
  limit_rows int DEFAULT 50, 
  offset_rows int DEFAULT 0
)
RETURNS SETOF public.imoveis
LANGUAGE sql STABLE 
SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.imoveis
  WHERE
    (q = '' OR search_vector @@ plainto_tsquery('simple', q))
    AND (city_filter IS NULL OR city = city_filter)
    AND (purpose_filter IS NULL OR purpose = purpose_filter)
  ORDER BY
    ts_rank(search_vector, plainto_tsquery('simple', q)) DESC NULLS LAST,
    created_at DESC
  LIMIT limit_rows OFFSET offset_rows;
$$;

-- 19) CRIAR BUCKET STORAGE IMOVEIS
INSERT INTO storage.buckets (id, name, public) VALUES ('imoveis', 'imoveis', false) 
ON CONFLICT (id) DO NOTHING;