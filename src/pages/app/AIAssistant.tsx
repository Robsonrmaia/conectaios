import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAI } from '@/hooks/useAI';
import { 
  Bot, 
  Send, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  FileText, 
  Calculator,
  Lightbulb,
  Star,
  Loader2
} from 'lucide-react';

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Olá! Sou o assistente IA do ConectaIOS. Como posso ajudá-lo hoje? Posso analisar seus dados em tempo real, responder sobre propriedades, clientes, negócios e muito mais!',
      timestamp: '14:30'
    }
  ]);
  
  const { sendMessage: sendAIMessage, loading } = useAI();

  const quickActions = [
    {
      id: 1,
      title: 'Análise de Mercado',
      description: 'Gere relatórios sobre tendências do mercado imobiliário',
      icon: TrendingUp,
      action: `Analise o mercado imobiliário de Ilhéus/BA com foco em:
      1. Tendências de preços para venda e locação nos principais bairros
      2. Demanda por tipo de imóvel (apartamentos, casas, comerciais)
      3. Sazonalidade do mercado (alta/baixa temporada)
      4. Comparativo com cidades vizinhas
      5. Oportunidades de investimento
      6. Perfil do comprador/locatário atual
      7. Impacto do turismo no mercado local
      
      Forneça insights práticos e acionáveis para corretor da região.`
    },
    {
      id: 2,
      title: 'Sugestões de Preço',
      description: 'Obtenha sugestões de precificação para seus imóveis',
      icon: Calculator,
      action: `Com base nos meus imóveis cadastrados e no mercado de Ilhéus/BA, me ajude com:
      1. Análise de precificação dos imóveis que tenho
      2. Comparativo com imóveis similares na região
      3. Sugestões de ajuste de preço para acelerar vendas
      4. Estratégias de negociação por faixa de preço
      5. Timing ideal para lançar cada imóvel
      6. Margem de negociação recomendada
      
      Considere área, localização, tipo e condições do imóvel.`
    },
    {
      id: 3,
      title: 'Scripts de Vendas',
      description: 'Crie scripts personalizados para diferentes situações',
      icon: FileText,
      action: `Crie scripts de vendas personalizados para corretor em Ilhéus/BA:
      1. Abordagem inicial por WhatsApp/telefone
      2. Apresentação de imóveis por tipo (apartamento, casa, comercial)
      3. Tratamento de objeções comuns (preço, localização, financiamento)
      4. Scripts para diferentes perfis de cliente (investidor, primeira casa, aposentado)
      5. Follow-up pós-visita
      6. Fechamento de negócios
      7. Scripts para captação de imóveis
      
      Considere linguagem regional e características locais.`
    },
    {
      id: 4,
      title: 'Estratégias de Marketing',
      description: 'Desenvolva estratégias para atrair mais clientes',
      icon: Lightbulb,
      action: `Desenvolva estratégias de marketing imobiliário para Ilhéus/BA:
      1. Marketing digital: Instagram, Facebook, Google Ads
      2. Conteúdo para redes sociais (posts, stories, reels)
      3. Parcerias locais (construtoras, arquitetos, decoradores)
      4. Marketing de relacionamento com clientes
      5. Eventos e open house
      6. SEO local para aparecer em buscas
      7. Campanhas sazonais (verão/turismo)
      8. Diferenciação da concorrência
      
      Considere orçamento acessível e alta conversão.`
    }
  ];

  const recentInsights = [
    {
      id: 1,
      title: 'Oportunidade de Mercado',
      content: 'Apartamentos de 2 quartos no Jardins estão com alta demanda (+15% este mês)',
      type: 'opportunity',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Ajuste de Preço',
      content: 'Considere reduzir em 5% o preço do imóvel na Vila Madalena para acelerar a venda',
      type: 'pricing',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Lead Qualificado',
      content: 'Maria Silva demonstrou alto interesse. Recomendo contato em até 2 horas',
      type: 'lead',
      priority: 'high'
    }
  ];

  const handleSendMessage = async () => {
    if (message.trim() && !loading) {
      const newMessage = {
        id: chatHistory.length + 1,
        type: 'user' as const,
        content: message,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory(prev => [...prev, newMessage]);
      const currentMessage = message;
      setMessage('');
      
      // Get AI response using real API
      try {
        const aiResponse = await sendAIMessage(currentMessage);
        
        const aiResponseObj = {
          id: chatHistory.length + 2,
          type: 'assistant' as const,
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatHistory(prev => [...prev, aiResponseObj]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorResponse = {
          id: chatHistory.length + 2,
          type: 'assistant' as const,
          content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, errorResponse]);
      }
    }
  };

  const handleQuickAction = (action: string) => {
    setMessage(action);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      case 'low': return 'border-l-success bg-success/5';
      default: return 'border-l-muted';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar */}
      <div className="w-80 space-y-4">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Insights Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border-l-2 ${getPriorityColor(insight.priority)}`}
              >
                <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                <p className="text-xs text-muted-foreground">{insight.content}</p>
                <Badge
                  variant="secondary"
                  className={`mt-2 text-xs ${
                    insight.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                    insight.priority === 'medium' ? 'bg-warning/20 text-warning' :
                    'bg-success/20 text-success'
                  }`}
                >
                  {insight.priority === 'high' ? 'Alta Prioridade' :
                   insight.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Chat */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-brand-secondary rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Assistente IA ConectaIOS</CardTitle>
              <CardDescription>Seu consultor inteligente para vendas imobiliárias</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />

        {/* Chat Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-primary text-white'
                  }`}>
                    {msg.type === 'user' ? (
                      <span className="text-sm font-semibold">Eu</span>
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-xs mt-1 ${
                      msg.type === 'user' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua pergunta..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
              className="flex-1"
              disabled={loading}
            />
            <Button 
              onClick={handleSendMessage} 
              className="bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              disabled={loading || !message.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            💡 Dica: Pergunte sobre seus imóveis, clientes, tarefas ou peça análises de mercado
          </div>
        </div>
      </Card>
    </div>
  );
}