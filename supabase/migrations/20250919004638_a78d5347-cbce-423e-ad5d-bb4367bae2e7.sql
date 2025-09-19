-- Add year_built and tour_360_url columns to properties table
ALTER TABLE public.properties 
ADD COLUMN year_built INTEGER,
ADD COLUMN tour_360_url TEXT;