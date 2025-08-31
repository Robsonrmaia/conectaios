import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, MessageSquare, TrendingUp, Eye, Heart, Target, Globe, ExternalLink, Home } from 'lucide-react';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { broker } = useBroker();
  const navigate = useNavigate();

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
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Voltar ao Site
          </Button>
          <Button 
            variant="outline"
            onClick={copyMinisiteUrl}
            className="flex items-center gap-2"
            disabled={!broker}
          >
            <Globe className="h-4 w-4" />
            Copiar URL do Minisite
          </Button>
          <Button 
            onClick={handleMinisiteAccess}
            className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90 flex items-center gap-2"
            disabled={!broker}
          >
            <ExternalLink className="h-4 w-4" />
            Ver Meu Minisite
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imóveis Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              +4 esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12 hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negociações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              3 em andamento
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
            <Card className="bg-gradient-to-br from-primary/10 to-brand-secondary/10 border-primary/20">
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

            <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
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

            <Card className="bg-gradient-to-br from-success/10 to-accent/10 border-success/20">
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