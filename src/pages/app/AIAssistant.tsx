import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Send, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  FileText, 
  Calculator,
  Lightbulb,
  Star
} from 'lucide-react';

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Olá! Sou o assistente IA do ConectaIOS. Como posso ajudá-lo hoje?',
      timestamp: '14:30'
    },
    {
      id: 2,
      type: 'user',
      content: 'Como posso melhorar minhas vendas?',
      timestamp: '14:32'
    },
    {
      id: 3,
      type: 'assistant',
      content: 'Baseado na análise do seu perfil e histórico de vendas, recomendo focar em:\n\n1. **Qualificação de leads**: Use nosso sistema de scoring para priorizar clientes com maior potencial\n2. **Follow-up consistente**: Configure lembretes automáticos no CRM\n3. **Apresentações visuais**: Crie tours virtuais para seus imóveis\n\nGostaria que eu elabore algum desses pontos?',
      timestamp: '14:33'
    }
  ]);

  const quickActions = [
    {
      id: 1,
      title: 'Análise de Mercado',
      description: 'Gere relatórios sobre tendências do mercado imobiliário',
      icon: TrendingUp,
      action: 'Analisar mercado'
    },
    {
      id: 2,
      title: 'Sugestões de Preço',
      description: 'Obtenha sugestões de precificação para seus imóveis',
      icon: Calculator,
      action: 'Sugerir preços'
    },
    {
      id: 3,
      title: 'Scripts de Vendas',
      description: 'Crie scripts personalizados para diferentes situações',
      icon: FileText,
      action: 'Criar scripts'
    },
    {
      id: 4,
      title: 'Estratégias de Marketing',
      description: 'Desenvolva estratégias para atrair mais clientes',
      icon: Lightbulb,
      action: 'Estratégias de marketing'
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

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: chatHistory.length + 1,
        type: 'user' as const,
        content: message,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory([...chatHistory, newMessage]);
      setMessage('');
      
      // Simulate AI response with more intelligent content
      setTimeout(() => {
        let aiResponse = '';
        const query = message.toLowerCase();
        
        if (query.includes('mercado') || query.includes('tendência')) {
          aiResponse = 'Com base na análise de mercado atual, observo que:\n\n📈 **Apartamentos 2-3 quartos** estão em alta demanda (+12% este mês)\n💰 **Faixa de R$ 400-800k** representa 60% das transações\n🏢 **Zona Sul** lidera em valorização (+8%)\n📊 **Tempo médio de venda**: 45 dias\n\n**Recomendações:**\n- Foque em imóveis bem localizados nessa faixa\n- Invista em fotos profissionais e virtual staging\n- Precifique competitivamente nos primeiros 30 dias';
        } else if (query.includes('preço') || query.includes('valor')) {
          aiResponse = 'Para precificação estratégica, considere:\n\n🎯 **Análise comparativa**: Verifique 5-8 similares vendidos nos últimos 60 dias\n📍 **Localização**: Ajuste ±15% baseado no micro-local\n🏠 **Estado do imóvel**: Reformado (+10%), original (-5%)\n⏰ **Urgência**: Venda rápida (-8%), sem pressa (+5%)\n\n**Dica IA**: Comece 5% acima do valor ideal e ajuste após 15 dias se necessário.';
        } else if (query.includes('cliente') || query.includes('lead')) {
          aiResponse = 'Para otimizar sua gestão de clientes:\n\n🎯 **Qualificação**: Use o score automático do CRM\n📞 **Follow-up**: Contate leads em até 2 horas\n💡 **Match IA**: Nossa IA já identificou 3 clientes potenciais para seus imóveis\n📊 **Conversão**: Taxa atual de 23% - meta é 30%\n\n**Próximas ações sugeridas:**\n1. Ligar para Maria Silva (lead quente)\n2. Enviar portfólio para Carlos Santos\n3. Agendar visita com Ana Costa';
        } else {
          aiResponse = 'Entendi sua pergunta. Com base na análise dos seus dados:\n\n📊 **Status atual**: 12 imóveis ativos, 8 leads qualificados\n🎯 **Oportunidade**: 2 matches de alta compatibilidade detectados\n⚡ **Ação recomendada**: Priorize follow-up com leads "interessados"\n\n**Como posso ajudar especificamente?**\n• Análise de mercado detalhada\n• Sugestões de precificação\n• Estratégias de marketing\n• Otimização de conversão';
        }
        
        const aiResponseObj = {
          id: chatHistory.length + 2,
          type: 'assistant' as const,
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, aiResponseObj]);
      }, 1500);
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            💡 Dica: Seja específico em suas perguntas para obter respostas mais precisas
          </div>
        </div>
      </Card>
    </div>
  );
}