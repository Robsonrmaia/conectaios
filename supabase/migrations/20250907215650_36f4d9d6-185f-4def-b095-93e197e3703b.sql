-- Fix duplicate user_onboarding records
-- First, remove duplicates keeping the most recent one
DELETE FROM public.user_onboarding a 
USING public.user_onboarding b 
WHERE a.user_id = b.user_id 
  AND a.created_at < b.created_at;

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.user_onboarding 
ADD CONSTRAINT user_onboarding_user_id_unique 
UNIQUE (user_id);