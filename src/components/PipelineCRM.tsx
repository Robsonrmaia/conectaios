import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, UserPlus, User, Phone, Calendar, CheckCircle, XCircle, Clock, Target, Star, FileText, Edit, Search, Mail, MapPin, MessageSquare, Cake, History as HistoryIcon, Mic } from 'lucide-react';
import { GlobalClientSearch } from './GlobalClientSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VoiceClientRecorder } from '@/components/VoiceClientRecorder';

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
  pipeline_id?: string;
  historico?: any[];
  opp?: string;
  responsavel?: string;
  updated_at: string;
  documents?: string[];
}

interface ClientHistory {
  id: string;
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

const STAGES = [
  { id: 'novo_lead', name: 'Novo Lead', color: 'bg-gray-100 text-gray-800' },
  { id: 'qualificado', name: 'Qualificado', color: 'bg-blue-100 text-blue-800' },
  { id: 'proposta', name: 'Proposta', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'negociacao', name: 'Negociação', color: 'bg-orange-100 text-orange-800' },
  { id: 'finalizado', name: 'Finalizado', color: 'bg-green-100 text-green-800' },
  { id: 'perdido', name: 'Perdido', color: 'bg-red-100 text-red-800' }
];

export default function PipelineCRM() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientHistory, setClientHistory] = useState<{ [key: string]: ClientHistory[] }>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

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
    description: ''
  });

  const [taskFormData, setTaskFormData] = useState({
    txt: '',
    quando: '',
    onde: '',
    porque: ''
  });

  const [noteFormData, setNoteFormData] = useState({
    content: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('conectaios_clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients((clientsData as Client[]) || []);

      // Fetch history for all clients
      if (clientsData && clientsData.length > 0) {
        const { data: historyData } = await supabase
          .from('client_history')
          .select('*')
          .in('client_id', clientsData.map(c => c.id))
          .order('created_at', { ascending: false });

        if (historyData) {
          const historyByClient = historyData.reduce((acc, item) => {
            if (!acc[item.client_id]) acc[item.client_id] = [];
            acc[item.client_id].push(item);
            return acc;
          }, {} as { [key: string]: ClientHistory[] });
          setClientHistory(historyByClient);
        }
      }

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('conectaios_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setTasks(tasksData || []);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('conectaios_notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setNotes(notesData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do CRM",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const clientId = draggableId;
    const newStage = destination.droppableId;

    try {
      const { error } = await supabase
        .from('conectaios_clients')
        .update({ 
          stage: newStage,
          last_contact_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      // Add history entry
      await supabase
        .from('client_history')
        .insert({
          client_id: clientId,
          action: 'mudanca_stage',
          description: `Stage alterado para ${STAGES.find(s => s.id === newStage)?.name}`,
          user_id: user?.id
        });

      // Update local state
      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { ...client, stage: newStage, last_contact_at: new Date().toISOString() }
          : client
      ));

      toast({
        title: "Sucesso",
        description: "Cliente movido no pipeline!",
      });

    } catch (error) {
      console.error('Erro ao mover cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover cliente no pipeline",
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async () => {
    if (!user) return;

    try {
      console.log('Tentando criar cliente:', clientFormData);
      // First, create the client
      const { data: clientData, error } = await supabase
        .from('conectaios_clients')
        .insert({
          user_id: user.id,
          nome: clientFormData.nome,
          telefone: clientFormData.telefone,
          email: clientFormData.email || null,
          data_nascimento: clientFormData.data_nascimento || null,
          tipo: clientFormData.tipo,
          valor: parseFloat(clientFormData.valor) || 0,
          stage: 'novo_lead',
          classificacao: 'novo_lead',
          score: 0,
          last_contact_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('Resultado inserção:', { clientData, error });

      if (error) {
        console.error('Erro detalhado ao criar cliente:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao adicionar cliente",
          variant: "destructive",
        });
        return;
      }

      console.log('Cliente criado com sucesso:', clientData);

      // Add initial history if description provided
      if (historyFormData.description.trim()) {
        await supabase
          .from('client_history')
          .insert({
            client_id: clientData.id,
            action: historyFormData.action,
            description: historyFormData.description,
            user_id: user.id
          });
      }

      toast({
        title: "Sucesso",
        description: "Cliente adicionado com sucesso!",
      });

      setIsClientDialogOpen(false);
      setClientFormData({ nome: '', telefone: '', email: '', data_nascimento: '', tipo: 'comprador', valor: '' });
      setHistoryFormData({ action: 'ligacao', description: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar cliente",
        variant: "destructive",
      });
    }
  };

  const handleVoiceClientData = (voiceData: any) => {
    console.log('Dados de voz recebidos:', voiceData);
    
    // Mapear dados estruturados para o formato do cliente
    const mappedData = {
      nome: voiceData.nome || voiceData.name || '',
      telefone: voiceData.telefone || voiceData.phone || '',
      email: voiceData.email || '',
      data_nascimento: '',
      tipo: voiceData.tipo || voiceData.interesse || 'comprador',
      valor: voiceData.valor || voiceData.budget || voiceData.orcamento ? 
        parseFloat(String(voiceData.valor || voiceData.budget || voiceData.orcamento).replace(/\D/g, '')) || 0 : 0
    };

    // Pre-preencher o formulário e abrir o dialog
    setClientFormData({
      ...mappedData,
      valor: String(mappedData.valor) // Converter para string
    });
    setHistoryFormData({
      action: 'observacao',
      description: `Dados capturados por voz: ${voiceData.observacoes || voiceData.notes || 'Novo cliente registrado via gravação'}`
    });
    setIsClientDialogOpen(true);
    
    toast({
      title: "Dados capturados!",
      description: "Revise as informações e confirme para salvar o cliente.",
    });
  };

  const handleAddHistory = async () => {
    if (!selectedClient) return;

    try {
      const { error } = await supabase
        .from('client_history')
        .insert({
          client_id: selectedClient.id,
          action: historyFormData.action,
          description: historyFormData.description,
          user_id: user?.id
        });

      if (error) throw error;

      // Update last contact
      await supabase
        .from('conectaios_clients')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', selectedClient.id);

      toast({
        title: "Sucesso",
        description: "Histórico adicionado!",
      });

      setIsHistoryDialogOpen(false);
      setHistoryFormData({ action: 'ligacao', description: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar histórico",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conectaios_tasks')
        .insert({
          user_id: user.id,
          txt: taskFormData.txt,
          quando: taskFormData.quando,
          onde: taskFormData.onde,
          porque: taskFormData.porque,
          done: false
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tarefa criada!",
      });

      setIsTaskDialogOpen(false);
      setTaskFormData({ txt: '', quando: '', onde: '', porque: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const handleAddNote = async () => {
    if (!user || !selectedClient) return;

    try {
      const { error } = await supabase
        .from('conectaios_notes')
        .insert({
          user_id: user.id,
          client_id: selectedClient.id,
          content: noteFormData.content
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Nota adicionada!",
      });

      setIsNoteDialogOpen(false);
      setNoteFormData({ content: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pipeline CRM</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsVoiceRecorderOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Mic className="h-4 w-4 mr-2" />
            Gravar Cliente
          </Button>
          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    name="nome"
                    required
                    placeholder="Nome completo do cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Interesse</Label>
                  <Select name="tipo" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprar">Comprar</SelectItem>
                      <SelectItem value="vender">Vender</SelectItem>
                      <SelectItem value="alugar">Alugar</SelectItem>
                      <SelectItem value="investir">Investir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Adicionar Cliente
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-2 overflow-x-auto pb-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:gap-4 min-w-max md:min-w-0">
          {STAGES.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <Card className={`min-w-[180px] md:min-w-0 w-[180px] md:w-full h-fit flex-shrink-0 ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="truncate">{stage.name}</span>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {clients.filter(c => c.stage === stage.id).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                    {clients
                      .filter(client => client.stage === stage.id)
                      .map((client, index) => (
                        <Draggable key={client.id} draggableId={client.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-background border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                              onClick={() => setSelectedClient(client)}
                            >
                              <div className="flex items-start gap-2">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={client.photo || undefined} />
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <h4 className="font-medium text-sm truncate">{client.nome}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{client.telefone}</p>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {client.tipo}
                                  </Badge>
                                  {client.valor > 0 && (
                                    <p className="text-xs text-green-600 font-medium mt-1 truncate">
                                      R$ {client.valor.toLocaleString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
          </div>
        </div>
      </DragDropContext>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Tarefas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.filter(task => !task.done).slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg border">
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.txt}</p>
                  {task.quando && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.quando}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tasks.filter(task => !task.done).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para busca global de clientes */}
      <Dialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buscar Clientes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {clients
                  .filter(client => 
                    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    client.telefone.includes(searchTerm) ||
                    client.tipo.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedClient(client);
                        setGlobalSearchOpen(false);
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={client.photo || undefined} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{client.nome}</h4>
                        <p className="text-xs text-muted-foreground">{client.telefone}</p>
                        <Badge variant="outline" className="text-xs mt-1">{client.tipo}</Badge>
                      </div>
                      <Badge className={`text-xs ${
                        client.stage === 'finalizado' ? 'bg-success text-success-foreground' :
                        client.stage === 'negociacao' ? 'bg-warning text-warning-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {STAGES.find(s => s.id === client.stage)?.name || client.stage}
                      </Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes do cliente melhorado */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Cliente - {selectedClient.nome}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="info" className="h-96">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <ScrollArea className="h-64">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedClient.photo || undefined} />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{selectedClient.nome}</h3>
                        <p className="text-muted-foreground">{selectedClient.telefone}</p>
                        {selectedClient.email && (
                          <p className="text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="h-4 w-4" />
                            {selectedClient.email}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-2">
                          {selectedClient.tipo}
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Stage Atual</label>
                        <p className="text-sm text-muted-foreground">
                          {STAGES.find(s => s.id === selectedClient.stage)?.name || selectedClient.stage}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Score</label>
                        <p className="text-sm text-muted-foreground">{selectedClient.score}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Valor Orçamento</label>
                        <p className="text-sm text-muted-foreground">
                          R$ {selectedClient.valor?.toLocaleString('pt-BR') || '0'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Último Contato</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedClient.last_contact_at 
                            ? formatDistanceToNow(new Date(selectedClient.last_contact_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })
                            : 'Nunca'
                          }
                        </p>
                      </div>
                      {selectedClient.data_nascimento && (
                        <div>
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Cake className="h-4 w-4" />
                            Aniversário
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedClient.data_nascimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <HistoryIcon className="h-4 w-4" />
                      Histórico de Interações
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsHistoryDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {clientHistory[selectedClient.id]?.length > 0 ? (
                        clientHistory[selectedClient.id].map((item) => {
                          const IconComponent = getActionIcon(item.action);
                          return (
                            <div key={item.id} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <IconComponent className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium capitalize">{item.action}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma interação registrada</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Notas do Cliente
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsNoteDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {notes.filter(note => note.client_id === selectedClient.id).length > 0 ? (
                        notes.filter(note => note.client_id === selectedClient.id).map((note) => (
                          <div key={note.id} className="p-3 bg-muted rounded-lg">
                            <p className="text-sm">{note.content}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma nota registrada</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar cliente */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
              <TabsTrigger value="historico">Histórico Inicial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dados" className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={clientFormData.nome}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={clientFormData.telefone}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={clientFormData.data_nascimento}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Cliente</Label>
                  <Select value={clientFormData.tipo} onValueChange={(value) => setClientFormData(prev => ({ ...prev, tipo: value }))}>
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
                <div>
                  <Label htmlFor="valor">Valor de Interesse (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={clientFormData.valor}
                    onChange={(e) => setClientFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="historico" className="space-y-4">
              <div>
                <Label htmlFor="action">Tipo de Contato Inicial</Label>
                <Select value={historyFormData.action} onValueChange={(value) => setHistoryFormData(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrição do Primeiro Contato</Label>
                <Textarea
                  id="description"
                  value={historyFormData.description}
                  onChange={(e) => setHistoryFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Cliente interessado em apartamento na Zona Sul..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsClientDialogOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddClient} className="flex-1">
              Salvar Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar tarefa */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="txt">Descrição da Tarefa</Label>
              <Textarea
                id="txt"
                value={taskFormData.txt}
                onChange={(e) => setTaskFormData({...taskFormData, txt: e.target.value})}
                placeholder="O que precisa ser feito?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quando">Quando</Label>
                <Input
                  id="quando"
                  value={taskFormData.quando}
                  onChange={(e) => setTaskFormData({...taskFormData, quando: e.target.value})}
                  placeholder="Hoje, amanhã, 15/01..."
                />
              </div>
              <div>
                <Label htmlFor="onde">Onde</Label>
                <Input
                  id="onde"
                  value={taskFormData.onde}
                  onChange={(e) => setTaskFormData({...taskFormData, onde: e.target.value})}
                  placeholder="Local da tarefa"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="porque">Por que</Label>
              <Textarea
                id="porque"
                value={taskFormData.porque}
                onChange={(e) => setTaskFormData({...taskFormData, porque: e.target.value})}
                placeholder="Motivo ou objetivo da tarefa"
              />
            </div>
            <Button onClick={handleAddTask} className="w-full">
              Criar Tarefa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar histórico */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Histórico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="action">Tipo de Interação</Label>
              <Select 
                value={historyFormData.action} 
                onValueChange={(value) => setHistoryFormData({...historyFormData, action: value})}
              >
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
                placeholder="Descreva a interação..."
              />
            </div>
            <Button onClick={handleAddHistory} className="w-full">
              Adicionar Histórico
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar nota */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Conteúdo da Nota</Label>
              <Textarea
                id="content"
                value={noteFormData.content}
                onChange={(e) => setNoteFormData({...noteFormData, content: e.target.value})}
                placeholder="Digite a nota sobre o cliente..."
                rows={4}
              />
            </div>
            <Button onClick={handleAddNote} className="w-full">
              Adicionar Nota
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Client Search Dialog */}
      <GlobalClientSearch 
        open={globalSearchOpen} 
        onOpenChange={setGlobalSearchOpen} 
      />

      {/* Voice Client Recorder Modal */}
      <VoiceClientRecorder
        isOpen={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onClientData={handleVoiceClientData}
      />
    </div>
  );
}