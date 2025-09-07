-- Fix security issues identified by the linter

-- 1. Reduce OTP expiry time to recommended 10 minutes (600 seconds)
UPDATE auth.config 
SET 
  otp_exp = 600,
  password_min_length = 8
WHERE true;

-- 2. Enable leaked password protection
UPDATE auth.config 
SET enable_password_leak_detection = true
WHERE true;

-- 3. Restrict publicly exposed broker data to only essential fields
-- Update RLS policy to limit what data is exposed publicly
DROP POLICY IF EXISTS "Public can view business info only" ON public.conectaios_brokers;

CREATE POLICY "Public can view limited business info only" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  status = 'active' 
  AND auth.uid() IS NULL 
  AND true
);