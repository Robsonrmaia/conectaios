-- FASE 3B: Corrigir primary key da tabela imovel_features
-- A tabela já tem uma PK, vamos apenas garantir que seja a correta

-- Remover constraint de PK se existir com nome incorreto e recriar se necessário
DO $$
BEGIN
  -- Primeiro, vamos verificar se a tabela tem uma PK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'imovel_features' 
    AND c.contype = 'p'
  ) THEN
    -- Se não tem PK, criar uma composta
    ALTER TABLE public.imovel_features
      ADD CONSTRAINT imovel_features_pk PRIMARY KEY (imovel_id, key);
  END IF;
END $$;

-- Garantir FKs necessárias (idempotente)
DO $$
BEGIN  
  -- FK para imovel_features -> imoveis
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='imovel_features_imovel_fk'
  ) THEN
    ALTER TABLE public.imovel_features
      ADD CONSTRAINT imovel_features_imovel_fk FOREIGN KEY (imovel_id) 
      REFERENCES public.imoveis(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_imovel_features_imovel ON public.imovel_features(imovel_id);