import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  MapPin,
  Building2,
  Star,
  Clock,
  Heart,
  MessageSquare,
  TrendingUp,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  location_preference?: string;
  notes?: string;
  status: string;
  source?: string;
  created_at: string;
  last_contact?: string;
  avatar_url?: string;
}

interface Interaction {
  id: string;
  client_id: string;
  type: string;
  description: string;
  date: string;
  result?: string;
  next_followup?: string;
}

interface MatchedProperty {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  property_type: string;
  fotos: string[];
  match_score: number;
}

export function EnhancedCRM() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [matchedProperties, setMatchedProperties] = useState<MatchedProperty[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    profession: '',
    marital_status: 'single',
    lead_source: 'website',
    budget_min: '',
    budget_max: '',
    property_type: '',
    location_preference: '',
    notes: '',
    status: 'lead',
    source: 'website',
    cpf: '',
    rg: '',
    nacionalidade: 'brasileiro',
    estado_civil: 'solteiro',
    renda: '',
    comprovante_renda: '',
    score_serasa: '',
    banco_principal: '',
    possui_conta_banco: false,
    tempo_conta_banco: '',
    cartao_credito: false,
    limite_cartao: '',
    empregado: false,
    empresa: '',
    cargo: '',
    tempo_empresa: '',
    referencias_pessoais: '',
    contato_emergencia_nome: '',
    contato_emergencia_telefone: '',
    observacoes_gerais: ''
  });

  const [interactionForm, setInteractionForm] = useState({
    type: 'call',
    description: '',
    result: '',
    next_followup: ''
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      fetchInteractions(selectedClient.id);
      fetchMatchedProperties(selectedClient);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      // Simulated data for now - replace with real Supabase query
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          budget_min: 500000,
          budget_max: 800000,
          property_type: 'apartamento',
          location_preference: 'Vila Madalena, Pinheiros',
          status: 'interested',
          source: 'website',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          last_contact: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '(11) 88888-8888',
          budget_min: 300000,
          budget_max: 500000,
          property_type: 'casa',
          location_preference: 'Zona Sul',
          status: 'lead',
          source: 'referral',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
        },
        {
          id: '3',
          name: 'Carlos Oliveira',
          email: 'carlos@email.com',
          phone: '(11) 77777-7777',
          budget_min: 800000,
          budget_max: 1200000,
          property_type: 'apartamento',
          location_preference: 'Jardins, Itaim',
          status: 'client',
          source: 'social_media',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          last_contact: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
      ];

      setClients(mockClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async (clientId: string) => {
    try {
      // Simulated data for now - replace with real Supabase query
      const mockInteractions: Interaction[] = [
        {
          id: '1',
          client_id: clientId,
          type: 'call',
          description: 'Primeira conversa sobre necessidades do cliente',
          date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          result: 'Interessado em apartamento na Vila Madalena',
          next_followup: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
          id: '2',
          client_id: clientId,
          type: 'email',
          description: 'Envio de portfólio de imóveis selecionados',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          result: 'Gostou de 3 opções, quer agendar visitas'
        },
        {
          id: '3',
          client_id: clientId,
          type: 'visit',
          description: 'Visita ao apartamento na Vila Madalena',
          date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          result: 'Muito interessado, vai pensar até amanhã'
        }
      ];

      setInteractions(mockInteractions);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const fetchMatchedProperties = async (client: Client) => {
    try {
      // Simulate AI matching based on client preferences
      const mockMatches: MatchedProperty[] = [
        {
          id: '1',
          titulo: 'Apartamento 3 quartos Vila Madalena',
          valor: 650000,
          area: 85,
          quartos: 3,
          property_type: 'apartamento',
          fotos: [],
          match_score: 95
        },
        {
          id: '2',
          titulo: 'Apartamento 2 quartos Pinheiros',
          valor: 580000,
          area: 70,
          quartos: 2,
          property_type: 'apartamento',
          fotos: [],
          match_score: 88
        },
        {
          id: '3',
          titulo: 'Apartamento 3 quartos Vila Madalena Premium',
          valor: 750000,
          area: 95,
          quartos: 3,
          property_type: 'apartamento',
          fotos: [],
          match_score: 82
        }
      ];

      setMatchedProperties(mockMatches);
    } catch (error) {
      console.error('Error fetching matched properties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simulate saving client - replace with real Supabase insert/update
      const newClient: Client = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : undefined,
        property_type: formData.property_type,
        location_preference: formData.location_preference,
        notes: formData.notes,
        status: formData.status,
        source: formData.source,
        created_at: new Date().toISOString()
      };

      if (selectedClient) {
        // Update existing client
        setClients(prev => prev.map(client => 
          client.id === selectedClient.id ? { ...newClient, id: selectedClient.id } : client
        ));
      } else {
        // Add new client
        setClients(prev => [...prev, newClient]);
      }

      toast({
        title: "Sucesso!",
        description: selectedClient ? "Cliente atualizado com sucesso" : "Cliente adicionado com sucesso",
      });

      setIsAddDialogOpen(false);
      setSelectedClient(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  date_of_birth: '',
                  address: '',
                  profession: '',
                  marital_status: 'single',
                  lead_source: 'website',
                  budget_min: '',
                  budget_max: '',
                  property_type: '',
                  location_preference: '',
                  notes: '',
                  status: 'lead',
                  source: 'website',
                  cpf: '',
                  rg: '',
                  nacionalidade: 'brasileiro',
                  estado_civil: 'solteiro',
                  renda: '',
                  comprovante_renda: '',
                  score_serasa: '',
                  banco_principal: '',
                  possui_conta_banco: false,
                  tempo_conta_banco: '',
                  cartao_credito: false,
                  limite_cartao: '',
                  empregado: false,
                  empresa: '',
                  cargo: '',
                  tempo_empresa: '',
                  referencias_pessoais: '',
                  contato_emergencia_nome: '',
                  contato_emergencia_telefone: '',
                  observacoes_gerais: ''
                });
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente",
        variant: "destructive",
      });
    }
  };

  const addInteraction = async () => {
    if (!selectedClient || !interactionForm.description) return;

    try {
      const newInteraction: Interaction = {
        id: Date.now().toString(),
        client_id: selectedClient.id,
        type: interactionForm.type,
        description: interactionForm.description,
        date: new Date().toISOString(),
        result: interactionForm.result,
        next_followup: interactionForm.next_followup
      };

      setInteractions(prev => [...prev, newInteraction]);
      
      // Update client's last contact
      setClients(prev => prev.map(client =>
        client.id === selectedClient.id 
          ? { ...client, last_contact: new Date().toISOString() }
          : client
      ));

      toast({
        title: "Interação registrada!",
        description: "Interação adicionada com sucesso",
      });

      setInteractionForm({
        type: 'call',
        description: '',
        result: '',
        next_followup: ''
      });
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar interação",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'lead':
        return <Badge variant="outline">Lead</Badge>;
      case 'interested':
        return <Badge variant="default">Interessado</Badge>;
      case 'client':
        return <Badge variant="secondary">Cliente</Badge>;
      case 'closed':
        return <Badge className="bg-green-500">Fechou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      website: 'bg-blue-500',
      referral: 'bg-green-500',
      social_media: 'bg-purple-500',
      advertising: 'bg-orange-500'
    };
    
    return (
      <Badge className={`text-white ${colors[source as keyof typeof colors] || 'bg-gray-500'}`}>
        {source === 'website' ? 'Site' :
         source === 'referral' ? 'Indicação' :
         source === 'social_media' ? 'Redes Sociais' :
         source === 'advertising' ? 'Publicidade' : source}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedClient ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                CRM Avançado
              </h1>
              <p className="text-muted-foreground">
                Gerencie clientes com IA e sistema de match automático
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setSelectedClient(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  date_of_birth: '',
                  address: '',
                  profession: '',
                  marital_status: 'single',
                  lead_source: 'website',
                  budget_min: '',
                  budget_max: '',
                  property_type: '',
                  location_preference: '',
                  notes: '',
                  status: 'lead',
                  source: 'website',
                  cpf: '',
                  rg: '',
                  nacionalidade: 'brasileiro',
                  estado_civil: 'solteiro',
                  renda: '',
                  comprovante_renda: '',
                  score_serasa: '',
                  banco_principal: '',
                  possui_conta_banco: false,
                  tempo_conta_banco: '',
                  cartao_credito: false,
                  limite_cartao: '',
                  empregado: false,
                  empresa: '',
                  cargo: '',
                  tempo_empresa: '',
                  referencias_pessoais: '',
                  contato_emergencia_nome: '',
                  contato_emergencia_telefone: '',
                  relacionamento_emergencia: '',
                  observacoes_gerais: ''
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-brand-secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedClient ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
                  <DialogDescription>
                    {selectedClient ? 'Atualize as informações do cliente' : 'Preencha as informações do novo cliente'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="date_of_birth">Data de Nascimento</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profession">Profissão</Label>
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => setFormData({...formData, profession: e.target.value})}
                        placeholder="Ex: Advogado"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="marital_status">Estado Civil</Label>
                      <Select value={formData.marital_status} onValueChange={(value) => setFormData({...formData, marital_status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Solteiro(a)</SelectItem>
                          <SelectItem value="married">Casado(a)</SelectItem>
                          <SelectItem value="divorced">Divorciado(a)</SelectItem>
                          <SelectItem value="widowed">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lead_source">Origem do Lead</Label>
                      <Select value={formData.lead_source} onValueChange={(value) => setFormData({...formData, lead_source: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Site</SelectItem>
                          <SelectItem value="referral">Indicação</SelectItem>
                          <SelectItem value="social_media">Redes Sociais</SelectItem>
                          <SelectItem value="advertising">Publicidade</SelectItem>
                          <SelectItem value="event">Evento</SelectItem>
                          <SelectItem value="cold_call">Ligação Fria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marital_status">Estado Civil</Label>
                    <Select value={formData.marital_status} onValueChange={(value) => setFormData({...formData, marital_status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Solteiro(a)</SelectItem>
                        <SelectItem value="married">Casado(a)</SelectItem>
                        <SelectItem value="divorced">Divorciado(a)</SelectItem>
                        <SelectItem value="widowed">Viúvo(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="budget_min">Orçamento Min</Label>
                      <Input
                        id="budget_min"
                        type="number"
                        value={formData.budget_min}
                        onChange={(e) => setFormData({...formData, budget_min: e.target.value})}
                        placeholder="500000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget_max">Orçamento Max</Label>
                      <Input
                        id="budget_max"
                        type="number"
                        value={formData.budget_max}
                        onChange={(e) => setFormData({...formData, budget_max: e.target.value})}
                        placeholder="800000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="property_type">Tipo de Imóvel</Label>
                    <Select value={formData.property_type} onValueChange={(value) => setFormData({...formData, property_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location_preference">Preferência de Localização</Label>
                    <Input
                      id="location_preference"
                      value={formData.location_preference}
                      onChange={(e) => setFormData({...formData, location_preference: e.target.value})}
                      placeholder="Ex: Vila Madalena, Pinheiros"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="interested">Interessado</SelectItem>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="closed">Fechou</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="source">Origem</Label>
                      <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Site</SelectItem>
                          <SelectItem value="referral">Indicação</SelectItem>
                          <SelectItem value="social_media">Redes Sociais</SelectItem>
                          <SelectItem value="advertising">Publicidade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                   <Button type="submit" className="w-full">
                     {selectedClient ? 'Atualizar Cliente' : 'Salvar Cliente'}
                   </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="interested">Interessado</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="closed">Fechou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card 
                key={client.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedClient(client)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={client.avatar_url} />
                        <AvatarFallback>
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        setFormData({
                          name: client.name,
                          email: client.email,
                          phone: client.phone,
                          date_of_birth: '',
                          address: '',
                          profession: '',
                          marital_status: 'single',
                          lead_source: client.source || 'website',
                          budget_min: client.budget_min?.toString() || '',
                          budget_max: client.budget_max?.toString() || '',
                          property_type: client.property_type || '',
                          location_preference: client.location_preference || '',
                          notes: client.notes || '',
                          status: client.status,
                          source: client.source || 'website',
                          cpf: '',
                          rg: '',
                          nacionalidade: 'brasileiro',
                          estado_civil: 'solteiro',
                          renda: '',
                          comprovante_renda: '',
                          score_serasa: '',
                          banco_principal: '',
                          possui_conta_banco: false,
                          tempo_conta_banco: '',
                          cartao_credito: false,
                          limite_cartao: '',
                          empregado: false,
                          empresa: '',
                          cargo: '',
                          tempo_empresa: '',
                          referencias_pessoais: '',
                          contato_emergencia_nome: '',
                          contato_emergencia_telefone: '',
                          relacionamento_emergencia: '',
                          observacoes_gerais: ''
                        });
                        setIsAddDialogOpen(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    <span>{client.phone}</span>
                  </div>
                  
                  {client.budget_min && client.budget_max && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span>
                        {formatCurrency(client.budget_min)} - {formatCurrency(client.budget_max)}
                      </span>
                    </div>
                  )}
                  
                  {client.property_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-3 w-3" />
                      <span className="capitalize">{client.property_type}</span>
                    </div>
                  )}
                  
                  {client.location_preference && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>{client.location_preference}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Criado {formatDistanceToNow(new Date(client.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    {client.last_contact && (
                      <span>
                        Último contato {formatDistanceToNow(new Date(client.last_contact), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                Adicione seu primeiro cliente para começar
              </p>
            </div>
          )}
        </>
      ) : (
        /* Client Detail View */
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              ← Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{selectedClient.name}</h1>
              <p className="text-muted-foreground">{selectedClient.email}</p>
            </div>
               <div className="flex gap-2">
                 {getStatusBadge(selectedClient.status)}
                 {getSourceBadge(selectedClient.source || 'website')}
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     // Set form data with current client data
                      setFormData({
                        name: selectedClient.name,
                        email: selectedClient.email,
                        phone: selectedClient.phone,
                        date_of_birth: '',
                        address: '',
                        profession: '',
                        marital_status: 'single',
                        lead_source: selectedClient.source || 'website',
                        budget_min: selectedClient.budget_min?.toString() || '',
                        budget_max: selectedClient.budget_max?.toString() || '',
                        property_type: selectedClient.property_type || '',
                        location_preference: selectedClient.location_preference || '',
                        notes: selectedClient.notes || '',
                        status: selectedClient.status,
                        source: selectedClient.source || 'website',
                        cpf: '',
                        rg: '',
                        nacionalidade: 'brasileiro',
                        estado_civil: 'solteiro',
                        renda: '',
                        comprovante_renda: '',
                        score_serasa: '',
                        banco_principal: '',
                        possui_conta_banco: false,
                        tempo_conta_banco: '',
                        cartao_credito: false,
                        limite_cartao: '',
                        empregado: false,
                        empresa: '',
                        cargo: '',
                        tempo_empresa: '',
                        referencias_pessoais: '',
                        contato_emergencia_nome: '',
                        contato_emergencia_telefone: '',
                        relacionamento_emergencia: '',
                        observacoes_gerais: ''
                      });
                     setIsAddDialogOpen(true);
                   }}
                 >
                   <Edit className="h-4 w-4 mr-1" />
                   Editar
                 </Button>
               </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm">{selectedClient.phone}</p>
                </div>
                {selectedClient.budget_min && selectedClient.budget_max && (
                  <div>
                    <Label className="text-sm font-medium">Orçamento</Label>
                    <p className="text-sm">
                      {formatCurrency(selectedClient.budget_min)} - {formatCurrency(selectedClient.budget_max)}
                    </p>
                  </div>
                )}
                {selectedClient.property_type && (
                  <div>
                    <Label className="text-sm font-medium">Tipo de Imóvel</Label>
                    <p className="text-sm capitalize">{selectedClient.property_type}</p>
                  </div>
                )}
                {selectedClient.location_preference && (
                  <div>
                    <Label className="text-sm font-medium">Localização Preferida</Label>
                    <p className="text-sm">{selectedClient.location_preference}</p>
                  </div>
                )}
                {selectedClient.notes && (
                  <div>
                    <Label className="text-sm font-medium">Observações</Label>
                    <p className="text-sm">{selectedClient.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Matched Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Imóveis Compatíveis
                  <Badge variant="secondary">{matchedProperties.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {matchedProperties.map((property) => (
                      <div key={property.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{property.titulo}</h4>
                          <Badge variant="outline" className="text-xs">
                            {property.match_score}% match
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          {formatCurrency(property.valor)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {property.area}m² • {property.quartos} quartos
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Interactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico de Interações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 mb-4">
                  <div className="space-y-3">
                    {interactions.map((interaction) => (
                      <div key={interaction.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {interaction.type === 'call' ? 'Ligação' :
                             interaction.type === 'email' ? 'Email' :
                             interaction.type === 'visit' ? 'Visita' : 'Outro'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(interaction.date), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm">{interaction.description}</p>
                        {interaction.result && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Resultado: {interaction.result}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Add New Interaction */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Nova Interação</h4>
                  <Select 
                    value={interactionForm.type} 
                    onValueChange={(value) => setInteractionForm({...interactionForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="visit">Visita</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Descrição da interação..."
                    value={interactionForm.description}
                    onChange={(e) => setInteractionForm({...interactionForm, description: e.target.value})}
                    className="min-h-[60px]"
                  />
                  <Input
                    placeholder="Resultado/Próximos passos"
                    value={interactionForm.result}
                    onChange={(e) => setInteractionForm({...interactionForm, result: e.target.value})}
                  />
                  <Button 
                    onClick={addInteraction} 
                    className="w-full" 
                    size="sm"
                    disabled={!interactionForm.description}
                  >
                    Registrar Interação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}