-- Adicionar coluna iptu na tabela imoveis se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'imoveis' 
        AND column_name = 'iptu'
    ) THEN
        ALTER TABLE public.imoveis ADD COLUMN iptu numeric;
    END IF;
END $$;