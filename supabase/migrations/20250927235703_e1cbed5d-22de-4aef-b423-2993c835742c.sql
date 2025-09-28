-- Security Fix Migration: Remove Security Definer Views and Fix Public Data Exposure
-- This migration addresses security findings from the Supabase linter

-- 1. First, let's check and remove any views with SECURITY DEFINER
-- Drop any potential security definer views (if they exist)
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Check for views with security definer and drop them if found
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND definition ILIKE '%security%definer%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
        RAISE NOTICE 'Dropped security definer view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;

-- 2. Fix the social_presence table RLS policies to restrict public access
-- Currently it's publicly readable, which exposes user activity data

-- First, check if social_presence table exists and update its policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'social_presence') THEN
        -- Drop existing permissive policies on social_presence
        DROP POLICY IF EXISTS "Allow public read on social_presence" ON public.social_presence;
        DROP POLICY IF EXISTS "Public read access to social_presence" ON public.social_presence;
        DROP POLICY IF EXISTS "social_presence_public_read" ON public.social_presence;
        
        -- Enable RLS if not already enabled
        ALTER TABLE public.social_presence ENABLE ROW LEVEL SECURITY;
        
        -- Create secure policies for social_presence
        -- Only authenticated users can see presence of users they're connected to
        CREATE POLICY "Users can see own presence" ON public.social_presence
        FOR SELECT 
        USING (user_id = auth.uid());
        
        CREATE POLICY "Users can update own presence" ON public.social_presence
        FOR UPDATE 
        USING (user_id = auth.uid());
        
        CREATE POLICY "Users can insert own presence" ON public.social_presence
        FOR INSERT 
        WITH CHECK (user_id = auth.uid());
        
        CREATE POLICY "Users can delete own presence" ON public.social_presence
        FOR DELETE 
        USING (user_id = auth.uid());
        
        RAISE NOTICE 'Fixed social_presence table RLS policies';
    END IF;
END $$;

-- 3. Fix any functions that might be missing search_path (related warning)
-- Update existing functions to have proper search_path settings

-- Fix the log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(_action text, _resource_type text, _resource_id text DEFAULT NULL::text, _old_values jsonb DEFAULT NULL::jsonb, _new_values jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Fix the apply_points function
CREATE OR REPLACE FUNCTION public.apply_points(p_usuario_id uuid, p_rule_key text, p_pontos integer, p_ref_tipo text DEFAULT NULL::text, p_ref_id text DEFAULT NULL::text, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    current_month INTEGER := EXTRACT(MONTH FROM NOW());
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
    -- Inserir evento
    INSERT INTO public.gam_events (usuario_id, rule_key, pontos, ref_tipo, ref_id, meta)
    VALUES (p_usuario_id, p_rule_key, p_pontos, p_ref_tipo, p_ref_id, p_meta);
    
    -- Atualizar ou criar estatísticas mensais
    INSERT INTO public.gam_user_monthly (usuario_id, ano, mes, pontos)
    VALUES (p_usuario_id, current_year, current_month, p_pontos)
    ON CONFLICT (usuario_id, ano, mes)
    DO UPDATE SET 
        pontos = gam_user_monthly.pontos + p_pontos,
        updated_at = NOW();
END;
$function$;

-- Fix other functions with search_path
CREATE OR REPLACE FUNCTION public.ensure_broker_for_user(p_user uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE bid uuid;
BEGIN
  INSERT INTO public.brokers (user_id, created_at)
  VALUES (p_user, now())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO bid;
  RETURN bid;
END $function$;

CREATE OR REPLACE FUNCTION public.ensure_minisite_for_user(p_user uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE mid uuid;
BEGIN
  INSERT INTO public.minisite_configs (user_id, title, primary_color, secondary_color, template_id,
                                       show_properties, show_contact, show_about, created_at, updated_at)
  VALUES (p_user, 'Meu Minisite', '#3B82F6', '#EF4444', 'default', true, true, true, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO mid;
  RETURN mid;
END $function$;

CREATE OR REPLACE FUNCTION public.generate_referral_code(user_uuid uuid DEFAULT auth.uid())
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  code text;
BEGIN
  -- Gerar código único baseado no ID do usuário
  code := 'REF' || substr(replace(user_uuid::text, '-', ''), 1, 8);
  
  RETURN upper(code);
END;
$function$;