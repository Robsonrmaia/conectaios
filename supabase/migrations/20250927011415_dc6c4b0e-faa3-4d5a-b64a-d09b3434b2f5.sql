-- ===== CONECTAIOS SAAS SCHEMA COMPLETO - PARTE 3 =====
-- Políticas RLS completas conforme especificação

-- BROKERS - RLS Policies
CREATE POLICY "brokers_owner_rw"
ON public.brokers FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- IMOVEIS - RLS Policies
-- leitura pública apenas quando publicado para site
CREATE POLICY "imoveis_public_read"
ON public.imoveis FOR SELECT
USING (is_public = true AND visibility = 'public_site');

-- dono pode ler tudo que é seu
CREATE POLICY "imoveis_owner_read"
ON public.imoveis FOR SELECT
USING (owner_id = auth.uid());

-- dono CRUD
CREATE POLICY "imoveis_owner_insert"
ON public.imoveis FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "imoveis_owner_update"
ON public.imoveis FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "imoveis_owner_delete"
ON public.imoveis FOR DELETE
USING (owner_id = auth.uid());

-- IMOVEL_IMAGES - RLS Policies
CREATE POLICY "images_public_read"
ON public.imovel_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_images.imovel_id
      AND i.is_public = true
      AND i.visibility = 'public_site'
  )
);

CREATE POLICY "images_imovel_owner_rw"
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

-- IMOVEL_FEATURES - RLS Policies
CREATE POLICY "features_public_read"
ON public.imovel_features FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_features.imovel_id
      AND i.is_public = true
      AND i.visibility = 'public_site'
  )
);

CREATE POLICY "features_imovel_owner_rw"
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

-- MINISITES - RLS Policies
CREATE POLICY "minisites_public_read"
ON public.minisites FOR SELECT
USING (is_public = true);

CREATE POLICY "minisites_owner_rw"
ON public.minisites FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- LEADS - RLS Policies
CREATE POLICY "leads_broker_read"
ON public.leads FOR SELECT
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));

CREATE POLICY "leads_broker_update"
ON public.leads FOR UPDATE
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
WITH CHECK (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));

CREATE POLICY "leads_public_insert"
ON public.leads FOR INSERT
WITH CHECK (true);

-- MATCHES - RLS Policies
CREATE POLICY "matches_participants_read"
ON public.matches FOR SELECT
USING (requester_id = auth.uid() OR responder_id = auth.uid());

CREATE POLICY "matches_requester_insert"
ON public.matches FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "matches_participants_update"
ON public.matches FOR UPDATE
USING (requester_id = auth.uid() OR responder_id = auth.uid())
WITH CHECK (requester_id = auth.uid() OR responder_id = auth.uid());

-- MESSAGES - RLS Policies
CREATE POLICY "messages_match_participants"
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

-- SUBSCRIPTIONS - RLS Policies
CREATE POLICY "subscriptions_owner_rw"
ON public.subscriptions FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- AUDIT_LOG e WEBHOOK_LOGS - somente admins leem
CREATE POLICY "ops_admin_read_audit"
ON public.audit_log FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "ops_admin_read_webhooks"
ON public.webhook_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));