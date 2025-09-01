import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, MessageSquare, TrendingUp, Eye, Heart, Target, Globe, ExternalLink, Home } from 'lucide-react';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { broker } = useBroker();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    properties: 0,
    clients: 0,
    messages: 0,
    deals: 0
  });

  const handleMinisiteAccess = () => {
    if (broker) {
      const minisiteUrl = `${window.location.origin}/minisite/${broker.id}`;
      window.open(minisiteUrl, '_blank');
      toast({
        title: "Minisite aberto",
        description: "Seu minisite foi aberto em uma nova aba",
      });
    }
  };

  const copyMinisiteUrl = () => {
    if (broker) {
      const minisiteUrl = `${window.location.origin}/minisite/${broker.id}`;
      navigator.clipboard.writeText(minisiteUrl);
      toast({
        title: "URL copiada",
        description: "URL do seu minisite copiada para a área de transferência",
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
      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

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
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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
        
        {/* Actions - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao Site</span>
            <span className="sm:hidden">Site</span>
          </Button>
          <Button 
            variant="outline"
            onClick={copyMinisiteUrl}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Copiar URL</span>
            <span className="sm:hidden">URL</span>
          </Button>
          <Button 
            onClick={handleMinisiteAccess}
            className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90 flex items-center gap-2 w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Ver Meu Minisite</span>
            <span className="sm:hidden">Minisite</span>
          </Button>
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
          onClick={() => navigate('/app/inbox')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      {/* Partnerships Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Parceiros & Convênios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className="flex items-center justify-center p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30"
              >
                <span className="text-xs text-muted-foreground">Parceiro {i}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;