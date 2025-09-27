import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, User, Calendar, MessageCircle, CheckSquare } from 'lucide-react';
import { CRM } from '@/data';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  tipo: string;
  stage: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

interface Deal {
  id: string;
  client_id: string;
  amount: number;
  stage: string;
  created_at: string;
}

interface Task {
  id: string;
  client_id: string;
  txt: string;
  done: boolean;
  created_at: string;
}

interface Note {
  id: string;
  client_id: string;
  txt: string;
  created_at: string;
}

interface ClientHistory {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

export default function PipelineCRM() {
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [clientHistory, setClientHistory] = useState<ClientHistory[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const [newClient, setNewClient] = useState({
    nome: '',
    telefone: '',
    email: '',
    tipo: 'comprador'
  });

  const [newTask, setNewTask] = useState({
    txt: '',
    client_id: ''
  });

  const [newNote, setNewNote] = useState({
    txt: '',
    client_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do CRM usando a camada unificada
      const [crmClients] = await Promise.all([
        CRM.clients.list()
      ]);

      // Converter para formato compatível
      const formattedClients: Client[] = crmClients.map(client => ({
        id: client.id,
        nome: client.name,
        telefone: client.phone || '',
        email: client.email || '',
        tipo: 'Cliente',
        stage: 'Ativo',
        valor: 0,
        created_at: client.created_at || '',
        updated_at: client.updated_at || ''
      }));

      setClients(formattedClients);

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

  const fetchClientDetails = async (clientId: string) => {
    try {
      // Buscar histórico através das tabelas existentes
      const [dealsResult, notesResult, tasksResult] = await Promise.all([
        CRM.deals.list(),
        CRM.notes.list(), 
        CRM.tasks.list()
      ]);

      // Filtrar por cliente
      const clientDeals = dealsResult.filter(deal => deal.client_id === clientId);
      const clientNotes = notesResult.filter(note => note.client_id === clientId);
      const clientTasks = tasksResult.filter(task => task.client_id === clientId);

      // Converter para histórico
      const history: ClientHistory[] = [
        ...clientDeals.map(deal => ({
          id: deal.id,
          action: 'deal',
          description: `Negócio: ${deal.status || 'Em andamento'}`,
          created_at: deal.created_at || ''
        })),
        ...clientNotes.map(note => ({
          id: note.id,
          action: 'note',
          description: note.content || 'Nota adicionada',
          created_at: note.created_at || ''
        })),
        ...clientTasks.map(task => ({
          id: task.id,
          action: 'task',
          description: `Tarefa: ${task.title || 'Nova tarefa'}`,
          created_at: task.created_at || ''
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setClientHistory(history);

    } catch (error) {
      console.error('Error fetching client details:', error);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.nome || !newClient.telefone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await CRM.clients.create({
        name: newClient.nome,
        phone: newClient.telefone,
        email: newClient.email || null,
        broker_id: null,
        user_id: null,
        budget_max: null,
        budget_min: null,
        notes: null,
        preferred_locations: null,
        whatsapp: null,
        indication_id: null
      });

      setNewClient({ nome: '', telefone: '', email: '', tipo: 'comprador' });
      fetchData();

      toast({
        title: "Sucesso",
        description: "Cliente adicionado com sucesso!",
      });
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar cliente",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async () => {
    if (!newTask.txt || !newTask.client_id) return;

    try {
      await CRM.tasks.create({
        client_id: newTask.client_id,
        title: newTask.txt,
        description: null,
        user_id: null,
        due_date: null,
        priority: 'medium',
        status: 'pending'
      });

      setNewTask({ txt: '', client_id: '' });
      if (selectedClient) {
        fetchClientDetails(selectedClient.id);
      }

      toast({
        title: "Sucesso",
        description: "Tarefa adicionada!",
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.txt || !newNote.client_id) return;

    try {
      await CRM.notes.create({
        client_id: newNote.client_id,
        content: newNote.txt,
        user_id: null,
        title: null,
        tags: null
      });

      setNewNote({ txt: '', client_id: '' });
      if (selectedClient) {
        fetchClientDetails(selectedClient.id);
      }

      toast({
        title: "Sucesso",
        description: "Nota adicionada!",
      });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const stages = ['lead', 'qualified', 'proposal', 'won', 'lost'];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Carregando pipeline...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pipeline CRM</h2>
          <p className="text-muted-foreground">Gerencie seus clientes e oportunidades</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={newClient.nome}
                  onChange={(e) => setNewClient(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={newClient.telefone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <Button onClick={handleAddClient} className="w-full">
                Adicionar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stages.map(stage => (
          <Card key={stage}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium capitalize">
                {stage === 'lead' ? 'Leads' :
                 stage === 'qualified' ? 'Qualificados' :
                 stage === 'proposal' ? 'Propostas' :
                 stage === 'won' ? 'Fechados' : 'Perdidos'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clients
                .filter(client => client.stage === stage || stage === 'lead')
                .map(client => (
                  <Card 
                    key={client.id} 
                    className="p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedClient(client);
                      fetchClientDetails(client.id);
                    }}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{client.nome}</h4>
                      <p className="text-xs text-muted-foreground">{client.telefone}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {client.tipo}
                        </Badge>
                        {client.valor > 0 && (
                          <span className="text-xs font-medium">
                            R$ {(client.valor / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client Details */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Cliente: {selectedClient.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="history">
              <TabsList>
                <TabsTrigger value="history">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Tarefas
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Notas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-3">
                  {clientHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum histórico encontrado
                    </p>
                  ) : (
                    clientHistory.map(entry => (
                      <Card key={entry.id} className="p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{entry.action}</Badge>
                          <span className="text-sm">{entry.description}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTask.txt}
                    onChange={(e) => setNewTask(prev => ({ ...prev, txt: e.target.value, client_id: selectedClient.id }))}
                    placeholder="Nova tarefa..."
                  />
                  <Button onClick={handleAddTask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {tasks
                    .filter(task => task.client_id === selectedClient.id)
                    .map(task => (
                      <Card key={task.id} className="p-3">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={task.done} readOnly />
                          <span className={task.done ? 'line-through text-muted-foreground' : ''}>
                            {task.txt}
                          </span>
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newNote.txt}
                    onChange={(e) => setNewNote(prev => ({ ...prev, txt: e.target.value, client_id: selectedClient.id }))}
                    placeholder="Nova nota..."
                    rows={2}
                  />
                  <Button onClick={handleAddNote}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {notes
                    .filter(note => note.client_id === selectedClient.id)
                    .map(note => (
                      <Card key={note.id} className="p-3">
                        <p className="text-sm">{note.txt}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}