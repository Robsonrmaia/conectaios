-- Add has_sea_view column to properties table
ALTER TABLE public.properties ADD COLUMN has_sea_view BOOLEAN DEFAULT false;