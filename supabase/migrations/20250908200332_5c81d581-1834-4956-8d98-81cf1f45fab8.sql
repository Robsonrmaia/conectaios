-- Create default minisite config for existing brokers who don't have one
INSERT INTO public.minisite_configs (broker_id, title, primary_color, secondary_color, template_id, show_properties, show_contact_form, show_about, is_active)
SELECT 
  cb.id,
  COALESCE(cb.name, 'Meu Mini Site') as title,
  '#1CA9C9' as primary_color,
  '#64748B' as secondary_color,
  'modern' as template_id,
  true as show_properties,
  true as show_contact_form,
  true as show_about,
  true as is_active
FROM public.conectaios_brokers cb
LEFT JOIN public.minisite_configs mc ON cb.id = mc.broker_id
WHERE mc.broker_id IS NULL;