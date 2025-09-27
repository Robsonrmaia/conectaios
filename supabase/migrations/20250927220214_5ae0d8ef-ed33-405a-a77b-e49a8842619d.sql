-- Simple compatibility fixes without complex updates
-- Add missing columns to partners table only
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Create simple clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    telefone text,
    email text,
    tipo text DEFAULT 'comprador',
    stage text DEFAULT 'novo',
    valor numeric,
    score integer DEFAULT 0,
    historico jsonb DEFAULT '[]',
    broker_id uuid,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create basic policies
DROP POLICY IF EXISTS "clients_user_access" ON public.clients;
CREATE POLICY "clients_user_access" ON public.clients
    FOR ALL USING (user_id = auth.uid());

-- Create simple deals table
CREATE TABLE IF NOT EXISTS public.deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid,
    property_id uuid,
    user_id uuid REFERENCES auth.users(id),
    status text DEFAULT 'negotiating',
    offer_amount numeric,
    commission_amount numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create basic policies for deals
DROP POLICY IF EXISTS "deals_user_access" ON public.deals;
CREATE POLICY "deals_user_access" ON public.deals
    FOR ALL USING (user_id = auth.uid());