-- FASE 5: Checklist automático pós-limpeza
-- Verifica se as tabelas estão vazias após a limpeza

SELECT 
  'SUMMARY' as category,
  'Total tables checked' as metric,
  '9' as value
UNION ALL

-- Contadores por tabela
SELECT 
  'DATA' as category,
  'imoveis' as metric, 
  count(*)::text as value 
FROM public.imoveis
UNION ALL

SELECT 'DATA', 'imovel_images', count(*)::text FROM public.imovel_images
UNION ALL

SELECT 'DATA', 'imovel_features', count(*)::text FROM public.imovel_features  
UNION ALL

SELECT 'DATA', 'minisites', count(*)::text FROM public.minisites
UNION ALL

SELECT 'DATA', 'leads', count(*)::text FROM public.leads
UNION ALL

SELECT 'DATA', 'crm_clients', count(*)::text FROM public.crm_clients
UNION ALL

SELECT 'DATA', 'crm_deals', count(*)::text FROM public.crm_deals
UNION ALL

SELECT 'DATA', 'crm_notes', count(*)::text FROM public.crm_notes
UNION ALL

SELECT 'DATA', 'crm_tasks', count(*)::text FROM public.crm_tasks

-- Verificações de integridade
UNION ALL

SELECT 
  'INTEGRITY' as category,
  'Orphan images' as metric,
  count(*)::text as value
FROM public.imovel_images img 
LEFT JOIN public.imoveis prop ON img.imovel_id = prop.id
WHERE prop.id IS NULL

UNION ALL

SELECT 
  'INTEGRITY',
  'Orphan features',
  count(*)::text
FROM public.imovel_features feat
LEFT JOIN public.imoveis prop ON feat.imovel_id = prop.id  
WHERE prop.id IS NULL

UNION ALL

SELECT 
  'INTEGRITY',
  'Orphan deals',
  count(*)::text
FROM public.crm_deals deal
LEFT JOIN public.crm_clients client ON deal.client_id = client.id
WHERE client.id IS NULL

ORDER BY category, metric;