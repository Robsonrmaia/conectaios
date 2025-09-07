-- Add email field to conectaios_clients table to support better client management
ALTER TABLE public.conectaios_clients 
ADD COLUMN email TEXT,
ADD COLUMN data_nascimento DATE;