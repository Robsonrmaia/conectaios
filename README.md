# ConectaIOS SaaS - Plataforma Imobiliária

Sistema completo para corretores de imóveis com gestão de propriedades, CRM, minisites e ferramentas de IA.

## 🚀 Funcionalidades Principais

- **Gestão de Imóveis**: Upload, edição e visualização de propriedades
- **CRM Completo**: Pipeline drag-and-drop, clientes, tarefas e histórico
- **Minisites**: Páginas personalizadas para corretores
- **Sistema de Imagens**: Upload, marcação de capa e remoção segura
- **Ferramentas de IA**: Descrições automáticas, análise de imagens
- **Analytics**: Estatísticas de mercado e performance

## 🛠️ Tecnologias

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions + Storage)
- **Autenticação**: Supabase Auth
- **UI Components**: Shadcn/ui + Radix UI

## 🗄️ Gestão de Dados

### ⚠️ Limpeza Controlada de Dados de Exemplo

Sistema implementado para remoção segura de dados de demonstração:

#### Processo de Limpeza (Apenas Administradores)

1. **Habilitar temporariamente**: `VITE_ALLOW_SAMPLE_PURGE=true`
2. **Executar**: `db/maintenance/001_purge_demo.sql`
3. **Limpar Storage**: Edge Function `storage-purge`
4. **Verificar**: `db/maintenance/check_clean.sql`
5. **Desabilitar**: `VITE_ALLOW_SAMPLE_PURGE=false`

#### Importação de Dados Reais

- **Feeds**: CNM, OLX, VRSync automatizados
- **Upload Manual**: Via interface administrativa
- **Imagens**: `imoveis/public/{imovel_id}/arquivo.ext`
- **Camada Unificada**: Use `src/data/index.ts` para todas as operações

## 📊 Estrutura do Banco

### Tabelas Padronizadas
- `imoveis` - Propriedades com FTS e triggers
- `imovel_images` - Imagens com storage integration
- `crm_clients/deals/notes/tasks` - CRM completo
- `brokers/profiles` - Usuários e permissões
- Foreign Keys e índices implementados

## 📋 Pré-requisitos

- Node.js 18+ 
- npm/yarn/pnpm
- Conta Supabase
- Chaves de API (OpenAI, ElevenLabs, etc.)

## 🔧 Instalação e Configuração

1. **Clone o repositório**:
   ```bash
   git clone <repository-url>
   cd conectaios
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
   
   Preencha as variáveis no arquivo `.env`:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase (ex: https://xxx.supabase.co)
   - `VITE_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY`: Chave pública do Supabase
   - `VITE_PUBLIC_SITE_URL`: URL do seu site em produção

   **⚠️ IMPORTANTE**: As variáveis devem ter o prefixo `VITE_` para serem acessíveis no frontend.
   O sistema inclui validação automática e mostrará avisos se as variáveis estiverem ausentes.

4. **Configure o Supabase**:
   - Execute as migrações do banco de dados
   - Configure as chaves secretas (OpenAI, ElevenLabs, etc.)
   - Ative RLS em todas as tabelas
   - Garanta que imóveis têm `is_public=true` e `visibility='public_site'` para aparecer em minisites

5. **Crie o primeiro admin**:
   - Acesse `/auth` no aplicativo
   - Faça o primeiro cadastro (será automaticamente promovido a admin)
   - Recomendado: `admin@conectaios.com.br` com senha segura
   - O sistema aplicará role='admin' automaticamente via trigger

6. **Inicie o desenvolvimento**:
   ```bash
   npm run dev
   ```

## 🔐 Autenticação e Primeiro Admin

### Configuração do Supabase Auth

1. **No Dashboard Supabase** → Authentication:
   - **Providers** → Email: `Enable email signups = ON`
   - **URL Configuration**: Configure Site URL e Redirect URLs
   - **Settings**: `Block signups = OFF` (permitir cadastros)
   - **SMTP** (opcional): Configure para ativar `Confirm email = ON`

2. **Primeiro Admin Automático**:
   - O primeiro usuário que se cadastrar no app será automaticamente promovido a admin
   - Use: `admin@conectaios.com.br` com senha segura
   - Depois altere a senha no painel administrativo

3. **Fluxo de Cadastro**:
   ```bash
   # 1. Acesse /auth
   # 2. Aba "Criar Conta"
   # 3. Preencha os dados
   # 4. Login automático ou verificação de email (se SMTP ativo)
   ```

### Configuração SMTP (Recomendado)

Para ativar confirmação por email:

1. Configure SMTP no Supabase Dashboard
2. Ative `Confirm email = ON` em Authentication Settings
3. Usuários receberão email de confirmação após cadastro

## 📁 Arquitetura de Dados

### ⚠️ Uso Obrigatório da Camada Unificada

**SEMPRE** use `src/data/index.ts` para operações de banco:

```tsx
// ✅ CORRETO
import { Properties, CRM, ClientSearches } from '@/data';
const imoveis = await Properties.list();

