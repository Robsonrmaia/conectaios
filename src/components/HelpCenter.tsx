import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Building2, 
  Users, 
  MessageSquare, 
  Wrench,
  Lightbulb,
  BookOpen
} from 'lucide-react';

const helpCategories = [
  {
    id: 'imoveis',
    title: 'Gestão de Imóveis',
    icon: Building2,
    color: 'bg-blue-500',
    faqs: [
      {
        question: 'Como adicionar um novo imóvel?',
        answer: 'Vá em "Meus Imóveis" > "Adicionar Imóvel" > Preencha os dados básicos > Adicione fotos > Publique'
      },
      {
        question: 'Como melhorar as fotos dos meus imóveis?',
        answer: 'Use a ferramenta "Photo Enhancer" em Ferramentas para melhorar automaticamente suas fotos com IA'
      },
      {
        question: 'Posso gerar descrições automáticas?',
        answer: 'Sim! Use a ferramenta "Descrição com IA" para gerar descrições atrativas automaticamente'
      }
    ]
  },
  {
    id: 'crm',
    title: 'Gestão de Clientes (CRM)',
    icon: Users,
    color: 'bg-green-500',
    faqs: [
      {
        question: 'Como organizar meu pipeline de vendas?',
        answer: 'Use o CRM para criar etapas personalizadas: Novo Lead > Qualificado > Proposta > Negociação > Fechado'
      },
      {
        question: 'Como fazer match de clientes com imóveis?',
        answer: 'Vá em "Match" e nossa IA encontrará os melhores imóveis para cada cliente baseado no perfil dele'
      },
      {
        question: 'Como registrar histórico de interações?',
        answer: 'No perfil do cliente, use a seção "Histórico" para registrar todas as interações e notas'
      }
    ]
  },
  {
    id: 'marketplace',
    title: 'Marketplace e Parcerias',
    icon: MessageSquare,
    color: 'bg-purple-500',
    faqs: [
      {
        question: 'Como funciona o Marketplace?',
        answer: 'Veja imóveis de outros corretores cadastrados e proponha parcerias para fechar negócios'
      },
      {
        question: 'Como fazer uma parceria?',
        answer: 'Clique em um imóvel do Marketplace > "Propor Parceria" > Defina comissão > Aguarde aprovação'
      }
    ]
  },
  {
    id: 'ferramentas',
    title: 'Ferramentas de IA',
    icon: Wrench,
    color: 'bg-orange-500',
    faqs: [
      {
        question: 'Quais ferramentas de IA estão disponíveis?',
        answer: 'Photo Enhancer, Gerador de Descrições, Virtual Staging, Detector de Móveis e Calculadoras'
      },
      {
        question: 'Como usar o Virtual Staging?',
        answer: 'Upload uma foto do ambiente vazio e nossa IA adiciona móveis virtuais para melhorar a apresentação'
      }
    ]
  }
];

const quickTips = [
  {
    title: 'Use fotos de alta qualidade',
    description: 'Imóveis com fotos melhores vendem 32% mais rápido',
    icon: '📸'
  },
  {
    title: 'Mantenha seu CRM atualizado',
    description: 'Clientes bem organizados geram mais oportunidades',
    icon: '📊'
  },
  {
    title: 'Explore o Marketplace',
    description: 'Parcerias podem dobrar suas oportunidades de venda',
    icon: '🤝'
  },
  {
    title: 'Use a IA a seu favor',
    description: 'Ferramentas automatizadas economizam até 3h por dia',
    icon: '🤖'
  }
];

export function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Central de Ajuda
          </CardTitle>
          <CardDescription>
            Encontre respostas rápidas para as principais dúvidas sobre a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ajuda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Tips */}
          {!searchTerm && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Dicas Rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickTips.map((tip, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{tip.icon}</span>
                      <div>
                        <h4 className="font-medium text-sm">{tip.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Perguntas Frequentes
            </h3>
            
            {filteredCategories.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum resultado encontrado para "{searchTerm}"</p>
              </div>
            )}

            {filteredCategories.map((category) => (
              <Collapsible
                key={category.id}
                open={openCategory === category.id}
                onOpenChange={(isOpen) => setOpenCategory(isOpen ? category.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color} text-white`}>
                        <category.icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">{category.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {category.faqs.length} pergunta{category.faqs.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openCategory === category.id ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-2 mt-2">
                  {category.faqs.map((faq, index) => (
                    <div key={index} className="ml-4 p-4 bg-muted/50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">{faq.question}</h5>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {/* Contact Support */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium mb-2">Precisa de mais ajuda?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Entre em contato conosco pelo WhatsApp ou email
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                WhatsApp
              </Button>
              <Button size="sm" variant="outline">
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}