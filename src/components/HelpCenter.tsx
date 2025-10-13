import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Home, 
  Users, 
  MessageCircle, 
  Settings, 
  Lightbulb,
  Phone,
  Mail,
  ExternalLink,
  Target,
  Handshake,
  Store,
  Trophy,
  Gift,
  Wrench,
  Globe,
  Smartphone,
  BarChart3,
  Mic,
  CreditCard,
  User,
  Camera,
  Upload,
  FileText,
  Calendar,
  Bot,
  Star,
  Share2,
  Palette,
  Shield,
  HelpCircle,
  Video,
  CheckSquare,
  Calculator,
  Eye,
  Zap,
  TrendingUp,
  BookOpen,
  PlayCircle,
  Download,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Tag
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  tags?: string[];
}

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  faqs: FAQ[];
}

const helpCategories: HelpCategory[] = [
  {
    id: 'imoveis',
    title: 'Gestão de Imóveis',
    icon: Home,
    color: 'bg-blue-500',
    faqs: [
      {
        question: 'Como cadastrar um novo imóvel?',
        answer: 'Acesse "Imóveis" > "Adicionar Imóvel". Preencha endereço, valor, tipo, características, descrição detalhada. Adicione pelo menos 8 fotos de qualidade. Configure a visibilidade como "Site Público" para aparecer no seu minisite.',
        tags: ['cadastro', 'novo', 'imóvel']
      },
      {
        question: 'Como importar imóveis colando print de tela?',
        answer: 'Vá em "Ferramentas" > "Importação por Imagem". Cole um print ou foto da listagem do imóvel. Nossa IA extrairá automaticamente as informações como preço, endereço, características e criará o cadastro.',
        tags: ['importar', 'print', 'imagem', 'ia']
      },
      {
        question: 'Como importar imóveis colando texto?',
        answer: 'Em "Ferramentas" > "Importação por Texto", cole anúncios de texto de sites, WhatsApp ou outros sistemas. A IA processará e extrairá dados como valor, endereço, descrição, metragem automaticamente.',
        tags: ['importar', 'texto', 'anúncio', 'ia']
      },
      {
        question: 'Como conectar com portais (Viva Real, ZAP, OLX)?',
        answer: 'Acesse "Admin" > "Integrações" > "Feeds de Imóveis". Configure suas credenciais dos portais para importação automática. Os imóveis serão sincronizados diariamente.',
        tags: ['portais', 'integração', 'vivareal', 'zap']
      },
      {
        question: 'O que significa a qualidade do imóvel?',
        answer: 'Indicador de 1-5 estrelas baseado em: número de fotos (mín. 8), descrição completa (mín. 150 caracteres), dados preenchidos (100%), localização precisa. Imóveis 5 estrelas aparecem primeiro nas buscas.',
        tags: ['qualidade', 'estrelas', 'ranking']
      },
      {
        question: 'Como organizar e editar fotos dos imóveis?',
        answer: 'No imóvel, clique "Gerenciar Fotos". Arraste para reordenar (1ª = capa), delete fotos ruins, use "Photo Enhancer" para melhorar automaticamente. Máximo 50 fotos por imóvel.',
        tags: ['fotos', 'editar', 'organizar', 'enhancer']
      },
      {
        question: 'Como fazer virtual staging das fotos?',
        answer: 'Em "Ferramentas" > "Virtual Staging", selecione o imóvel e fotos. Escolha estilo de decoração (moderno, clássico, minimalista). A IA adicionará móveis virtuais em 2-3 minutos.',
        tags: ['staging', 'decoração', 'móveis', 'virtual']
      },
      {
        question: 'Como gerar descrições automáticas com IA?',
        answer: 'No cadastro do imóvel, clique "Gerar Descrição IA". Nossa IA criará textos atrativos baseados nas características. Você pode editar e personalizar o resultado final.',
        tags: ['descrição', 'ia', 'automática', 'texto']
      },
      {
        question: 'Como configurar formulário para clientes enviarem imóveis?',
        answer: 'Vá em "Admin" > "Configurações" > "Formulário Público". Ative o formulário e customize campos. Clientes podem enviar imóveis via link público, chegando como "Submissions" para aprovação.',
        tags: ['formulário', 'clientes', 'submissions', 'público']
      },
      {
        question: 'Como duplicar imóveis para criar variações?',
        answer: 'No imóvel desejado, clique nos 3 pontos > "Duplicar". Útil para apartamentos no mesmo prédio ou casas em condomínio. Edite apenas os dados que diferem.',
        tags: ['duplicar', 'copiar', 'variações']
      },
      {
        question: 'Como marcar imóveis como vendidos/alugados?',
        answer: 'Edite o imóvel > Status > "Vendido" ou "Alugado". O imóvel sai das buscas públicas mas fica no histórico. Você pode reativar depois se necessário.',
        tags: ['vendido', 'alugado', 'status', 'inativo']
      },
      {
        question: 'Como criar tours 360° dos imóveis?',
        answer: 'Use "Ferramentas" > "Tour 360°". Faça upload de fotos panorâmicas ou conecte câmeras 360°. O tour ficará integrado na página do imóvel automaticamente.',
        tags: ['tour', '360', 'panorâmica', 'realidade']
      }
    ]
  },
  {
    id: 'crm',
    title: 'CRM e Clientes',
    icon: Users,
    color: 'bg-green-500',
    faqs: [
      {
        question: 'Como funciona o pipeline do CRM?',
        answer: 'Pipeline organiza leads em: Novo Lead → Qualificado → Apresentação → Proposta → Negociação → Fechado. Arraste cards entre etapas. Cada etapa tem ações específicas e métricas de conversão.',
        tags: ['pipeline', 'etapas', 'leads', 'funil']
      },
      {
        question: 'Como cadastrar clientes por voz?',
        answer: 'No CRM, clique no microfone e fale: "Cliente João Silva, telefone 11999999999, interessado em apartamento de 2 quartos na Vila Madalena até R$ 500 mil". A IA processará e criará o cadastro.',
        tags: ['voz', 'cadastro', 'ia', 'áudio']
      },
      {
        question: 'Como agendar compromissos por voz?',
        answer: 'Use o botão de microfone na agenda e diga: "Agendar visita com Maria Santos amanhã às 15h no apartamento da Rua Augusta". O sistema criará o evento automaticamente.',
        tags: ['agenda', 'voz', 'compromisso', 'visita']
      },
      {
        question: 'Como configurar follow-up automático?',
        answer: 'No perfil do cliente > "Automações" > defina intervalos (3, 7, 15, 30 dias). O sistema enviará lembretes automáticos por email/WhatsApp e notificará você para contato.',
        tags: ['followup', 'automação', 'lembretes']
      },
      {
        question: 'Como qualificar leads automaticamente?',
        answer: 'Configure critérios em "CRM" > "Configurações": orçamento, prazo, localização preferida. Leads que atendem critérios são marcados como "Qualificados" automaticamente.',
        tags: ['qualificação', 'critérios', 'automático']
      },
      {
        question: 'Como importar contatos do celular/planilha?',
        answer: 'CRM > "Importar Contatos". Conecte com Google/iPhone ou faça upload de CSV/Excel. Mapeie os campos (nome, telefone, email) e importe até 10.000 contatos.',
        tags: ['importar', 'contatos', 'planilha', 'csv']
      },
      {
        question: 'Como criar tags para organizar clientes?',
        answer: 'Em "CRM" > "Tags", crie categorias como "VIP", "Investidor", "Primeira Compra". Aplique tags nos clientes para filtrar e criar campanhas segmentadas.',
        tags: ['tags', 'organizar', 'categorias', 'filtros']
      },
      {
        question: 'Como ver histórico completo do cliente?',
        answer: 'No perfil do cliente, aba "Timeline" mostra: primeira interação, imóveis visualizados, mensagens trocadas, visitas agendadas, propostas enviadas - histórico completo cronológico.',
        tags: ['histórico', 'timeline', 'interações']
      },
      {
        question: 'Como configurar campos personalizados?',
        answer: 'Admin > "CRM" > "Campos Personalizados". Adicione campos específicos do seu negócio: profissão, renda, indicação, origem. Use nos relatórios e filtros.',
        tags: ['campos', 'personalizado', 'customizar']
      }
    ]
  },
  {
    id: 'match',
    title: 'Match IA',
    icon: Target,
    color: 'bg-pink-500',
    faqs: [
      {
        question: 'Como funciona o sistema de Match IA?',
        answer: 'A IA analisa perfil do cliente (orçamento, localização, características desejadas) e compara com seu portfólio. Gera matches automáticos com score de 1-100% de compatibilidade.',
        tags: ['match', 'ia', 'compatibilidade', 'automático']
      },
      {
        question: 'Como configurar preferências dos clientes?',
        answer: 'No perfil do cliente > "Preferências", defina: faixa de preço, bairros, tipo de imóvel, quartos, características especiais. Quanto mais detalhado, melhor o match.',
        tags: ['preferências', 'perfil', 'critérios']
      },
      {
        question: 'Como responder aos matches rapidamente?',
        answer: 'Dashboard mostra matches pendentes. Clique "Enviar" para compartilhar imóvel via WhatsApp/Email automaticamente. Resposta rápida (menos 1h) gera mais pontos na gamificação.',
        tags: ['resposta', 'rápida', 'enviar', 'points']
      },
      {
        question: 'Como melhorar a precisão dos matches?',
        answer: 'Complete 100% dos dados dos imóveis, use descrições detalhadas, adicione características especiais. Marque feedback nos matches (cliente gostou/não gostou) para IA aprender.',
        tags: ['precisão', 'feedback', 'aprendizado']
      },
      {
        question: 'Posso criar matches manuais?',
        answer: 'Sim! No perfil do cliente, clique "Buscar Imóveis" > selecione imóveis compatíveis > "Criar Match Manual". Útil para casos específicos que a IA pode não capturar.',
        tags: ['manual', 'buscar', 'específico']
      },
      {
        question: 'Como ver histórico de matches enviados?',
        answer: 'Cliente > aba "Matches" mostra todos enviados, com status: visualizado, interessado, descartado. Inclui métricas de engajamento e tempo de resposta.',
        tags: ['histórico', 'enviados', 'status', 'métricas']
      }
    ]
  },
  {
    id: 'negociacoes',
    title: 'Negociações e Deals',
    icon: Handshake,
    color: 'bg-yellow-500',
    faqs: [
      {
        question: 'Como criar uma nova negociação/deal?',
        answer: 'CRM > cliente > "Nova Negociação" ou Dashboard > "Criar Deal". Defina imóvel, valor da proposta, prazo, condições. O deal entra no pipeline para acompanhamento.',
        tags: ['deal', 'negociação', 'proposta', 'criar']
      },
      {
        question: 'Como gerar contratos automaticamente?',
        answer: 'No deal > "Gerar Contrato". Escolha template (compra/venda/locação), preencha dados automaticamente do cliente/imóvel. Gera PDF profissional para assinatura.',
        tags: ['contrato', 'automático', 'template', 'pdf']
      },
      {
        question: 'Como fazer counter-proposals?',
        answer: 'No deal, clique "Counter-Proposal". Sistema permite criar múltiplas versões da proposta com valores/condições diferentes. Cliente recebe notificação para análise.',
        tags: ['counter', 'proposta', 'versões', 'negociar']
      },
      {
        question: 'Como calcular comissões automaticamente?',
        answer: 'Ferramentas > "Calculadora de Comissões". Defina percentuais por tipo de operação. Nos deals, comissão é calculada automaticamente baseada no valor fechado.',
        tags: ['comissão', 'cálculo', 'percentual', 'automático']
      },
      {
        question: 'Como acompanhar o status das negociações?',
        answer: 'Dashboard > "Pipeline de Vendas" mostra todos os deals por etapa. Use filtros por período, corretor, valor. Métricas mostram taxa de conversão e tempo médio.',
        tags: ['status', 'acompanhar', 'pipeline', 'métricas']
      },
      {
        question: 'Como configurar lembretes de follow-up?',
        answer: 'No deal > "Configurar Lembretes". Defina intervalos automáticos (24h, 3 dias, 1 semana). Sistema enviará notificações para você entrar em contato.',
        tags: ['lembretes', 'followup', 'automático', 'notificações']
      }
    ]
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: Store,
    color: 'bg-indigo-500',
    faqs: [
      {
        question: 'Como meus imóveis aparecem no marketplace?',
        answer: 'Configure imóvel com visibilidade "Site Público". Imóveis com qualidade 4+ estrelas aparecem automaticamente no marketplace público, ordenados por qualidade e relevância.',
        tags: ['marketplace', 'público', 'visibilidade', 'qualidade']
      },
      {
        question: 'Como melhorar posicionamento no marketplace?',
        answer: 'Aumente qualidade: adicione mais fotos (8+), descrição detalhada (200+ caracteres), preencha todas características, use virtual staging, atualize preços regularmente.',
        tags: ['posicionamento', 'seo', 'ranking', 'qualidade']
      },
      {
        question: 'Como funciona a busca avançada?',
        answer: 'Clientes podem filtrar por: localização (raio), preço, quartos, área, tipo, características (piscina, garagem). Busca usa IA para entender linguagem natural.',
        tags: ['busca', 'filtros', 'avançada', 'ia']
      },
      {
        question: 'Como acompanhar visualizações dos imóveis?',
        answer: 'Dashboard > "Analytics de Imóveis" mostra: visualizações, interesse demonstrado, contatos gerados por imóvel. Use para otimizar preços e descrições.',
        tags: ['analytics', 'visualizações', 'métricas', 'performance']
      },
      {
        question: 'Como destacar imóveis no marketplace?',
        answer: 'Marque imóveis como "Destaque" no cadastro. Imóveis destacados aparecem primeiro nos resultados e têm banner especial. Limite de 10 por corretor.',
        tags: ['destaque', 'primeiro', 'banner', 'promocional']
      }
    ]
  },
  {
    id: 'gamificacao',
    title: 'Gamificação',
    icon: Trophy,
    color: 'bg-amber-500',
    faqs: [
      {
        question: 'Como funciona o sistema de pontos?',
        answer: 'Ganhe pontos por ações: cadastrar imóvel (50), responder match <1h (100), fechar negócio (500), cliente 5 estrelas (200). Pontos se convertem em badges e posição no ranking.',
        tags: ['pontos', 'ações', 'badges', 'ranking']
      },
      {
        question: 'Quais badges posso conquistar?',
        answer: 'Badges incluem: Velocista (respostas rápidas), Fotógrafo (imóveis com 10+ fotos), Negociador (10+ deals), Top Seller (líder mensal). Cada badge tem critérios específicos.',
        tags: ['badges', 'conquistas', 'critérios', 'especialização']
      },
      {
        question: 'Como funciona o ranking mensal?',
        answer: 'Ranking baseado em pontos acumulados no mês. Top 3 ganham benefícios: destaque no marketplace, desconto nos planos, certificados digitais. Reset todo dia 1º.',
        tags: ['ranking', 'mensal', 'benefícios', 'reset']
      },
      {
        question: 'Como ver meu progresso detalhado?',
        answer: 'Página "Gamificação" mostra: pontos totais/mensais, badges conquistadas, posição ranking, metas próximas, histórico de conquistas, comparação com outros corretores.',
        tags: ['progresso', 'detalhado', 'metas', 'histórico']
      },
      {
        question: 'Posso desativar a gamificação?',
        answer: 'Sim, em Perfil > "Gamificação" > desmarque "Participar do ranking". Você ainda ganha pontos mas não aparece nos rankings públicos nem recebe notificações.',
        tags: ['desativar', 'privacidade', 'opcional', 'configurar']
      }
    ]
  },
  {
    id: 'indicacoes',
    title: 'Indique e Ganhe',
    icon: Gift,
    color: 'bg-emerald-500',
    faqs: [
      {
        question: 'Como funciona o programa Indique e Ganhe?',
        answer: 'Convide corretores pelo seu link único. Quando se cadastram e fazem primeira assinatura, você ganha desconto recorrente na sua mensalidade. Sem limite de indicações.',
        tags: ['indicação', 'desconto', 'recorrente', 'link']
      },
      {
        question: 'Quanto ganho por indicação?',
        answer: 'Você recebe desconto permanente de R$ 20/mês na sua assinatura para cada corretor ativo que indicou. Se indicar 5 corretores ativos, sua mensalidade fica gratuita.',
        tags: ['valor', 'desconto', 'permanente', 'gratuita']
      },
      {
        question: 'Como compartilhar meu link de indicação?',
        answer: 'Página "Indicações" > copie seu link único. Compartilhe via WhatsApp, redes sociais, email. Inclui seu nome automaticamente e rastreia conversões.',
        tags: ['link', 'compartilhar', 'whatsapp', 'rastreamento']
      },
      {
        question: 'Como acompanhar minhas indicações?',
        answer: 'Dashboard de indicações mostra: links clicados, cadastros realizados, assinaturas ativadas, descontos ganhos, previsão de economia mensal.',
        tags: ['acompanhar', 'dashboard', 'métricas', 'economia']
      },
      {
        question: 'Quando recebo o desconto?',
        answer: 'Desconto é aplicado automaticamente no mês seguinte à primeira cobrança do corretor indicado. Aparece como "Desconto Indicação" na sua fatura.',
        tags: ['quando', 'aplicação', 'fatura', 'automático']
      }
    ]
  },
  {
    id: 'ferramentas',
    title: 'Ferramentas IA',
    icon: Wrench,
    color: 'bg-cyan-500',
    faqs: [
      {
        question: 'Como usar o Photo Enhancer?',
        answer: 'Selecione fotos dos imóveis > "Melhorar com IA". A ferramenta ajusta automaticamente: iluminação, contraste, cores, nitidez. Processa até 50 fotos simultâneas.',
        tags: ['photo', 'enhancer', 'melhorar', 'automático']
      },
      {
        question: 'Como gerar descrições automáticas?',
        answer: 'No imóvel > "Descrição IA" > nossa IA cria textos atrativos baseados nas características. Personalizable por estilo: profissional, casual, luxo, econômico.',
        tags: ['descrição', 'ia', 'automática', 'personalizar']
      },
      {
        question: 'Como funciona o Virtual Staging?',
        answer: 'Upload foto do ambiente vazio > escolha estilo decoração > IA adiciona móveis virtuais realistas. Ideal para imóveis vazios ou com móveis antigos.',
        tags: ['staging', 'virtual', 'móveis', 'decoração']
      },
      {
        question: 'Como usar o detector de móveis?',
        answer: 'Upload foto do ambiente mobiliado > IA identifica e lista todos móveis/objetos. Útil para inventários de imóveis mobiliados ou avaliações.',
        tags: ['detector', 'móveis', 'inventário', 'identificar']
      },
      {
        question: 'Como funciona a calculadora de financiamento?',
        answer: 'Ferramentas > "Calculadora" > insira valor do imóvel, entrada, prazo. Calcula: prestação FGTS, SAC, Price, simulação com diferentes bancos e taxas.',
        tags: ['calculadora', 'financiamento', 'prestação', 'simulação']
      },
      {
        question: 'Como gerar watermarks personalizadas?',
        answer: 'Ferramentas > "Watermark" > upload sua logo/marca > configura posição, transparência, tamanho. Aplica automaticamente em todas fotos dos imóveis.',
        tags: ['watermark', 'marca', 'logo', 'personalizada']
      }
    ]
  },
  {
    id: 'minisite',
    title: 'Minisite',
    icon: Globe,
    color: 'bg-violet-500',
    faqs: [
      {
        question: 'Como configurar meu minisite pessoal?',
        answer: 'Menu "Minisite" > complete perfil (foto, nome, CRECI, bio) > escolha template > configure cores/layout > ative seções desejadas. URL: seudominio.com/corretor',
        tags: ['minisite', 'pessoal', 'configurar', 'template']
      },
      {
        question: 'Como personalizar cores e layout?',
        answer: 'Minisite > "Personalização" > escolha cores primária/secundária, fonte, estilo botões. Preview em tempo real. Mantenha identidade visual da sua marca.',
        tags: ['personalizar', 'cores', 'layout', 'marca']
      },
      {
        question: 'Como conectar domínio próprio?',
        answer: 'Planos Premium+ permitem domínio próprio. Configurações > "Domínio" > adicione seu domínio > configure DNS conforme instruções. Ex: www.seunome.com.br',
        tags: ['domínio', 'próprio', 'dns', 'premium']
      },
      {
        question: 'Quais imóveis aparecem no minisite?',
        answer: 'Apenas imóveis com visibilidade "Site Público" e qualidade 3+ estrelas. Use filtros para mostrar só determinados tipos ou bairros no seu minisite.',
        tags: ['imóveis', 'público', 'filtros', 'qualidade']
      },
      {
        question: 'Como acompanhar visitas do minisite?',
        answer: 'Analytics do minisite mostra: visitantes únicos, páginas mais vistas, imóveis com mais interesse, origem do tráfego, conversão em contatos.',
        tags: ['analytics', 'visitas', 'tráfego', 'conversão']
      },
      {
        question: 'Como otimizar para Google (SEO)?',
        answer: 'Complete todos dados do perfil, use palavras-chave na bio, adicione descrições detalhadas nos imóveis. Sistema gera automaticamente meta tags e sitemap.',
        tags: ['seo', 'google', 'palavras-chave', 'otimizar']
      }
    ]
  },
  {
    id: 'social',
    title: 'Social Conecta',
    icon: Smartphone,
    color: 'bg-rose-500',
    faqs: [
      {
        question: 'Como funciona o Social Conecta?',
        answer: 'Integração com Instagram, Facebook, LinkedIn. Publique imóveis automaticamente, agende posts, use templates profissionais, monitore engajamento.',
        tags: ['social', 'integração', 'automático', 'posts']
      },
      {
        question: 'Como conectar minhas redes sociais?',
        answer: 'Configurações > "Redes Sociais" > conecte Instagram/Facebook Business > autorize permissões. LinkedIn conecta via API própria do LinkedIn.',
        tags: ['conectar', 'autorizar', 'business', 'api']
      },
      {
        question: 'Como agendar posts automáticos?',
        answer: 'Social Conecta > "Agendamento" > defina frequência (diária, semanal), horários otimizados, tipos de conteúdo. IA seleciona melhores imóveis automaticamente.',
        tags: ['agendar', 'automático', 'frequência', 'horários']
      },
      {
        question: 'Posso personalizar os templates de post?',
        answer: 'Sim! Edite templates em "Social" > "Templates". Personalize texto, hashtags, call-to-action, layout. Crie diferentes estilos por tipo de imóvel.',
        tags: ['templates', 'personalizar', 'hashtags', 'estilos']
      },
      {
        question: 'Como acompanhar performance dos posts?',
        answer: 'Dashboard Social mostra: alcance, curtidas, comentários, compartilhamentos, cliques no link, leads gerados por post. Analytics completas por rede.',
        tags: ['performance', 'analytics', 'alcance', 'leads']
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: BarChart3,
    color: 'bg-blue-600',
    faqs: [
      {
        question: 'Como interpretar as métricas do dashboard?',
        answer: 'Dashboard mostra KPIs principais: imóveis cadastrados, leads gerados, deals em andamento, taxa conversão, receita projetada. Gráficos com períodos comparativos.',
        tags: ['métricas', 'kpis', 'gráficos', 'comparativo']
      },
      {
        question: 'Como personalizar widgets do dashboard?',
        answer: 'Clique "Personalizar Dashboard" > arraste widgets, redimensione, escolha métricas relevantes. Salve layouts diferentes para equipes ou focos específicos.',
        tags: ['personalizar', 'widgets', 'layouts', 'redimensionar']
      },
      {
        question: 'Como gerar relatórios automatizados?',
        answer: 'Relatórios > "Criar Automação" > defina periodicidade (semanal, mensal), destinatários, métricas incluídas. Relatórios são enviados por email automaticamente.',
        tags: ['relatórios', 'automação', 'email', 'periodicidade']
      },
      {
        question: 'Como comparar performance com outros períodos?',
        answer: 'Use seletores de data no dashboard. Compare mês atual vs anterior, ano sobre ano, períodos customizados. Gráficos mostram tendências e variações.',
        tags: ['comparar', 'períodos', 'tendências', 'variações']
      },
      {
        question: 'Como exportar dados para Excel?',
        answer: 'Qualquer gráfico/tabela tem botão "Exportar". Disponível em: Excel, CSV, PDF. Dados incluem filtros aplicados e períodos selecionados.',
        tags: ['exportar', 'excel', 'csv', 'pdf']
      }
    ]
  },
  {
    id: 'voz',
    title: 'Funcionalidades por Voz',
    icon: Mic,
    color: 'bg-red-500',
    faqs: [
      {
        question: 'Como cadastrar clientes por comando de voz?',
        answer: 'CRM > microfone > fale dados do cliente: "Cliente Maria Silva, telefone 11987654321, busca apartamento 2 quartos Jardins até 800 mil". IA processa e cria cadastro completo.',
        tags: ['voz', 'cadastro', 'cliente', 'automático']
      },
      {
        question: 'Como agendar compromissos falando?',
        answer: 'Agenda > microfone > "Agendar visita apartamento Rua Oscar Freire com João amanhã 15h". Sistema confirma detalhes e cria evento no calendário.',
        tags: ['agenda', 'voz', 'compromisso', 'calendário']
      },
      {
        question: 'Como gravar observações sobre visitas?',
        answer: 'Durante/após visita, use gravador > "Cliente gostou da localização mas achou pequeno, quer ver opções maiores no mesmo bairro". Salva no histórico do cliente.',
        tags: ['gravar', 'observações', 'visita', 'histórico']
      },
      {
        question: 'Como criar lembretes por voz?',
        answer: 'Qualquer tela > microfone > "Lembrar de ligar para cliente José sexta-feira 9h para agendar segunda visita". Cria lembrete com notificação.',
        tags: ['lembretes', 'voz', 'notificação', 'agendar']
      },
      {
        question: 'A IA entende diferentes sotaques?',
        answer: 'Sim! Nossa IA é treinada para sotaques brasileiros: paulista, carioca, nordestino, gaúcho, etc. Precisão melhora com uso. Funciona mesmo com ruído ambiente.',
        tags: ['sotaques', 'brasileiros', 'precisão', 'ruído']
      }
    ]
  },
  {
    id: 'pagamentos',
    title: 'Pagamentos e Planos',
    icon: CreditCard,
    color: 'bg-green-600',
    faqs: [
      {
        question: 'Quais planos estão disponíveis?',
        answer: 'Temos 3 planos em promoção (50% OFF nos 3 primeiros meses): Básico (R$ 49 → R$ 98): Até 20 imóveis, CRM completo, matches ilimitados, chat em tempo real, ferramentas básicas e minisite personalizado. Profissional (R$ 79 → R$ 148): Até 50 imóveis, tudo do Básico, ferramentas avançadas e 2 imóveis publicados no OLX. Premium (R$ 99 → R$ 198): Até 100 imóveis, tudo do Profissional e 5 imóveis no OLX com destaque no topo.',
        tags: ['planos', 'preços', 'funcionalidades', 'upgrade']
      },
      {
        question: 'Como fazer upgrade do plano?',
        answer: 'Perfil > "Planos" > escolha novo plano > pagamento proporcional. Upgrade é imediato, funcionalidades ativadas automaticamente. Downgrade só no próximo ciclo.',
        tags: ['upgrade', 'imediato', 'proporcional', 'ativação']
      },
      {
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Sem fidelidade. Cancele em Perfil > "Assinatura" > "Cancelar". Acesso continua até fim do período pago. Dados preservados por 90 dias.',
        tags: ['cancelar', 'fidelidade', 'dados', 'preservados']
      },
      {
        question: 'Como funciona o período de teste?',
        answer: '14 dias grátis no plano Pro com todas funcionalidades. Não precisa cartão. Após teste, escolha plano ou continue gratuito com limitações.',
        tags: ['teste', 'gratuito', 'cartão', 'limitações']
      },
      {
        question: 'Quais formas de pagamento aceitas?',
        answer: 'Cartão (Visa/Master/Elo/Amex), PIX, boleto bancário. Pagamento recorrente automático. Desconto 10% para anual à vista via PIX.',
        tags: ['pagamento', 'cartão', 'pix', 'desconto']
      }
    ]
  },
  {
    id: 'perfil',
    title: 'Perfil e Configurações',
    icon: User,
    color: 'bg-gray-600',
    faqs: [
      {
        question: 'Como completar meu perfil profissional?',
        answer: 'Perfil > preencha: foto profissional, nome completo, CRECI, biografia (150+ caracteres), especialidades, regiões de atuação, contatos (telefone, WhatsApp, email, redes sociais).',
        tags: ['perfil', 'profissional', 'creci', 'biografia']
      },
      {
        question: 'Como configurar notificações?',
        answer: 'Configurações > "Notificações" > escolha canais (email, push, WhatsApp) para: novos leads, mensagens, matches, lembretes, relatórios. Defina horários permitidos.',
        tags: ['notificações', 'canais', 'horários', 'personalizar']
      },
      {
        question: 'Como alterar senha e segurança?',
        answer: 'Perfil > "Segurança" > alterar senha (mín. 8 caracteres), ativar autenticação 2FA, gerenciar sessões ativas, histórico de login, backup de dados.',
        tags: ['senha', 'segurança', '2fa', 'backup']
      },
      {
        question: 'Como personalizar interface?',
        answer: 'Configurações > "Interface" > escolha tema (claro/escuro), idioma, formato data/hora, fuso horário, densidade informações (compacto/espaçado).',
        tags: ['interface', 'tema', 'idioma', 'personalizar']
      },
      {
        question: 'Como fazer backup dos meus dados?',
        answer: 'Configurações > "Backup" > exportar dados completos (imóveis, clientes, mensagens) em formato JSON/Excel. Agendamento automático semanal/mensal disponível.',
        tags: ['backup', 'exportar', 'automático', 'dados']
      }
    ]
  }
];

const quickTips = [
  {
    title: 'Resposta Rápida = Mais Vendas',
    description: 'Clientes atendidos em até 5 minutos têm 80% mais chance de fechar negócio',
    icon: Zap
  },
  {
    title: 'Fotos Profissionais Vendem Mais',
    description: 'Imóveis com 8+ fotos de qualidade recebem 5x mais visualizações',
    icon: Camera
  },
  {
    title: 'Use a IA para Descrições',
    description: 'Descrições geradas por IA convertem 3x mais que textos básicos',
    icon: Bot
  },
  {
    title: 'Complete seu Perfil',
    description: 'Perfis 100% completos geram 10x mais confiança dos clientes',
    icon: User
  },
  {
    title: 'Gamificação Motiva Resultados',
    description: 'Corretores engajados na gamificação vendem 40% mais por mês',
    icon: Trophy
  },
  {
    title: 'Follow-up Automático Funciona',
    description: '70% das vendas acontecem após o 4º contato - automatize!',
    icon: Target
  },
  {
    title: 'Minisite Profissional',
    description: 'Corretores com minisite próprio são percebidos como 60% mais profissionais',
    icon: Globe
  },
  {
    title: 'Use Comando de Voz',
    description: 'Cadastre clientes 10x mais rápido usando comandos de voz',
    icon: Mic
  }
];

const tutorialSections = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    icon: CheckSquare,
    items: [
      '✅ Complete seu perfil profissional (foto, CRECI, biografia)',
      '✅ Configure suas preferências de notificação',
      '✅ Cadastre seus primeiros 5 imóveis com fotos de qualidade',
      '✅ Importe seus contatos existentes para o CRM',
      '✅ Configure seu minisite pessoal',
      '✅ Teste as funcionalidades de IA (descrições, matches)'
    ]
  },
  {
    id: 'otimizacao',
    title: 'Otimização Avançada',
    icon: TrendingUp,
    items: [
      '🚀 Use Virtual Staging em imóveis vazios',
      '🚀 Configure automações de follow-up',
      '🚀 Integre redes sociais para marketing automático',
      '🚀 Use comandos de voz para agilizar cadastros',
      '🚀 Configure relatórios automáticos semanais',
      '🚀 Otimize SEO do seu minisite para Google'
    ]
  }
];

