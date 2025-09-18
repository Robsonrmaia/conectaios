# ConectaIOS - Plataforma Imobiliária Completa

Uma plataforma moderna e segura para corretores de imóveis, com recursos avançados de CRM, gestão de propriedades, inteligência artificial e automação.

## 🚀 Funcionalidades

- **CRM Inteligente**: Gestão completa de clientes e leads
- **Catálogo de Imóveis**: Sistema robusto de propriedades com fotos, vídeos e tours 360°
- **IA Integrada**: Assistente virtual, geração de conteúdo e matching inteligente
- **Marketplace**: Conecte-se com outros corretores e amplie sua rede
- **Sistema de Deals**: Negociações transparentes e contratos digitais
- **Minisites**: Páginas personalizadas para cada corretor
- **Automações**: WhatsApp, e-mail e notificações inteligentes

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Autenticação**: Supabase Auth com RLS
- **Integração IA**: OpenAI, Gemini, Hugging Face, ElevenLabs
- **Pagamentos**: Asaas (PIX, cartão, boleto)
- **Deploy**: Vercel/Netlify

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

5. **Inicie o desenvolvimento**:
   ```bash
   npm run dev
   ```

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

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript strict mode
- Siga as regras do ESLint configuradas
- Mantenha cobertura de testes acima de 80%
- Documente funções complexas

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados.

## 🆘 Suporte

- **Documentação**: [Confluence interno]
- **Issues**: Use o sistema de issues do GitHub
- **Suporte**: suporte@conectaios.com.br
- **Slack**: Canal #dev-conectaios

---

**⚠️ Importante**: Nunca commite chaves de API ou credenciais. Use sempre as variáveis de ambiente e rotacione as chaves regularmente.