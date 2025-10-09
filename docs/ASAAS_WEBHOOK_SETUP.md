# 🔔 Configuração de Webhooks Asaas - ConectaIOS

Este documento descreve como configurar e testar os webhooks da integração Asaas no ConectaIOS.

---

## 📍 URL do Webhook

```
https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/asaas-integration
```

**Importante:** Esta URL deve ser configurada no painel administrativo do Asaas.

---

## 🎯 Eventos a Configurar

Configure os seguintes eventos no painel Asaas para receber notificações automáticas:

### Eventos de Pagamento
- ✅ **PAYMENT_CREATED** - Pagamento criado
- ✅ **PAYMENT_UPDATED** - Pagamento atualizado
- ✅ **PAYMENT_CONFIRMED** - Pagamento confirmado (pago)
- ✅ **PAYMENT_RECEIVED** - Pagamento recebido
- ✅ **PAYMENT_OVERDUE** - Pagamento vencido
- ✅ **PAYMENT_DELETED** - Pagamento deletado
- ✅ **PAYMENT_REFUNDED** - Pagamento estornado
- ✅ **PAYMENT_RECEIVED_IN_CASH** - Pagamento recebido em dinheiro

### Eventos de Assinatura (Opcional)
- ✅ **SUBSCRIPTION_CREATED** - Assinatura criada
- ✅ **SUBSCRIPTION_UPDATED** - Assinatura atualizada
- ✅ **SUBSCRIPTION_DELETED** - Assinatura deletada

---

## 🔐 Configuração de Segurança

### 1. Gerar Secret no Asaas

1. Acesse o painel Asaas: https://www.asaas.com/webhooks (ou sandbox)
2. Clique em "Configurações de Webhook"
3. Gere um **Token de Validação** (Webhook Secret)
4. **Copie este token** - você precisará configurá-lo no Supabase

### 2. Configurar Secret no Supabase

#### Via Supabase Studio:
1. Acesse: https://supabase.com/dashboard/project/paawojkqrggnuvpnnwrc/settings/functions
2. Na seção "Secrets", adicione:
   - **Nome:** `ASAAS_WEBHOOK_SECRET`
   - **Valor:** Cole o token gerado no Asaas
3. Salve e reinicie as Edge Functions se necessário

#### Via CLI (alternativo):
```bash
supabase secrets set ASAAS_WEBHOOK_SECRET=seu_token_aqui
```

---

## 🔧 Passos para Configuração no Painel Asaas

### Ambiente Sandbox (Testes)
1. Acesse: https://sandbox.asaas.com/webhooks
2. Clique em "Adicionar Webhook"
3. Configure:
   - **URL:** `https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/asaas-integration`
   - **Versão da API:** v3
   - **Tipo de Autenticação:** Token de Validação
   - **Token:** (o mesmo configurado no Supabase)
4. Selecione todos os eventos listados acima
5. Salve a configuração

### Ambiente Produção
1. Acesse: https://www.asaas.com/webhooks
2. Repita os mesmos passos do sandbox
3. **IMPORTANTE:** Use o mesmo URL e secret configurados

---

## 🧪 Testando a Integração

### 1. Teste Manual via cURL

```bash
curl -X POST https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/asaas-integration \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: seu_token_asaas" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_test_123",
      "customer": "cus_000123456",
      "subscription": "sub_000123456",
      "value": 99.90,
      "status": "CONFIRMED",
      "billingType": "PIX",
      "dueDate": "2025-10-15",
      "paymentDate": "2025-10-09T12:00:00.000-03:00",
      "invoiceUrl": "https://www.asaas.com/i/pay_test_123",
      "description": "Teste de webhook",
      "externalReference": "broker_123"
    }
  }'
```

### 2. Teste via Painel Asaas

1. Acesse a página de webhooks no painel
2. Clique em "Testar Webhook"
3. Selecione um evento (ex: PAYMENT_CONFIRMED)
4. Envie a requisição de teste
5. Verifique o log de resposta

### 3. Verificar no Banco de Dados

Após enviar um webhook de teste, verifique no Supabase SQL Editor:

```sql
-- Ver webhooks recebidos
SELECT * FROM asaas_webhooks 
ORDER BY received_at DESC 
LIMIT 10;

-- Ver pagamentos sincronizados
SELECT * FROM subscription_payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver status dos brokers atualizados
SELECT id, subscription_status, subscription_expires_at 
FROM brokers 
WHERE asaas_customer_id IS NOT NULL;
```

---

## 📊 Monitoramento

### Webhook Monitor (Admin)
- Acesse: `/app/admin` → Aba "Asaas"
- Visualize webhooks recebidos em tempo real
- Veja status de processamento e erros
- Tente reprocessar webhooks com falha

### Logs da Edge Function
- Acesse: https://supabase.com/dashboard/project/paawojkqrggnuvpnnwrc/functions/asaas-integration/logs
- Filtre por:
  - ✅ Sucessos: procure por "Webhook processed successfully"
  - ❌ Erros: procure por "Error processing webhook"
  - 🔐 Falhas de assinatura: "Invalid webhook signature"