export function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (faq.tags && faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary rounded-full">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Central de Ajuda Conecta</CardTitle>
            <CardDescription className="text-lg">
              Sua fonte completa de conhecimento sobre todas as funcionalidades da plataforma
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="🔍 Pesquise por palavras-chave: 'cadastrar imóvel', 'match IA', 'comissões'..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="faqs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Perguntas Frequentes
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Dicas e Tutoriais
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Suporte
            </TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            {!searchTerm && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categorias Principais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {helpCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant="outline"
                          className="h-auto p-3 flex-col gap-2 hover:shadow-md transition-shadow"
                          onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                        >
                          <div className={`p-2 rounded-lg ${category.color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs text-center leading-tight">{category.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {category.faqs.length}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {(searchTerm ? filteredCategories : helpCategories).map((category) => (
                <Collapsible
                  key={category.id}
                  open={!searchTerm ? openCategory === category.id : true}
                  onOpenChange={(isOpen) => setOpenCategory(isOpen ? category.id : null)}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${category.color} text-white`}>
                              <category.icon className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                              <CardTitle className="text-xl">{category.title}</CardTitle>
                              <CardDescription>
                                {category.faqs.length} pergunta{category.faqs.length !== 1 ? 's' : ''} disponíve{category.faqs.length !== 1 ? 'is' : 'l'}
                              </CardDescription>
                            </div>
                          </div>
                          <ChevronDown className={`h-5 w-5 transition-transform ${openCategory === category.id || searchTerm ? 'rotate-180' : ''}`} />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {category.faqs.map((faq, index) => (
                            <div key={index} className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border-l-4 border-primary/30">
                              <h5 className="font-semibold text-base mb-3 flex items-start gap-2">
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                                </div>
                                {faq.question}
                              </h5>
                              <p className="text-sm text-muted-foreground leading-relaxed ml-8">
                                {faq.answer}
                              </p>
                              {faq.tags && (
                                <div className="flex flex-wrap gap-1 mt-3 ml-8">
                                  {faq.tags.map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-6">
            {/* Quick Tips */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Dicas Para Aumentar suas Vendas
                </CardTitle>
                <CardDescription>
                  Estratégias comprovadas pelos corretores de maior sucesso na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickTips.map((tip, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <tip.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">{tip.title}</h4>
                          <p className="text-sm text-muted-foreground">{tip.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tutorial Sections */}
            {tutorialSections.map((section) => (
              <Card key={section.id} className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Video Tutorials */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Tutoriais em Vídeo
                </CardTitle>
                <CardDescription>
                  Aprenda assistindo nossos tutoriais práticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Cadastro Completo de Imóvel', duration: '5 min', views: '2.3k' },
                    { title: 'Como Usar Match IA', duration: '8 min', views: '4.1k' },
                    { title: 'Configurando Minisite', duration: '12 min', views: '1.8k' },
                    { title: 'CRM e Pipeline de Vendas', duration: '15 min', views: '3.2k' },
                    { title: 'Gamificação e Pontos', duration: '6 min', views: '1.5k' },
                    { title: 'Ferramentas de IA', duration: '10 min', views: '2.7k' }
                  ].map((video, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-3 flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-primary/60" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{video.title}</h4>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{video.duration}</span>
                        <span>{video.views} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp Support */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <MessageCircle className="h-6 w-6" />
                    Suporte WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Atendimento humano especializado em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>📞 <strong>Horário:</strong> Seg-Sex 8h às 18h</p>
                    <p>⚡ <strong>Resposta:</strong> Até 5 minutos</p>
                    <p>🎯 <strong>Ideal para:</strong> Dúvidas técnicas, bugs, treinamento</p>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Preciso de ajuda com a plataforma Conecta', '_blank')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Conversar no WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Email Support */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Mail className="h-6 w-6" />
                    Suporte Técnico
                  </CardTitle>
                  <CardDescription>
                    Para questões técnicas complexas e sugestões
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>📧 <strong>Email:</strong> suporte@conecta.com</p>
                    <p>⏰ <strong>Resposta:</strong> Até 4 horas úteis</p>
                    <p>🛠️ <strong>Ideal para:</strong> Bugs complexos, integrações, melhorias</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => window.open('mailto:suporte@conecta.com?subject=Suporte Técnico - Plataforma Conecta', '_blank')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                </CardContent>
              </Card>

              {/* Agendamento */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Calendar className="h-6 w-6" />
                    Treinamento 1:1
                  </CardTitle>
                  <CardDescription>
                    Sessão personalizada com especialista em vendas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>🎯 <strong>Duração:</strong> 30-60 minutos</p>
                    <p>👨‍🏫 <strong>Formato:</strong> Video chamada</p>
                    <p>🚀 <strong>Foco:</strong> Otimização de vendas, dúvidas específicas</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Treinamento
                  </Button>
                </CardContent>
              </Card>

              {/* Knowledge Base */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <BookOpen className="h-6 w-6" />
                    Base de Conhecimento
                  </CardTitle>
                  <CardDescription>
                    Documentação completa e atualizações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>📚 <strong>Conteúdo:</strong> Guias detalhados, APIs, integrações</p>
                    <p>🔄 <strong>Atualizações:</strong> Semanais</p>
                    <p>🎯 <strong>Ideal para:</strong> Desenvolvedores, power users</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar Documentação
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Status do Sistema */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-green-200 border">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium text-sm">Plataforma</p>
                      <p className="text-xs text-green-600">Operacional</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-green-200 border">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium text-sm">IA Services</p>
                      <p className="text-xs text-green-600">Operacional</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-green-200 border">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium text-sm">Integrações</p>
                      <p className="text-xs text-green-600">Operacional</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-muted/30 to-muted/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              💡 <strong>Dica:</strong> Use Ctrl+K em qualquer página para busca rápida na plataforma
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>Última atualização: Hoje</span>
              <span>•</span>
              <span>15 categorias</span>
              <span>•</span>
              <span>150+ perguntas</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}