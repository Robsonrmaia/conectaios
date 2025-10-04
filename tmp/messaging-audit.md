# Auditoria de Mensageria Interna - ConectaIOS

Data: 2025-10-04
Objetivo: Mapear arquivos exclusivos da mensageria interna para remoção segura

## 🔍 Arquivos Exclusivos do Chat Interno

### Páginas/Rotas
- `src/pages/app/Inbox.tsx` - Página principal da mensageria interna

### Componentes
- `src/components/EnhancedMessaging.tsx` - Componente principal do chat

### Hooks
- `src/hooks/useChat.ts` - Hook para gerenciar chat individual
- `src/hooks/useEnhancedChat.tsx` - Hook avançado com presença e typing

### Data/Services
- `src/data/chat.ts` - Funções de comunicação com Supabase chat
- `src/integrations/messaging/api.ts` - API de integração de mensageria

### Rotas no App.tsx
```tsx
<Route path="inbox" element={<Inbox />} />
<Route path="mensagens" element={<Navigate to="/app/inbox" replace />} />
```

### Itens de Menu/Navegação
**AppSidebar.tsx:**
- Item "Mensagens" (linha ~73-76)
  - url: '/app/inbox'
  - icon: MessageSquare
  - label: 'Mensagens'

## 🔄 Arquivos a Serem Modificados (não removidos)

### src/App.tsx
- Remover rota `/app/inbox`
- Remover rota `/app/mensagens`
- Remover import de `Inbox`

### src/components/AppSidebar.tsx
- Modificar item "Mensagens" para usar hook `useChatExternal`
- Mudar de link para onClick handler

## ✅ Arquivos Criados para Substituição

### src/lib/chatExternal.ts
- Helper puro para construir URLs do chat externo
- Função `buildChatUrl()`
- Type `PropertyLite`

### src/hooks/useChatExternal.tsx
- Hook React para obter URL do chat com tokens da sessão
- Função `getChatUrl()` - retorna URL
- Função `openChat()` - abre em nova aba

## 🚫 Arquivos que NÃO devem ser tocados

- Todos os arquivos de minisite (`src/pages/public/*`, `src/components/Minisite*`)
- Marketplace (`src/pages/app/Marketplace.tsx`)
- CRM (`src/components/EnhancedCRM.tsx`, `src/pages/app/CRM.tsx`)
- Autenticação (`src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`)
- Cadastro de imóveis (`src/pages/app/Imoveis.tsx`)
- Upload/Storage (`src/components/Photo*`, `src/hooks/useImageUpload.tsx`)
- Layout global (`src/components/ui/*`, `src/index.css`, `tailwind.config.ts`)
- Componentes genéricos com "Message" no nome que não são de chat:
  - `src/components/AdminTestimonialManager.tsx` (MessageSquare é apenas ícone)
  - `src/components/ConectaAIChat.tsx` (chat de IA, não mensageria)
  - Qualquer componente que use `toast.error(error.message)` ou similar

## 📋 Próximos Passos

1. ✅ Criar helpers para chat externo (`chatExternal.ts`, `useChatExternal.tsx`)
2. ⏳ Modificar `AppSidebar.tsx` para usar chat externo
3. ⏳ Encontrar e modificar botões de mensagem em cards de imóveis
4. ⏳ Remover arquivos exclusivos listados acima
5. ⏳ Limpar rotas no `App.tsx`
6. ⏳ Build e testes

## ⚠️ Notas Importantes

- Não alterar tabelas/migrations do Supabase neste PR
- Manter todas as referências a `chat_*` tables no banco intactas
- Tokens (access_token, refresh_token) gerados em runtime, não persistidos
- Chat externo abre em nova aba (`target="_blank"`)
- Suporta mensagem pré-preenchida quando vem de card de imóvel
