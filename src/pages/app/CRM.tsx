import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Plus, Search, Phone, Mail, MapPin, Calendar, Home, MessageSquare, Target, Star, Clock, AlertTriangle, Cake, History } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  tipo: string;
  stage: string;
  classificacao: string;
  valor: number;
  photo?: string;
  created_at: string;
  score: number;
  last_contact_at?: string;
}

interface ClientHistory {
  id: string;
  client_id: string;
  action: string;
  description: string;
  created_at: string;
}

interface Task {
  id: string;
  txt: string;
  done: boolean;
  created_at: string;
  quando?: string;
  onde?: string;
  porque?: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  client_id: string;
}

export default function CRM() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientHistory, setClientHistory] = useState<ClientHistory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [clientFormData, setClientFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    tipo: 'comprador',
    valor: ''
  });

  const [historyFormData, setHistoryFormData] = useState({
    action: 'ligacao',
    description: '',
    client_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
      checkAlerts();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch clients with enhanced fields
      const { data: clientsData, error: clientsError } = await supabase
        .from('conectaios_clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch client history
      const { data: historyData, error: historyError } = await supabase
        .from('client_history')
        .select('*')
        .in('client_id', (clientsData || []).map(c => c.id))
        .order('created_at', { ascending: false });

      if (historyError) {
        console.log('Client history table might not exist yet:', historyError);
        setClientHistory([]);
      } else {
        setClientHistory(historyData || []);
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('conectaios_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('conectaios_notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

    } catch (error) {
      console.error('Error fetching CRM data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do CRM",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = () => {
    const today = new Date();
    const newAlerts: any[] = [];

    clients.forEach(client => {
      // Alert for clients without contact for 7+ days
      if (client.last_contact_at) {
        const lastContact = new Date(client.last_contact_at);
        const daysSinceContact = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceContact >= 7) {
          newAlerts.push({
            type: 'contact',
            client: client.nome,
            message: `Sem contato há ${daysSinceContact} dias`,
            priority: daysSinceContact >= 14 ? 'high' : 'medium'
          });
        }
      }

      // Alert for upcoming birthdays (3 days before)
      if (client.data_nascimento) {
        const birthday = new Date(client.data_nascimento);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        const daysUntilBirthday = Math.floor((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilBirthday >= 0 && daysUntilBirthday <= 3) {
          newAlerts.push({
            type: 'birthday',
            client: client.nome,
            message: daysUntilBirthday === 0 ? 'Aniversário hoje!' : `Aniversário em ${daysUntilBirthday} dias`,
            priority: 'medium'
          });
        }
      }
    });

    setAlerts(newAlerts);
  };

  const handleAddClient = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conectaios_clients')
        .insert({
          user_id: user.id,
          nome: clientFormData.nome,
          telefone: clientFormData.telefone,
          email: clientFormData.email,
          data_nascimento: clientFormData.data_nascimento || null,
          tipo: clientFormData.tipo,
          valor: parseFloat(clientFormData.valor) || 0,
          stage: 'novo_lead',
          classificacao: 'novo_lead',
          score: 0,
          last_contact_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente adicionado com sucesso!",
      });

      setIsClientDialogOpen(false);
      setClientFormData({ nome: '', telefone: '', email: '', data_nascimento: '', tipo: 'comprador', valor: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar cliente",
        variant: "destructive",
      });
    }
  };

  const handleAddHistory = async () => {
    if (!user || !historyFormData.client_id) return;

    try {
      const { error } = await supabase
        .from('client_history')
        .insert({
          client_id: historyFormData.client_id,
          action: historyFormData.action,
          description: historyFormData.description,
          user_id: user.id
        });

      if (error) {
        console.log('Client history error:', error);
        toast({
          title: "Info",
          description: "Tabela de histórico ainda não configurada. Funcionalidade será ativada em breve.",
        });
        return;
      }

      // Update last_contact_at for the client
      await supabase
        .from('conectaios_clients')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', historyFormData.client_id);

      toast({
        title: "Sucesso",
        description: "Histórico adicionado com sucesso!",
      });

      setIsHistoryDialogOpen(false);
      setHistoryFormData({ action: 'ligacao', description: '', client_id: '' });
      fetchData();
      checkAlerts();
    } catch (error) {
      console.error('Error adding history:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar histórico",
        variant: "destructive",
      });
    }
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'novo_lead': 'Novo Lead',
      'qualificado': 'Qualificado',
      'proposta': 'Proposta',
      'negociacao': 'Negociação',
      'finalizado': 'Finalizado',
      'perdido': 'Perdido'
    };
    return labels[stage] || stage;
  };

  const getActionIcon = (action: string) => {
    const icons: { [key: string]: any } = {
      'ligacao': Phone,
      'email': Mail,
      'reuniao': Calendar,
      'visita': MapPin,
      'proposta': Target,
      'contrato': MessageSquare
    };
    return icons[action] || MessageSquare;
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'novo_lead': 'bg-gray-100 text-gray-800',
      'qualificado': 'bg-blue-100 text-blue-800',
      'proposta': 'bg-yellow-100 text-yellow-800',
      'negociacao': 'bg-orange-100 text-orange-800',
      'finalizado': 'bg-green-100 text-green-800',
      'perdido': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">CRM Avançado</h1>
            <p className="text-muted-foreground">
              Gerencie clientes com histórico detalhado e alertas inteligentes
            </p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas ({alerts.length})
          </h3>
          <div className="grid gap-2">
            {alerts.map((alert, index) => (
              <Alert key={index} className={alert.priority === 'high' ? 'border-destructive' : 'border-warning'}>
                <div className="flex items-center gap-2">
                  {alert.type === 'birthday' ? <Cake className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  <AlertDescription>
                    <strong>{alert.client}:</strong> {alert.message}
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clients.length}</div>
            <div className="text-sm text-muted-foreground">Total Clientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {clients.filter(c => c.stage === 'finalizado').length}
            </div>
            <div className="text-sm text-muted-foreground">Finalizados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {alerts.filter(a => a.type === 'contact').length}
            </div>
            <div className="text-sm text-muted-foreground">Sem Contato</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-info">
              {alerts.filter(a => a.type === 'birthday').length}
            </div>
            <div className="text-sm text-muted-foreground">Aniversários</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {clientHistory.length}
            </div>
            <div className="text-sm text-muted-foreground">Interações</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clientes">Clientes ({clients.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({clientHistory.length})</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas ({tasks.filter(t => !t.done).length})</TabsTrigger>
          <TabsTrigger value="notas">Notas ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo cliente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={clientFormData.nome}
                      onChange={(e) => setClientFormData({...clientFormData, nome: e.target.value})}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={clientFormData.telefone}
                        onChange={(e) => setClientFormData({...clientFormData, telefone: e.target.value})}
                        placeholder="(73) 9 9999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={clientFormData.email}
                        onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        type="date"
                        value={clientFormData.data_nascimento}
                        onChange={(e) => setClientFormData({...clientFormData, data_nascimento: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={clientFormData.tipo} onValueChange={(value) => setClientFormData({...clientFormData, tipo: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comprador">Comprador</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="locatario">Locatário</SelectItem>
                          <SelectItem value="locador">Locador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="valor">Valor do Negócio (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={clientFormData.valor}
                      onChange={(e) => setClientFormData({...clientFormData, valor: e.target.value})}
                      placeholder="0,00"
                    />
                  </div>
                  <Button onClick={handleAddClient} className="w-full">
                    Adicionar Cliente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {clients
              .filter(client =>
                client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.telefone.includes(searchTerm) ||
                client.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(client => (
                <Card key={client.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{client.nome}</h3>
                        <Badge className={getStageColor(client.stage)}>
                          {getStageLabel(client.stage)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {client.telefone}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {client.tipo}
                        </div>
                      </div>
                      {client.last_contact_at && (
                        <div className="text-xs text-muted-foreground">
                          Último contato: {formatDistanceToNow(new Date(client.last_contact_at), { addSuffix: true, locale: ptBR })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {client.valor > 0 && (
                        <Badge variant="outline">
                          {client.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Badge>
                      )}
                      <Dialog open={isHistoryDialogOpen && selectedClient?.id === client.id} onOpenChange={setIsHistoryDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedClient(client);
                              setHistoryFormData({...historyFormData, client_id: client.id});
                            }}
                          >
                            <History className="h-4 w-4 mr-1" />
                            Histórico
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar ao Histórico - {client.nome}</DialogTitle>
                            <DialogDescription>
                              Registre uma nova interação com o cliente
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="action">Tipo de Ação</Label>
                              <Select value={historyFormData.action} onValueChange={(value) => setHistoryFormData({...historyFormData, action: value})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ligacao">Ligação</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="reuniao">Reunião</SelectItem>
                                  <SelectItem value="visita">Visita</SelectItem>
                                  <SelectItem value="proposta">Proposta</SelectItem>
                                  <SelectItem value="contrato">Contrato</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="description">Descrição</Label>
                              <Textarea
                                id="description"
                                value={historyFormData.description}
                                onChange={(e) => setHistoryFormData({...historyFormData, description: e.target.value})}
                                placeholder="Descreva o que aconteceu nesta interação..."
                                rows={4}
                              />
                            </div>
                            <Button onClick={handleAddHistory} className="w-full">
                              Adicionar ao Histórico
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="space-y-4">
            {clientHistory.length > 0 ? clientHistory.map(history => {
              const client = clients.find(c => c.id === history.client_id);
              const ActionIcon = getActionIcon(history.action);
              
              return (
                <Card key={history.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <ActionIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{client?.nome}</h4>
                        <Badge variant="outline">{history.action}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(history.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{history.description}</p>
                    </div>
                  </div>
                </Card>
              );
            }) : (
              <div className="text-center p-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum histórico encontrado. Adicione interações com seus clientes.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tarefas" className="space-y-4">
          <div className="text-center p-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Funcionalidade de tarefas será implementada em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="notas" className="space-y-4">
          <div className="text-center p-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Funcionalidade de notas será implementada em breve</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}