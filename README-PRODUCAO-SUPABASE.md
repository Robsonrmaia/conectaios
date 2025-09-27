# Produção (Supabase novo)

## Tabelas Canônicas

**Sistema Core:**
- `imoveis` - Propriedades com FTS e RLS por owner_id
- `imovel_images` - Imagens dos imóveis (bucket: imoveis)  
- `imovel_features` - Características dos imóveis
- `profiles` - Perfis de usuário
- `brokers` - Corretores (substituiu conectaios_brokers)

**CRM Integrado:**
- `crm_clients` - Clientes por corretor
- `crm_deals` - Negócios/deals
- `crm_notes` - Anotações
- `crm_tasks` - Tarefas

**Sistema de Leads:**
- `leads` - Leads capturados
- `matches` - Sistema de matches
- `messages` - Mensagens dos matches

**Funcionalidades Adicionais:**
- `minisites` - Minisites dos corretores
- `client_searches` - Buscas salvas 
- `support_tickets` - Tickets de suporte
- `notifications` - Sistema de notificações

## Storage

**Bucket:** `imoveis` (não público)
**Prefixo:** `public/<imovel_id>/`
**RLS:** Apenas donos do imóvel podem acessar

## Camada de Dados

**OBRIGATÓRIO:** Usar apenas `src/data/index.ts` para acesso aos dados.

```typescript
// ✅ CORRETO
import { Properties, CRM, ClientSearches, SupportTickets } from '@/data';

// ❌ PROIBIDO
import { supabase } from '@/integrations/supabase/client';
const { data } = await supabase.from('imoveis')...
```

## Configuração de Produção

**Frontend (.env):**
```
VITE_SUPABASE_URL=https://paawojkqrggnuvpnnwrc.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

**Edge Functions (Secrets):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOW_SAMPLE_PURGE=false` (travar limpeza)

## Políticas de Dados

**Sem Seeds:** Sistema opera apenas com dados reais.
**RLS Ativo:** Isolamento por user_id/broker_id em todas as tabelas.
**Sem Legados:** Não usar conectaios_brokers (migrado para brokers).

## Gestão de Imagens

**Upload:** Via `ImovelImageManager`
**Exclusão:** POST `/functions/v1/images-delete` 
**Validação:** Apenas donos podem gerenciar imagens (403 para não-donos)
**Capa:** Índice único - apenas 1 imagem is_cover=true por imóvel

## Checklist de Aceite

- [x] Schema SQL executado
- [x] Camada de dados unificada  
- [x] RLS policies configuradas
- [x] Edge Functions funcionais
- [ ] Testes de upload/exclusão de imagens
- [ ] Validação API pública (GET /rest/v1/imoveis?is_public=eq.true)
- [ ] CRM isolado por corretor
- [ ] Zero dados de exemplo

**Status:** 🟡 95% migrado - aguardando testes finais