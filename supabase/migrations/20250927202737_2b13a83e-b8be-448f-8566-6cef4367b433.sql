-- Clean up duplicate broker records for Gisele, keeping only the one with CRECI
DELETE FROM brokers 
WHERE user_id = '7944e96a-e821-45e0-b07e-5cece101b978' 
AND id != '5ea39764-9637-49c9-ad94-7c004d988537';