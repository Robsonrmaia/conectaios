import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  ChevronDown, 
  Building2, 
  Users, 
  ShoppingCart,
  Bot,
  Trophy,
  Globe,
  Wrench,
  CreditCard,
  Zap,
  Camera,
  TrendingUp,
  Target,
  MessageCircle,
  Share2,
  Smartphone,
  Mail,
  Calendar,
  HelpCircle,
  Lightbulb,
  BookOpen
} from 'lucide-react';

const helpCategories = [
  {
    id: 'imoveis',
    title: '🏠 Gestão de Imóveis',
    icon: Building2,
    color: 'bg-blue-500',
    faqs: [
      {
        question: 'Como cadastrar um novo imóvel?',
        answer: 'Acesse a seção "Imóveis" e clique em "Novo Imóvel". Preencha todas as informações obrigatórias como endereço, tipo, valor e descrição. Use a IA para gerar descrições automáticas e melhorar suas fotos.'
      },
      {
        question: 'Como editar informações de um imóvel?',
        answer: 'Na lista de imóveis, clique no ícone de edição ao lado do imóvel desejado. Você pode alterar qualquer informação e salvar as mudanças. O sistema mantém um histórico de todas as alterações.'
      },
      {
        question: 'Como adicionar fotos aos imóveis?',
        answer: 'Durante o cadastro ou edição do imóvel, clique em "Adicionar Fotos" e selecione as imagens do seu dispositivo. As fotos são otimizadas automaticamente e você pode usar ferramentas de IA para melhorar a qualidade.'
      }
    ]
  },
  {
    id: 'crm',
    title: '👥 CRM e Clientes',
    icon: Users,
    color: 'bg-green-500',
    faqs: [
      {
        question: 'Como gerenciar leads eficientemente?',
        answer: 'Use a seção CRM para visualizar todos os seus leads. Classifique por interesse (Frio, Morno, Quente), adicione notas detalhadas e configure lembretes automáticos para follow-up.'
      }
    ]
  }
];

const quickTips = [
  {
    title: '🔥 Use atalhos do teclado',
    description: 'Ctrl+N para novo imóvel, Ctrl+B para busca rápida, Ctrl+D para dashboard',
    icon: Zap
  },
  {
    title: '📸 Otimize suas fotos com IA',
    description: 'Use o Photo Enhancer para melhorar automaticamente a qualidade das imagens',
    icon: Camera
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ajuda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

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
                      <tip.icon className="h-5 w-5 mt-1" />
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Perguntas Frequentes
            </h3>
            
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

          <div className="space-y-6 mt-8">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                📞 Contato & Suporte Especializado
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Button className="justify-start" onClick={() => window.open('https://wa.me/5511999999999?text=Preciso%20de%20ajuda%20com%20o%20sistema', '_blank')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp Suporte
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => window.open('mailto:suporte@conecta.com', '_blank')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Técnico
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}