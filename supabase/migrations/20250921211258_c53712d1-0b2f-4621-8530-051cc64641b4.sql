-- Clean up duplicate broker records, keeping only the most recent one
DELETE FROM conectaios_brokers 
WHERE user_id = '118c5166-0430-4c27-a04d-1775a5d83acd' 
AND id != '082062cb-2030-4883-bd61-dc994c75cb64';

-- Add unique constraint to prevent future duplicates
ALTER TABLE conectaios_brokers 
ADD CONSTRAINT unique_user_id UNIQUE (user_id);