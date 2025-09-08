-- Normalize minisite URLs in database to remove sandbox domains and fix @ prefixes
-- Remove any domain (sandbox or other), keep only the path
UPDATE minisite_configs
SET generated_url = regexp_replace(generated_url, '^https?://[^/]+', '')
WHERE generated_url ~ '^https?://';

-- Replace "/@username" with "/username" 
UPDATE minisite_configs
SET generated_url = regexp_replace(generated_url, '^/@+', '/')
WHERE generated_url LIKE '/@%';

-- Ensure all paths have /broker prefix if they're just /username
UPDATE minisite_configs
SET generated_url = '/broker' || generated_url
WHERE generated_url ~ '^/[A-Za-z0-9_.-]+$' AND generated_url NOT LIKE '/broker/%';