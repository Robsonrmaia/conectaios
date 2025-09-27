# ConectaIOS SaaS - Migração Supabase (paawojkqrggnuvpnnwrc)

## Produção (Supabase novo)

### Tabelas Canônicas

**Core do Sistema:**
- `imoveis` - Propriedades principais
- `imovel_images` - Imagens das propriedades  
- `imovel_features` - Características dos imóveis
- `profiles` - Perfis de usuários
- `brokers` - Dados específicos de corretores

**CRM Integrado:**
- `crm_clients` - Clientes do corretor
- `crm_deals` - Negociações em andamento
- `crm_notes` - Anotações do CRM
- `crm_tasks` - Tarefas e lembretes

**Sistema de Leads:**
- `leads` - Leads capturados
- `minisites` - Páginas de corretor
- `property_submissions` - Submissões públicas

**Gamificação:**
- `gam_events` - Eventos de pontuação
- `gam_user_monthly` - Estatísticas mensais
- `gam_badges` - Sistema de badges
- `gam_points_rules` - Regras de pontuação

### Storage

**Bucket:** `imoveis` (não público)
**Estrutura:** `public/<imovel_id>/<uuid>.<ext>`
**Políticas RLS:** Apenas donos podem CRUD suas imagens

### Camada de Dados Unificada

**OBRIGATÓRIO:** Usar apenas `src/data/index.ts`

```typescript
// ✅ CORRETO
import { Properties, CRM } from '@/data';
const imoveis = await Properties.list({ q: 'casa' });

// ❌ ERRADO 
import { supabase } from '@/integrations/supabase/client';
const { data } = await supabase.from('imoveis').select();
```

### Configuração de Produção

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://paawojkqrggnuvpnnwrc.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
VITE_ALLOW_SAMPLE_PURGE=false
```

**Edge Functions (Dashboard → Functions → Settings):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOW_SAMPLE_PURGE=false`

### Sistema de Imagens

**Upload:**
1. Interface: `ImovelImageManager` component
2. Destino: bucket `imoveis/public/<imovel_id>/`
3. Registro: tabela `imovel_images`

**Exclusão:**
```javascript
POST /functions/v1/images-delete
Headers: { Authorization: Bearer <user_token> }
Body: { imovel_id, image_id, storage_path }
```

**Capa do Imóvel:**
- Apenas uma `is_cover=true` por imóvel
- Constraint único no banco garante integridade

### Sem Dados de Exemplo

- `ALLOW_SAMPLE_PURGE=false` (produção travada)
- Sem seeds automáticos
- Apenas dados reais via feeds ou upload manual
- Tabelas core/CRM iniciam vazias

### Feeds de Dados Reais

**Automatizados (Edge Functions):**
- CNM: `feeds-cnm`
- OLX: `feeds-olx` 
- VRSync: `import-vrsync`

**Manual:**
- Upload via interface web
- Integração com `src/data/index.ts`

### Segurança RLS

Todas as tabelas principais têm RLS habilitado:
- Imóveis: apenas dono pode CRUD
- CRM: dados isolados por corretor
- Leads: corretor vê apenas seus leads
- Imagens: apenas dono pode excluir

### Monitoramento

- Logs de auditoria em `audit_log`
- Webhooks em `webhook_logs`
- Sem dados pessoais em logs

---

## Checklist de Aceite

### ✅ Auth/Env
- [ ] App abre logado sem erros de env
- [ ] Variáveis de ambiente corretas
- [ ] Edge Functions com secrets configurados

### ✅ Propriedades Públicas
- [ ] `GET /rest/v1/imoveis?is_public=eq.true` retorna 200
- [ ] Políticas RLS permitem leitura pública seletiva

### ✅ Gestão de Imagens (dono)
- [ ] Upload de 2 imagens funciona
- [ ] Definir capa deixa apenas uma `is_cover=true`
- [ ] URL pública abre sem token
- [ ] Exclusão remove do Storage e tabela
- [ ] Usuário não-dono recebe 403 ao excluir

### ✅ CRM Isolado
- [ ] Criar `crm_client` funciona
- [ ] Criar `crm_deal` atrelado a imóvel
- [ ] Dados visíveis apenas ao dono
- [ ] RLS impede acesso cruzado

### ✅ Limpeza Completa
- [ ] Tabelas core sem registros dummy
- [ ] Sem dados conectaios_brokers
- [ ] Ambiente pronto para dados reais

### Aprovação Final
- [ ] Build passa sem erros TypeScript
- [ ] Todos os pontos do checklist ✅
- [ ] README atualizado
- [ ] Env com placeholders (não commitar values)