---

## 🚨 Troubleshooting

### Problema: Webhook retorna erro 401 (Unauthorized)

**Causa:** Secret ASAAS_WEBHOOK_SECRET não configurado ou incorreto

**Solução:**
1. Verifique se o secret está configurado no Supabase
2. Confirme que o token no Asaas é o mesmo do Supabase
3. Reinicie as Edge Functions após configurar o secret

---

### Problema: Pagamentos não aparecem em subscription_payments

**Causa 1:** ExternalReference do pagamento não corresponde a um broker_id

**Solução:**
- Verifique o campo `externalReference` no Asaas
- Deve conter o UUID do broker (tabela `brokers.id`)
- Configure ao criar assinatura/pagamento:
  ```typescript
  externalReference: broker.id // UUID do broker
  ```

**Causa 2:** Webhook não está processando evento PAYMENT_*

**Solução:**
- Verifique logs da função: procure por "Processing event: PAYMENT_"
- Confirme que o evento está configurado no painel Asaas

---

### Problema: Status do broker não atualiza

**Causa:** Broker não encontrado ou subscription_id inválido

**Solução:**
1. Verifique se o broker existe:
   ```sql
   SELECT * FROM brokers WHERE id = 'uuid_do_external_reference';
   ```
2. Confirme que o `subscription_id` no webhook corresponde ao Asaas
3. Verifique logs: procure por "Updating broker subscription_status"

---

### Problema: Webhooks duplicados ou loop infinito

**Causa:** Reprocessamento automático de webhooks com falha

**Solução:**
1. Verifique a tabela `asaas_webhooks`:
   ```sql
   SELECT event, processed, error, COUNT(*) 
   FROM asaas_webhooks 
   GROUP BY event, processed, error;
   ```
2. Marque webhooks problemáticos como processados:
   ```sql
   UPDATE asaas_webhooks 
   SET processed = true, error = 'Duplicado - ignorado manualmente'
   WHERE id = 'webhook_id';
   ```

---

## 🔄 Sincronização Periódica

Além dos webhooks em tempo real, há uma função de sincronização periódica:

### Função: `sync-asaas-payments`

**O que faz:**
- Busca pagamentos pendentes/atrasados diretamente do Asaas
- Sincroniza com a tabela `subscription_payments`
- Atualiza status dos brokers
- Complementa os webhooks em caso de falha

### Executar Manualmente

Via cURL:
```bash
curl -X POST https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/sync-asaas-payments \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY"
```

Via Supabase Studio:
1. Acesse: Functions → sync-asaas-payments
2. Clique em "Invoke Function"

### Configurar Execução Automática (Cron)

Execute no SQL Editor do Supabase:

```sql
-- Executar todos os dias às 6h da manhã
SELECT cron.schedule(
  'sync-asaas-payments-daily',
  '0 6 * * *', -- Todo dia às 6h
  $$
  SELECT net.http_post(
    url := 'https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/sync-asaas-payments',
    headers := '{"Authorization": "Bearer SEU_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

**IMPORTANTE:** Substitua `SEU_SUPABASE_SERVICE_ROLE_KEY` pela chave real.

Para listar cron jobs configurados:
```sql
SELECT * FROM cron.job;
```

Para remover um cron job:
```sql
SELECT cron.unschedule('sync-asaas-payments-daily');
```

---

## 📝 Checklist de Configuração

Use este checklist para validar a configuração completa:

- [ ] URL do webhook configurada no Asaas
- [ ] Token de validação gerado no Asaas
- [ ] Secret `ASAAS_WEBHOOK_SECRET` configurado no Supabase
- [ ] Eventos PAYMENT_* habilitados no webhook
- [ ] Teste manual enviado e bem-sucedido
- [ ] Registro aparece em `asaas_webhooks`
- [ ] Pagamento criado em `subscription_payments`
- [ ] Status do broker atualizado corretamente
- [ ] Cron job de sincronização configurado
- [ ] Monitoramento funcionando no admin

---

## 🆘 Suporte

Se encontrar problemas não documentados aqui:

1. **Verifique os logs:** 
   - Edge Function logs no Supabase Studio
   - Tabela `asaas_webhooks` para histórico
   - Tabela `asaas_webhook_retries` para tentativas de reprocessamento

2. **Teste a integração passo a passo:**
   - Use o teste manual via cURL
   - Valide cada etapa no banco de dados
   - Compare com exemplos deste documento

3. **Revise a configuração:**
   - Secrets corretos no Supabase
   - URL correta no Asaas
   - Eventos habilitados

---

## 📚 Referências

- [Documentação Asaas - Webhooks](https://docs.asaas.com/reference/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Código-fonte: asaas-integration](../supabase/functions/asaas-integration/index.ts)
- [Código-fonte: sync-asaas-payments](../supabase/functions/sync-asaas-payments/index.ts)
