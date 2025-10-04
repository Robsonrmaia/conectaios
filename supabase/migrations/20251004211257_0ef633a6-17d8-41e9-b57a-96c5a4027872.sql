-- Permitir que corretores autenticados vejam features de imóveis no marketplace
-- Isso corrige o problema de banners especiais não aparecerem para outros corretores

-- Remover políticas antigas que bloqueiam acesso ao marketplace
DROP POLICY IF EXISTS "features_public_read" ON public.imovel_features;
DROP POLICY IF EXISTS "saas_features_public_read" ON public.imovel_features;

-- Nova política: corretores autenticados podem ver features de imóveis visíveis no marketplace/partners
CREATE POLICY "features_marketplace_read" 
ON public.imovel_features
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM imoveis i 
    WHERE i.id = imovel_features.imovel_id 
    AND (
      -- Proprietário pode ver tudo
      i.owner_id = auth.uid()
      -- OU imóvel público no site
      OR (i.is_public = true AND i.visibility = 'public_site')
      -- OU imóvel visível no marketplace para corretores autenticados
      OR (auth.uid() IS NOT NULL AND i.visibility IN ('marketplace', 'partners', 'both'))
    )
  )
);