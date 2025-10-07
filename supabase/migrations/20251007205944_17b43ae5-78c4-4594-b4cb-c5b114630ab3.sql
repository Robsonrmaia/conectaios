-- Fix generate_submission_token function using MD5 approach
-- Remove dependency on gen_random_bytes() and pgcrypto extension

CREATE OR REPLACE FUNCTION public.generate_submission_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Generate random token using MD5 approach (no pgcrypto needed)
    new_token := substring(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 32);
    
    -- Check if token already exists
    SELECT EXISTS(
      SELECT 1 FROM public.property_submissions 
      WHERE submission_token = new_token
    ) INTO token_exists;
    
    -- If doesn't exist, return the token
    IF NOT token_exists THEN
      RETURN new_token;
    END IF;
  END LOOP;
END;
$function$;

-- Add RLS policy for admins to view all properties
-- This helps admins see transferred properties immediately

CREATE POLICY "admin_view_all_properties"
ON public.imoveis
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);