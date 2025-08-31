import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Handshake, 
  TrendingUp, 
  Eye, 
  Clock, 
  MapPin, 
  DollarSign,
  Search,
  Filter,
  Plus,
  Star
} from 'lucide-react';

export default function Patrocinios() {
  const [searchTerm, setSearchTerm] = useState('');

  const mySponsored = [
    {
      id: 1,
      title: 'Apartamento Jardins Premium',
      location: 'Jardins, São Paulo',
      price: 850000,
      investment: 2500,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      views: 1250,
      leads: 45,
      status: 'ativo',
      image: '/placeholder.svg'
    },
    {
      id: 2,
      title: 'Casa Alphaville Residencial',
      location: 'Alphaville, Barueri',
      price: 1200000,
      investment: 1800,
      startDate: '2024-01-10',
      endDate: '2024-01-25',
      views: 980,
      leads: 32,
      status: 'finalizado',
      image: '/placeholder.svg'
    }
  ];

  const availableSponsors = [
    {
      id: 1,
      title: 'Cobertura Vista Mar',
      location: 'Barra da Tijuca, Rio de Janeiro',
      price: 2500000,
      suggestedInvestment: 4000,
      expectedViews: 2500,
      expectedLeads: 80,
      competition: 'baixa',
      image: '/placeholder.svg',
      tags: ['Luxo', 'Vista Mar', 'Cobertura']
    },
    {
      id: 2,
      title: 'Apartamento Vila Madalena',
      location: 'Vila Madalena, São Paulo',
      price: 650000,
      suggestedInvestment: 1500,
      expectedViews: 1200,
      expectedLeads: 35,
      competition: 'média',
      image: '/placeholder.svg',
      tags: ['Jovem', 'Moderno', 'Localização']
    },
    {
      id: 3,
      title: 'Casa Condomínio Fechado',
      location: 'Granja Viana, Cotia',
      price: 980000,
      suggestedInvestment: 2200,
      expectedViews: 1800,
      expectedLeads: 55,
      competition: 'alta',
      image: '/placeholder.svg',
      tags: ['Família', 'Segurança', 'Natureza']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-success/20 text-success';
      case 'finalizado': return 'bg-muted/20 text-muted-foreground';
      case 'pausado': return 'bg-warning/20 text-warning';
      default: return 'bg-muted';
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'baixa': return 'text-success';
      case 'média': return 'text-warning';
      case 'alta': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const MySponsoredCard = ({ item }: { item: any }) => {
    const daysRemaining = Math.ceil((new Date(item.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <Badge className={`absolute top-3 right-3 ${getStatusColor(item.status)}`}>
            {item.status === 'ativo' ? 'Ativo' : 'Finalizado'}
          </Badge>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Investimento</div>
              <div className="text-lg font-semibold text-primary">
                R$ {item.investment.toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Preço do Imóvel</div>
              <div className="text-lg font-semibold">
                R$ {item.price.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span>{item.views} visualizações</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span>{item.leads} leads</span>
            </div>
          </div>
          
          {item.status === 'ativo' && (
            <div className="text-sm text-muted-foreground">
              {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Expira hoje'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const AvailableCard = ({ item }: { item: any }) => {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 space-y-1">
            <Badge className={`block ${getCompetitionColor(item.competition)} bg-background/90`}>
              Competição {item.competition}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-2xl font-bold">
            R$ {item.price.toLocaleString('pt-BR')}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investimento sugerido:</span>
              <span className="font-medium text-primary">R$ {item.suggestedInvestment}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Visualizações esperadas:</span>
              <span className="font-medium">{item.expectedViews}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Leads esperados:</span>
              <span className="font-medium">{item.expectedLeads}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <Button className="w-full bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90">
            Patrocinar Imóvel
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            Patrocínios
          </h1>
          <p className="text-muted-foreground">
            Patrocine imóveis para aumentar sua visibilidade e gerar mais leads
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Patrocínio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{mySponsored.length}</div>
                <div className="text-sm text-muted-foreground">Patrocínios Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              R$ {mySponsored.reduce((total, item) => total + item.investment, 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-muted-foreground">Investimento Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">
                  {mySponsored.reduce((total, item) => total + item.views, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Visualizações</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-warning">
                  {mySponsored.reduce((total, item) => total + item.leads, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Leads Gerados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="meus" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meus">Meus Patrocínios ({mySponsored.length})</TabsTrigger>
          <TabsTrigger value="disponiveis">Disponíveis ({availableSponsors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="space-y-4">
          {mySponsored.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySponsored.map(item => (
                <MySponsoredCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum patrocínio ativo</h3>
                <p className="text-muted-foreground mb-4">
                  Comece a patrocinar imóveis para aumentar sua visibilidade
                </p>
                <Button>Explorar Oportunidades</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="disponiveis" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar imóveis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSponsors.map(item => (
              <AvailableCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funcionam os Patrocínios</CardTitle>
          <CardDescription>
            Entenda como impulsionar seus imóveis na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Destaque</h3>
              <p className="text-sm text-muted-foreground">
                Seus imóveis aparecem em posições privilegiadas nos resultados de busca
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Visibilidade</h3>
              <p className="text-sm text-muted-foreground">
                Maior exposição resulta em mais visualizações e interesse dos compradores
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Resultados</h3>
              <p className="text-sm text-muted-foreground">
                Mais leads qualificados e maior probabilidade de venda
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}