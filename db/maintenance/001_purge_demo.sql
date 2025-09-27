-- FASE 2: Script de limpeza de dados de exemplo
-- ATENÇÃO: Executar manualmente apenas quando ALLOW_SAMPLE_PURGE=true
-- Este script remove TODOS os dados funcionais, mantendo apenas a estrutura

-- Ordem respeitando FKs (dependências primeiro)
BEGIN;

-- Remover dados relacionais primeiro
TRUNCATE TABLE 
  public.messages,
  public.matches,
  public.leads,
  public.crm_notes,
  public.crm_tasks,
  public.crm_deals,
  public.crm_clients,
  public.imovel_images,
  public.imovel_features,
  public.imoveis,
  public.minisites
RESTART IDENTITY CASCADE;

-- Limpar audit logs (opcional - apenas dados de exemplo)
DELETE FROM public.audit_log WHERE created_at < now() - interval '1 hour';

-- Limpar webhook logs antigos
DELETE FROM public.webhook_logs WHERE at < now() - interval '24 hours';

COMMIT;

-- Verificação pós-limpeza
SELECT 
  'imoveis' as tabela, count(*) as registros FROM public.imoveis
UNION ALL
SELECT 'crm_clients', count(*) FROM public.crm_clients  
UNION ALL
SELECT 'crm_deals', count(*) FROM public.crm_deals
UNION ALL
SELECT 'leads', count(*) FROM public.leads
UNION ALL  
SELECT 'minisites', count(*) FROM public.minisites
UNION ALL
SELECT 'imovel_images', count(*) FROM public.imovel_images
ORDER BY tabela;

-- Log da operação
INSERT INTO public.audit_log (action, entity, meta, actor)
VALUES ('BULK_PURGE', 'DEMO_DATA', '{"type": "maintenance", "scope": "sample_data"}', auth.uid());