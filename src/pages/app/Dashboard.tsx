import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Section, PageWrapper } from '@/components/layout/Section';
import { ResponsiveButtonGroup } from '@/components/layout/ResponsiveRow';
import { Button } from '@/components/ui/button';
import { Building2, Users, MessageSquare, TrendingUp, Eye, Heart, Target, Globe, ExternalLink, Home } from 'lucide-react';
import { useBroker } from '@/hooks/useBroker';
import { useChatExternal } from '@/hooks/useChatExternal';
import { ChatExternalModal } from '@/components/ChatExternalModal';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketStatsWidget } from '@/components/MarketStatsWidget';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { generateMinisiteUrl } from '@/lib/urls';

const Dashboard = () => {
  const { broker } = useBroker();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openChatModal, closeChatModal, modalOpen, chatUrl } = useChatExternal();
  const [stats, setStats] = useState({
    properties: 0,
    clients: 0,
    messages: 0,
    deals: 0
  });
  
  const [insights, setInsights] = useState([
    { type: 'info', title: '📈 Apartamentos lideram portfólio', description: '50% dos imóveis são apartamentos - demanda aquecida no mercado' },
    { type: 'success', title: '💰 Potencial premium em coberturas', description: 'Coberturas têm valor médio 10x superior - mercado de luxo ativo' },
    { type: 'primary', title: '🎯 Foco em conversão', description: '14 clientes ativos no CRM - oportunidade de follow-up' }
  ]);

  const handleMinisiteAccess = () => {
    if (broker && broker.username) {
      const minisiteUrl = generateMinisiteUrl(broker.username);
      window.open(minisiteUrl, '_blank');
      toast({
        title: "Minisite aberto",
        description: "Seu minisite foi aberto em uma nova aba",
      });
    } else {
      toast({
        title: "Configure seu username",
        description: "Você precisa configurar um username primeiro",
        variant: "destructive",
      });
    }
  };

  const copyMinisiteUrl = () => {
    if (broker && broker.username) {
      const minisiteUrl = generateMinisiteUrl(broker.username);
      navigator.clipboard.writeText(minisiteUrl);
      toast({
        title: "URL copiada",
        description: "URL do seu minisite copiada para a área de transferência",
      });
    } else {
      toast({
        title: "Configure seu username",
        description: "Você precisa configurar um username primeiro",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // ⚠️ ATENÇÃO: Stats do dashboard - usa tabela 'imoveis'
      // Fetch properties with details for insights
      const { data: properties, count: propertiesCount } = await supabase
        .from('imoveis')
        .select('property_type, price, visibility', { count: 'exact' })
        .eq('owner_id', user?.id);

      // Fetch clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch deals count
      const { count: dealsCount } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .or(`buyer_broker_id.eq.${user?.id},seller_broker_id.eq.${user?.id},listing_broker_id.eq.${user?.id}`);

      setStats({
        properties: propertiesCount || 0,
        clients: clientsCount || 0,
        messages: 156, // Mock data
        deals: dealsCount || 0
      });

      // Generate insights from real data
      if (properties && properties.length > 0) {
        generateInsights(properties);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateInsights = (properties: any[]) => {
    const newInsights = [];

    // Property type analysis
    const typeCount = properties.reduce((acc, prop) => {
      const type = prop.property_type || 'apartamento';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonType = Object.keys(typeCount).reduce((a, b) => 
      typeCount[a] > typeCount[b] ? a : b
    );
    const typePercentage = Math.round((typeCount[mostCommonType] / properties.length) * 100);

    newInsights.push({
      type: 'info',
      title: `📈 ${mostCommonType}s lideram portfólio`,
      description: `${typePercentage}% dos imóveis são ${mostCommonType}s - tipo mais popular do portfólio`
    });

    // Price analysis
    const prices = properties.filter(p => p.price > 0).map(p => Number(p.price));
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const maxPrice = Math.max(...prices);
      const priceRatio = maxPrice / avgPrice;
      
      if (priceRatio > 5) {
        newInsights.push({
          type: 'success',
          title: '💰 Portfólio diversificado',
          description: `Imóvel premium ${priceRatio.toFixed(1)}x acima da média - potencial de alto valor`
        });
      }
    }

    // Visibility analysis
    const hiddenCount = properties.filter(p => p.visibility === 'hidden').length;
    const visibleCount = properties.length - hiddenCount;
    
    if (hiddenCount > 0) {
      newInsights.push({
        type: 'primary',
        title: '🎯 Oportunidade de exposição',
        description: `${hiddenCount} imóveis ocultos - considere torná-los públicos para mais visibilidade`
      });
    } else if (visibleCount > 0) {
      newInsights.push({
        type: 'primary',
        title: '🎯 Portfólio ativo',
        description: `Todos os ${visibleCount} imóveis estão visíveis - ótima estratégia de marketing`
      });
    }

    setInsights(newInsights);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho do seu negócio imobiliário
          </p>
        </div>
        
        {/* Actions and Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <NotificationCenter />
          <ResponsiveButtonGroup className="flex-1">
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao Site</span>
              <span className="sm:hidden">Site</span>
            </Button>
            <Button 
              variant="outline"
              onClick={copyMinisiteUrl}
              className="w-full sm:w-auto"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Copiar URL</span>
              <span className="sm:hidden">URL</span>
            </Button>
            <Button 
              onClick={handleMinisiteAccess}
              className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90 w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Meu Minisite</span>
              <span className="sm:hidden">Minisite</span>
            </Button>
          </ResponsiveButtonGroup>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/app/imoveis')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imóveis Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties}</div>
            <p className="text-xs text-muted-foreground">
              Clique para gerenciar
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/app/crm')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">
              Clique para ver CRM
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openChatModal()}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" strokeWidth={2} fill="none" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages}</div>
            <p className="text-xs text-muted-foreground">
              Clique para abrir
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/app/deals')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negociações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deals}</div>
            <p className="text-xs text-muted-foreground">
              Clique para ver todas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Banners Section */}
      <Card>
        <CardHeader>
          <CardTitle>Destaques da Região</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              className="bg-gradient-to-br from-primary/10 to-brand-secondary/10 border-primary/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/app/marketplace')}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Badge variant="secondary">Lançamento</Badge>
                  <h3 className="font-semibold">Residencial Costa Dourada</h3>
                  <p className="text-sm text-muted-foreground">
                    Apartamentos de 2 e 3 quartos na Praia do Sul
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/app/marketplace')}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Badge variant="outline">Oportunidade</Badge>
                  <h3 className="font-semibold">Casa no Centro Histórico</h3>
                  <p className="text-sm text-muted-foreground">
                    Imóvel comercial em localização privilegiada
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-success/10 to-accent/10 border-success/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/app/match')}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Badge className="bg-success text-success-foreground">Match</Badge>
                  <h3 className="font-semibold">Sugestões Inteligentes</h3>
                  <p className="text-sm text-muted-foreground">
                    5 matches perfeitos para seus clientes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Visibilidade dos Imóveis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ocultos</span>
                <Badge variant="secondary">8</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Apenas Match</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Site Público</span>
                <Badge className="bg-success text-success-foreground">4</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Ações Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Publicar Imóvel</span>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Novo Cliente</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Buscar Matches</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insights Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const colorClasses = {
                  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
                  success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
                  primary: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100'
                };
                
                const textColorClasses = {
                  info: 'text-blue-700 dark:text-blue-300',
                  success: 'text-green-700 dark:text-green-300',
                  primary: 'text-purple-700 dark:text-purple-300'
                };

                return (
                  <div key={index} className={`p-3 rounded-lg border ${colorClasses[insight.type as keyof typeof colorClasses]}`}>
                    <p className="text-sm font-medium">
                      {insight.title}
                    </p>
                    <p className={`text-xs mt-1 ${textColorClasses[insight.type as keyof typeof textColorClasses]}`}>
                      {insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partnerships Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Parceiros & Convênios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {/* Bancos */}
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🏦</div>
              <span className="text-xs text-center text-muted-foreground">Banco do Brasil</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🏦</div>
              <span className="text-xs text-center text-muted-foreground">Caixa Econômica</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🏛️</div>
              <span className="text-xs text-center text-muted-foreground">Prefeitura de Ilhéus</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">📋</div>
              <span className="text-xs text-center text-muted-foreground">CRECI BA</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🔨</div>
              <span className="text-xs text-center text-muted-foreground">Material Construção</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🪑</div>
              <span className="text-xs text-center text-muted-foreground">Móveis Planejados</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🏦</div>
              <span className="text-xs text-center text-muted-foreground">Correspondente Bancário</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">📝</div>
              <span className="text-xs text-center text-muted-foreground">Cartório</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🎨</div>
              <span className="text-xs text-center text-muted-foreground">Serviços de Pintura</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">🔧</div>
              <span className="text-xs text-center text-muted-foreground">Montagem Móveis</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">❄️</div>
              <span className="text-xs text-center text-muted-foreground">Ar Condicionado</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border group hover:shadow-md transition-all">
              <div className="text-2xl mb-1">⚖️</div>
              <span className="text-xs text-center text-muted-foreground">Serviços Jurídicos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Analytics */}
      <MarketStatsWidget />

      <ChatExternalModal
        isOpen={modalOpen}
        onClose={closeChatModal}
        chatUrl={chatUrl}
      />
    </div>
  );
};

export default Dashboard;