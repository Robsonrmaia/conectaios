-- Add custom domain field to minisite_configs table
ALTER TABLE public.minisite_configs 
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;