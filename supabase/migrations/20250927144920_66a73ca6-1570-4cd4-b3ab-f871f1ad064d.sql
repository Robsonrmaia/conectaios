-- FASE 1: Schema completo e correções críticas

-- 1.1: Função RPC de auditoria (faltante)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _resource_type text,
  _resource_id text DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (action, entity, entity_id, meta, actor, at)
  VALUES (
    _action,
    _resource_type,
    _resource_id::uuid,
    jsonb_build_object(
      'old_values', _old_values,
      'new_values', _new_values
    ),
    auth.uid(),
    now()
  );
END;
$$;

-- 1.2: Corrigir schema do CRM para incluir broker_id
ALTER TABLE public.crm_clients 
ADD COLUMN IF NOT EXISTS broker_id uuid;

ALTER TABLE public.crm_deals
ADD COLUMN IF NOT EXISTS property_id uuid,
ADD COLUMN IF NOT EXISTS client_id uuid;

ALTER TABLE public.crm_notes
ADD COLUMN IF NOT EXISTS client_id uuid,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.crm_tasks
ADD COLUMN IF NOT EXISTS client_id uuid,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text;

-- 1.3: Adicionar FKs para integridade
DO $$
BEGIN
  -- CRM clients -> brokers FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_clients_broker_fk') THEN
    ALTER TABLE public.crm_clients
    ADD CONSTRAINT crm_clients_broker_fk 
    FOREIGN KEY (broker_id) REFERENCES public.brokers(id) ON DELETE CASCADE;
  END IF;

  -- CRM deals FKs
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_client_fk') THEN
    ALTER TABLE public.crm_deals
    ADD CONSTRAINT crm_deals_client_fk 
    FOREIGN KEY (client_id) REFERENCES public.crm_clients(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_property_fk') THEN
    ALTER TABLE public.crm_deals
    ADD CONSTRAINT crm_deals_property_fk 
    FOREIGN KEY (property_id) REFERENCES public.imoveis(id) ON DELETE SET NULL;
  END IF;

  -- CRM notes FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_notes_client_fk') THEN
    ALTER TABLE public.crm_notes
    ADD CONSTRAINT crm_notes_client_fk 
    FOREIGN KEY (client_id) REFERENCES public.crm_clients(id) ON DELETE CASCADE;
  END IF;

  -- CRM tasks FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_tasks_client_fk') THEN
    ALTER TABLE public.crm_tasks
    ADD CONSTRAINT crm_tasks_client_fk 
    FOREIGN KEY (client_id) REFERENCES public.crm_clients(id) ON DELETE CASCADE;
  END IF;

  -- Imoveis owner FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'imoveis_owner_fk') THEN
    ALTER TABLE public.imoveis
    ADD CONSTRAINT imoveis_owner_fk 
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Minisites owner FK  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'minisites_owner_fk') THEN
    ALTER TABLE public.minisites
    ADD CONSTRAINT minisites_owner_fk 
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.4: Índices únicos para integridade
CREATE UNIQUE INDEX IF NOT EXISTS ux_imovel_images_imovel_position 
ON public.imovel_images (imovel_id, position);

CREATE UNIQUE INDEX IF NOT EXISTS ux_imovel_images_imovel_cover 
ON public.imovel_images (imovel_id) 
WHERE is_cover = true;

-- 1.5: Triggers para updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
AS $$ 
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_imoveis_updated') THEN
    CREATE TRIGGER tg_imoveis_updated 
    BEFORE UPDATE ON public.imoveis 
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_crm_clients_updated') THEN
    CREATE TRIGGER tg_crm_clients_updated 
    BEFORE UPDATE ON public.crm_clients 
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_crm_deals_updated') THEN
    CREATE TRIGGER tg_crm_deals_updated 
    BEFORE UPDATE ON public.crm_deals 
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_crm_tasks_updated') THEN
    CREATE TRIGGER tg_crm_tasks_updated 
    BEFORE UPDATE ON public.crm_tasks 
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;