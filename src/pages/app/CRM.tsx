import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Search, Filter, User, Phone, Mail, MapPin, TrendingUp } from 'lucide-react';

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState('');

  const clients = [
    {
      id: 1,
      name: 'Maria Silva',
      email: 'maria.silva@email.com',
      phone: '(11) 99999-9999',
      location: 'São Paulo, SP',
      status: 'lead_quente',
      source: 'Site',
      lastContact: '2024-01-20',
      potentialValue: 850000,
      avatar: '/placeholder.svg',
      tags: ['Apartamento', 'Jardins']
    },
    {
      id: 2,
      name: 'João Santos',
      email: 'joao.santos@email.com',
      phone: '(11) 88888-8888',
      location: 'Barueri, SP',
      status: 'cliente',
      source: 'Indicação',
      lastContact: '2024-01-18',
      potentialValue: 1200000,
      avatar: '/placeholder.svg',
      tags: ['Casa', 'Alphaville']
    },
    {
      id: 3,
      name: 'Ana Costa',
      email: 'ana.costa@email.com',
      phone: '(21) 77777-7777',
      location: 'Rio de Janeiro, RJ',
      status: 'lead_frio',
      source: 'Facebook',
      lastContact: '2024-01-15',
      potentialValue: 2500000,
      avatar: '/placeholder.svg',
      tags: ['Cobertura', 'Barra']
    },
    {
      id: 4,
      name: 'Pedro Lima',
      email: 'pedro.lima@email.com',
      phone: '(11) 66666-6666',
      location: 'São Paulo, SP',
      status: 'prospect',
      source: 'Google Ads',
      lastContact: '2024-01-22',
      potentialValue: 650000,
      avatar: '/placeholder.svg',
      tags: ['Apartamento', 'Vila Madalena']
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'lead_quente':
        return { 
          label: 'Lead Quente', 
          color: 'bg-red-500/20 text-red-700 dark:text-red-300' 
        };
      case 'lead_frio':
        return { 
          label: 'Lead Frio', 
          color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' 
        };
      case 'prospect':
        return { 
          label: 'Prospect', 
          color: 'bg-warning/20 text-warning' 
        };
      case 'cliente':
        return { 
          label: 'Cliente', 
          color: 'bg-success/20 text-success' 
        };
      default:
        return { 
          label: 'Desconhecido', 
          color: 'bg-muted' 
        };
    }
  };

  const filterClients = (status?: string) => {
    let filtered = clients;
    if (status) {
      filtered = filtered.filter(client => client.status === status);
    }
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const totalValue = clients.reduce((total, client) => total + client.potentialValue, 0);

  const ClientCard = ({ client }: { client: any }) => {
    const statusConfig = getStatusConfig(client.status);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={client.avatar} />
                <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <CardDescription>{client.source}</CardDescription>
              </div>
            </div>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {client.email}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {client.phone}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              {client.location}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Valor Potencial</div>
            <div className="text-lg font-semibold text-primary">
              R$ {client.potentialValue.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Último contato: {new Date(client.lastContact).toLocaleDateString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            CRM
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e leads
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cliente
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{clients.length}</div>
                <div className="text-sm text-muted-foreground">Total Clientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">
                  {filterClients('lead_quente').length}
                </div>
                <div className="text-sm text-muted-foreground">Leads Quentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {filterClients('prospect').length}
            </div>
            <div className="text-sm text-muted-foreground">Prospects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              R$ {totalValue.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-muted-foreground">Valor Potencial</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
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

      {/* Clients Tabs */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos ({clients.length})</TabsTrigger>
          <TabsTrigger value="lead_quente">Leads Quentes ({filterClients('lead_quente').length})</TabsTrigger>
          <TabsTrigger value="prospect">Prospects ({filterClients('prospect').length})</TabsTrigger>
          <TabsTrigger value="cliente">Clientes ({filterClients('cliente').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterClients().map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lead_quente" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterClients('lead_quente').map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prospect" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterClients('prospect').map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cliente" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterClients('cliente').map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}