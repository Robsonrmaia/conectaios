-- Correção completa do minisite da Gisele sem ON CONFLICT
-- 1. Tornar todas as propriedades da Gisele públicas
UPDATE properties 
SET 
  is_public = true,
  visibility = 'public_site',
  updated_at = now()
WHERE user_id = '940c862e-a540-45dc-92af-6ca567fd2699';

-- 2. Adicionar biografia ao perfil da Gisele
UPDATE conectaios_brokers 
SET 
  bio = 'Corretora de imóveis especializada em residenciais e comerciais. Atendimento personalizado e dedicado para encontrar o imóvel dos seus sonhos. Experiência e confiança no mercado imobiliário.',
  updated_at = now()
WHERE id = '08ab7af3-2128-4af7-a078-0a078d608901';

-- 3. Criar perfil de usuário se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = '940c862e-a540-45dc-92af-6ca567fd2699') THEN
    INSERT INTO profiles (user_id, nome, role)
    VALUES ('940c862e-a540-45dc-92af-6ca567fd2699', 'Gisele Corretora', 'user');
  ELSE
    UPDATE profiles SET nome = 'Gisele Corretora', updated_at = now()
    WHERE user_id = '940c862e-a540-45dc-92af-6ca567fd2699';
  END IF;
END $$;

-- 4. Criar ou atualizar configuração do minisite
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM minisite_configs WHERE broker_id = '08ab7af3-2128-4af7-a078-0a078d608901') THEN
    INSERT INTO minisite_configs (
      broker_id,
      title,
      description,
      primary_color,
      secondary_color,
      template_id,
      generated_url,
      is_active
    ) VALUES (
      '08ab7af3-2128-4af7-a078-0a078d608901',
      'Gisele Corretora',
      'Encontre seu imóvel ideal com atendimento personalizado',
      '#10b981',
      '#059669',
      'modern',
      '/broker/giselecorretora',
      true
    );
  ELSE
    UPDATE minisite_configs SET
      title = 'Gisele Corretora',
      description = 'Encontre seu imóvel ideal com atendimento personalizado',
      generated_url = '/broker/giselecorretora',
      is_active = true,
      updated_at = now()
    WHERE broker_id = '08ab7af3-2128-4af7-a078-0a078d608901';
  END IF;
END $$;