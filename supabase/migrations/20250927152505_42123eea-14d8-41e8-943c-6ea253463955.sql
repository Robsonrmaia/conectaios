-- FASE 3C: Corrigir funções com search_path inseguro
-- Aplicar set search_path = public para funções de segurança

-- Atualizar função de auditoria para ter search_path fixo
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text, 
  _resource_type text, 
  _resource_id text DEFAULT NULL::text, 
  _old_values jsonb DEFAULT NULL::jsonb, 
  _new_values jsonb DEFAULT NULL::jsonb
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

-- Atualizar função handle_new_user com search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Atualizar função de trigger updated_at com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;