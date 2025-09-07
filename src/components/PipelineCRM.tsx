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
import { Plus, Phone, Mail, MapPin, Calendar, MessageSquare, Target, User, History, Cake, Clock } from 'lucide-react';
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
  pipeline_id?: string;
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
      setClients(clientsData || []);

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
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar cliente",
        variant: "destructive",
      });
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Pipeline CRM</h1>
          <p className="text-muted-foreground">
            Gerencie clientes com sistema de pipeline drag-and-drop
          </p>
        </div>

        <div className="flex gap-2">
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
                  <Label htmlFor="valor">Valor Orçamento</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={clientFormData.valor}
                    onChange={(e) => setClientFormData({...clientFormData, valor: e.target.value})}
                    placeholder="350000"
                  />
                </div>
                <Button onClick={handleAddClient} className="w-full">
                  Adicionar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
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
                      placeholder="Data/horário"
                    />
                  </div>
                  <div>
                    <Label htmlFor="onde">Onde</Label>
                    <Input
                      id="onde"
                      value={taskFormData.onde}
                      onChange={(e) => setTaskFormData({...taskFormData, onde: e.target.value})}
                      placeholder="Local"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="porque">Por que</Label>
                  <Input
                    id="porque"
                    value={taskFormData.porque}
                    onChange={(e) => setTaskFormData({...taskFormData, porque: e.target.value})}
                    placeholder="Motivo/objetivo"
                  />
                </div>
                <Button onClick={handleAddTask} className="w-full">
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline Drag and Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAGES.map((stage) => (
            <div key={stage.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={stage.color}>
                  {stage.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {clients.filter(c => c.stage === stage.id).length}
                </span>
              </div>
              
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                      snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    {clients
                      .filter(client => client.stage === stage.id)
                      .map((client, index) => (
                        <Draggable key={client.id} draggableId={client.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 cursor-grab transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                              onClick={() => setSelectedClient(client)}
                            >
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{client.nome}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {client.telefone}
                                  </div>
                                  {client.email && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      {client.email}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-success">
                                      R$ {client.valor?.toLocaleString('pt-BR')}
                                    </span>
                                    {client.last_contact_at && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(client.last_contact_at), { 
                                          addSuffix: true, 
                                          locale: ptBR 
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Client Details Dialog */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedClient.nome}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Telefone:</span>
                      <p className="text-sm text-muted-foreground">{selectedClient.telefone}</p>
                    </div>
                    {selectedClient.email && (
                      <div>
                        <span className="text-sm font-medium">Email:</span>
                        <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium">Tipo:</span>
                      <p className="text-sm text-muted-foreground">{selectedClient.tipo}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Orçamento:</span>
                      <p className="text-sm text-muted-foreground">
                        R$ {selectedClient.valor?.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {selectedClient.data_nascimento && (
                      <div>
                        <span className="text-sm font-medium">Aniversário:</span>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Cake className="h-3 w-3" />
                          {new Date(selectedClient.data_nascimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {selectedClient.last_contact_at && (
                      <div>
                        <span className="text-sm font-medium">Último Contato:</span>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(selectedClient.last_contact_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Adicionar Interação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Interação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Interação</Label>
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
                        <Label>Descrição</Label>
                        <Textarea
                          value={historyFormData.description}
                          onChange={(e) => setHistoryFormData({...historyFormData, description: e.target.value})}
                          placeholder="Descreva o que aconteceu..."
                        />
                      </div>
                      <Button onClick={handleAddHistory} className="w-full">
                        Adicionar Interação
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Nova Nota
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Nota</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Conteúdo da Nota</Label>
                        <Textarea
                          value={noteFormData.content}
                          onChange={(e) => setNoteFormData({...noteFormData, content: e.target.value})}
                          placeholder="Escreva sua nota..."
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleAddNote} className="w-full">
                        Salvar Nota
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Client History */}
              {clientHistory[selectedClient.id] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Interações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {clientHistory[selectedClient.id].map((item) => {
                        const Icon = getActionIcon(item.action);
                        return (
                          <div key={item.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                            <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Client Notes */}
              {notes.filter(n => n.client_id === selectedClient.id).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {notes
                        .filter(n => n.client_id === selectedClient.id)
                        .map((note) => (
                          <div key={note.id} className="p-2 bg-muted/50 rounded text-sm">
                            <p>{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(note.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Tasks Summary */}
      {tasks.filter(t => !t.done).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Pendentes ({tasks.filter(t => !t.done).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {tasks
                .filter(t => !t.done)
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                    <div className="flex-1">
                      <p>{task.txt}</p>
                      {task.quando && (
                        <p className="text-xs text-muted-foreground">📅 {task.quando}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await supabase
                          .from('conectaios_tasks')
                          .update({ done: true })
                          .eq('id', task.id);
                        fetchData();
                      }}
                    >
                      Concluir
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}