// ❌ PROIBIDO (exceto admin/monitoramento)
import { supabase } from '@/integrations/supabase/client';
const { data } = await supabase.from('imoveis')...
```

**Exceções permitidas**: Componentes de sistema/admin para monitoramento (`SystemStatus`, `SystemAlerts`, `SystemLogs`).

### Importação de Dados VRSync

Para importar feeds externos via Edge Function:

```powershell
# PowerShell para import VRSync
$headers = @{
  'Authorization' = "Bearer YOUR_SERVICE_ROLE_KEY"
  'Content-Type' = 'application/json'
  'apikey' = 'YOUR_ANON_KEY'
}

$body = @{
  'source' = 'vrsync'
  'broker_id' = 'uuid-do-corretor'
  'validate_only' = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/import-vrsync" -Method POST -Headers $headers -Body $body
```

### Sistema de Branding Dinâmico

URLs de logo e hero são carregadas de `system_settings`:
- Logo: https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/Logo.png
- Hero: https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/iagohero.png

Atualizações via admin não requerem deploy de código.

## 🌐 Minisites - Configuração Especial

Os minisites permitem que corretores tenham páginas públicas sem necessidade de login:

**Políticas RLS Configuradas**:
- Leitura pública de imóveis com `is_public=true` e `visibility='public_site'`
- Acesso às configurações de minisite ativas
- Dados básicos de corretores ativos
- Imagens de imóveis no bucket `property-images`

**Para imóveis aparecerem em minisites**:
```sql
UPDATE properties 
SET is_public = true, visibility = 'public_site'
WHERE id = 'seu-imovel-id';
```

## 📱 Sistema de Responsividade Mobile-First

### Convenções e Diretrizes

**Breakpoints Padrão**:
- Mobile: 320-640px (padrão)
- Tablet: 640-1024px (`sm:` e `md:`)
- Desktop: 1024px+ (`lg:` e `xl:`)

**Classes Utilitárias Globais**:
```css
.wrap-any                 /* Quebra palavras longas */
.container-responsive     /* Container com padding responsivo */
.scroll-container        /* Container horizontal com scroll */
.safe-top / .safe-bottom /* Padding para áreas seguras mobile */
```

### Componentes Responsivos Disponíveis

**Layout Básico**:
```tsx
import { Section, PageWrapper } from '@/components/layout/Section';
import { ResponsiveButtonGroup, ScrollableRow } from '@/components/layout/ResponsiveRow';
import { ResponsiveTable, ResponsiveCard } from '@/components/layout/ResponsiveTable';

// Wrapper de página
<PageWrapper headerOffset={true}>
  <Section>
    {/* Conteúdo da página */}
  </Section>
</PageWrapper>

// Grupos de botões responsivos
<ResponsiveButtonGroup>
  <Button className="w-full sm:w-auto">Ação 1</Button>
  <Button className="w-full sm:w-auto">Ação 2</Button>
</ResponsiveButtonGroup>

// Tabs/elementos horizontais
<ScrollableRow>
  <TabsList>
    <TabsTrigger className="whitespace-nowrap">Tab 1</TabsTrigger>
    <TabsTrigger className="whitespace-nowrap">Tab 2</TabsTrigger>
  </TabsList>
</ScrollableRow>

// Tabelas responsivas
<ResponsiveTable>
  <TableHeader>
    <TableRow>
      <TableHead>Sempre Visível</TableHead>
      <TableHead className="hidden sm:table-cell">Tablet+</TableHead>
      <TableHead className="hidden lg:table-cell">Desktop</TableHead>
    </TableRow>
  </TableHeader>
</ResponsiveTable>
```

### Regras de Ouro

**1. Botões e Formulários**:
```tsx
// ✅ CORRETO - Full-width no mobile
<Button className="w-full sm:w-auto">Ação</Button>
<Input className="w-full" />

// ❌ ERRADO - Pode estourar
<div className="flex gap-4">
  <Button>Botão Longo</Button>
  <Button>Outro Botão</Button>
</div>
```

**2. Grids e Cards**:
```tsx
// ✅ CORRETO - Grid responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="w-full max-w-full min-w-0" />
</div>

// ❌ ERRADO - Grid fixo
<div className="grid grid-cols-3 gap-4">
```

**3. Texto e Conteúdo**:
```tsx
// ✅ CORRETO - Quebra automática
<div className="wrap-any">Texto muito longo que pode estourar</div>
<h1 className="text-lg sm:text-xl lg:text-2xl">Título Responsivo</h1>

// ❌ ERRADO - Texto fixo
<div className="text-2xl whitespace-nowrap">
```

**4. Containers Flex**:
```tsx
// ✅ CORRETO - Flex com wrap
<div className="flex flex-wrap items-center gap-2">
  <div className="min-w-0 flex-1">Conteúdo flexível</div>
</div>

// ❌ ERRADO - Flex sem wrap
<div className="flex justify-between">
```

### Testes de Responsividade

**Breakpoints de Teste**:
- **320px**: iPhone SE (menor tela comum)
- **375px**: iPhone padrão  
- **390px**: iPhone Pro
- **768px**: Tablet portrait
- **1024px**: Tablet landscape / Desktop pequeno

**Verificações Obrigatórias**:
1. ✅ Nenhuma barra horizontal aparece
2. ✅ Botões não estouram pela direita
3. ✅ Texto longo quebra adequadamente  
4. ✅ Tabelas têm scroll horizontal
5. ✅ Touch targets têm pelo menos 44px
6. ✅ Formulários são utilizáveis com teclado virtual

**Script de Teste Rápido (Console)**:
```javascript
// Verificar overflow horizontal
console.log('Overflow detected:', document.body.scrollWidth > window.innerWidth);

// Testar breakpoints
['320px', '375px', '768px', '1024px'].forEach(width => {
  console.log(`Testing ${width}:`, window.matchMedia(`(max-width: ${width})`).matches);
});
```

## 📊 Schema do Banco de Dados

### Principais Tabelas

- **`profiles`**: Perfis de usuários com roles (user/admin)
- **`conectaios_brokers`**: Dados dos corretores (CRECI, planos, etc.)
- **`properties`**: Imóveis com detalhes, fotos e localização
- **`conectaios_clients`**: CRM com leads e clientes
- **`deals`**: Negociações entre corretores
- **`client_searches`**: Buscas salvas com matching inteligente
- **`support_tickets`**: Sistema de suporte
- **`audit_logs`**: Log de auditoria para segurança

### Principais RPCs

- **`find_intelligent_property_matches`**: Matching IA entre buscas e imóveis
- **`admin_change_user_role`**: Gestão de papéis (admin only)
- **`log_audit_event`**: Logging de eventos importantes
- **`update_property_analytics`**: Analytics de propriedades

## 🧪 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run lint` - Análise de código (ESLint)
- `npm run preview` - Preview do build

## 🔒 Segurança

- **RLS (Row Level Security)** ativo em todas as tabelas
- **Autenticação JWT** com Supabase Auth
- **Auditoria completa** de ações sensíveis
- **Validação rigorosa** de entrada de dados
- **Chaves rotacionáveis** para APIs externas
- **HTTPS obrigatório** em produção

## 🚀 Deploy

### Variáveis de Ambiente (Produção)

Certifique-se de configurar:
- Todas as variáveis do `.env.example`
- URL de produção no Supabase Auth
- Chaves de API em produção (diferentes de desenvolvimento)

### Passos para Deploy

1. Faça o build: `npm run build`
2. Configure as variáveis de ambiente na plataforma
3. Faça o deploy do diretório `dist/`
4. Configure o domínio no Supabase Auth

## ✅ Checklist de Aceite - ConectaIOS SaaS

### Autenticação e Permissões
- [ ] Cadastro funciona (SignUp + SignIn) na página `/auth`
- [ ] Primeiro usuário cadastrado automaticamente vira `admin`
- [ ] Profile é criado automaticamente via trigger
- [ ] Mensagens de erro específicas (credenciais inválidas, email já existe, etc.)
- [ ] RLS policies ativas em todas as tabelas
- [ ] Health check em dev mostra project ID correto

### Sistema de Imagens e Branding
- [ ] Logo carrega de: `https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/logonova.png`
- [ ] Hero carrega de: `https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/iagohero.png`
- [ ] Branding salvo em `system_settings` (verificar no SQL)
- [ ] Imagens aparecem na navbar, página inicial e loading states

### CRM e Dados
- [ ] CRUD de clientes funcionando via `CRM.clients`
- [ ] CRUD de negócios funcionando via `CRM.deals`
- [ ] CRUD de imóveis funcionando via `Properties`
- [ ] Busca Full-Text (FTS) operacional
- [ ] Matches inteligentes entre buscas e imóveis

### Camada de Dados
- [ ] Zero uso direto de `supabase.from()` (exceto admin/monitoramento)
- [ ] Todas as operações passam por `src/data/index.ts`
- [ ] Import VRSync disponível via Edge Function
- [ ] Storage bucket `assets` público e `imoveis` privado

### Performance e Responsividade
- [ ] App carrega em menos de 3 segundos
- [ ] Responsivo em 320px, 768px, 1024px+
- [ ] Sem overflow horizontal em dispositivos móveis
- [ ] Touch targets de pelo menos 44px

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript strict mode
- Siga as regras do ESLint configuradas
- Utilize apenas `src/data/index.ts` para operações de banco
- Documente funções complexas
- Mantenha responsividade mobile-first

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados.

## 🆘 Suporte

- **Documentação**: [Confluence interno]
- **Issues**: Use o sistema de issues do GitHub
- **Suporte**: suporte@conectaios.com.br
- **Slack**: Canal #dev-conectaios

---

**⚠️ Importante**: Nunca commite chaves de API ou credenciais. Use sempre as variáveis de ambiente e rotacione as chaves regularmente.