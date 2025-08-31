import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
import { User, Plus, Search, Phone, Mail, MapPin, Calendar, Home, MessageSquare, Target, Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  tipo: string;
  stage: string;
  classificacao: string;
  valor: number;
  photo?: string;
  created_at: string;
  score: number;
}

interface Pipeline {
  id: string;
  name: string;
  stages: string[] | any;
  is_default: boolean;
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

const defaultStages = ['novo_lead', 'qualificado', 'proposta', 'negociacao', 'finalizado', 'perdido'];

export default function CRM() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [clientFormData, setClientFormData] = useState({
    nome: '',
    telefone: '',
    tipo: 'comprador',
    valor: '',
    photo: ''
  });

  const [taskFormData, setTaskFormData] = useState({
    txt: '',
    quando: '',
    onde: '',
    porque: ''
  });

  const [noteFormData, setNoteFormData] = useState({
    content: '',
    client_id: ''
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
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch or create default pipeline
      const { data: pipelinesData, error: pipelinesError } = await supabase
        .from('pipelines')
        .select('*')
        .eq('user_id', user?.id);

      if (pipelinesError) throw pipelinesError;

      if (!pipelinesData || pipelinesData.length === 0) {
        // Create default pipeline
        const { data: newPipeline, error: createError } = await supabase
          .from('pipelines')
          .insert({
            user_id: user?.id,
            name: 'Pipeline Principal',
            stages: defaultStages,
            is_default: true
          })
          .select()
          .single();

        if (createError) throw createError;
        setPipelines([newPipeline]);
        setActivePipeline(newPipeline);
      } else {
        setPipelines(pipelinesData);
        const defaultPipeline = pipelinesData.find(p => p.is_default) || pipelinesData[0];
        setActivePipeline(defaultPipeline);
      }

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

  const handleAddClient = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          nome: clientFormData.nome,
          telefone: clientFormData.telefone,
          tipo: clientFormData.tipo,
          valor: parseFloat(clientFormData.valor) || 0,
          photo: clientFormData.photo,
          stage: 'novo_lead',
          classificacao: 'novo_lead',
          score: 0
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente adicionado com sucesso!",
      });

      setIsClientDialogOpen(false);
      setClientFormData({ nome: '', telefone: '', tipo: 'comprador', valor: '', photo: '' });
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

  const handleAddTask = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
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
        description: "Tarefa adicionada com sucesso!",
      });

      setIsTaskDialogOpen(false);
      setTaskFormData({ txt: '', quando: '', onde: '', porque: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!user || !noteFormData.client_id) return;

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          client_id: noteFormData.client_id,
          content: noteFormData.content
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Nota adicionada com sucesso!",
      });

      setIsNoteDialogOpen(false);
      setNoteFormData({ content: '', client_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar nota",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !activePipeline) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const clientId = draggableId;
    const newStage = destination.droppableId;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ stage: newStage })
        .eq('id', clientId);

      if (error) throw error;

      // Update local state
      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, stage: newStage } : client
      ));

      toast({
        title: "Sucesso",
        description: "Cliente movido no pipeline!",
      });
    } catch (error) {
      console.error('Error updating client stage:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover cliente",
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (taskId: string, done: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ done: !done })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, done: !done } : task
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
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

  const filteredClients = clients.filter(client =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telefone.includes(searchTerm)
  );

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
            <h1 className="text-3xl font-bold text-primary">CRM</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes, pipeline e tarefas
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clients.length}</div>
            <div className="text-sm text-muted-foreground">Total de Clientes</div>
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
              {tasks.filter(t => !t.done).length}
            </div>
            <div className="text-sm text-muted-foreground">Tarefas Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              R$ {clients.reduce((sum, c) => sum + (c.valor || 0), 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-muted-foreground">Valor Total Pipeline</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline Kanban</TabsTrigger>
          <TabsTrigger value="clientes">Clientes ({clients.length})</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas ({tasks.filter(t => !t.done).length})</TabsTrigger>
          <TabsTrigger value="notas">Notas ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          {activePipeline && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {activePipeline.stages.map((stage) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{getStageLabel(stage)}</h3>
                      <Badge variant="outline" className="text-xs">
                        {filteredClients.filter(c => c.stage === stage).length}
                      </Badge>
                    </div>
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-32 p-2 rounded-lg border-2 border-dashed ${
                            snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-muted'
                          }`}
                        >
                          {filteredClients
                            .filter(client => client.stage === stage)
                            .map((client, index) => (
                              <Draggable key={client.id} draggableId={client.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`mb-2 cursor-move ${
                                      snapshot.isDragging ? 'shadow-lg' : ''
                                    }`}
                                  >
                                    <CardHeader className="p-3">
                                      <CardTitle className="text-sm">{client.nome}</CardTitle>
                                      <CardDescription className="text-xs">
                                        {client.tipo} • {client.telefone}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                      <div className="flex items-center justify-between">
                                        <Badge className={`text-xs ${getStageColor(client.classificacao)}`}>
                                          {client.classificacao}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                          {[...Array(client.score)].map((_, i) => (
                                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          ))}
                                        </div>
                                      </div>
                                      {client.valor > 0 && (
                                        <div className="text-xs text-primary font-semibold mt-1">
                                          R$ {client.valor.toLocaleString('pt-BR')}
                                        </div>
                                      )}
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
          )}
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
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
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Cliente</DialogTitle>
                  <DialogDescription>Preencha as informações do cliente</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={clientFormData.nome}
                      onChange={(e) => setClientFormData({...clientFormData, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={clientFormData.telefone}
                      onChange={(e) => setClientFormData({...clientFormData, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
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
                        <SelectItem value="proprietario">Proprietário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="valor">Valor Interesse (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={clientFormData.valor}
                      onChange={(e) => setClientFormData({...clientFormData, valor: e.target.value})}
                      placeholder="500000"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsClientDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleAddClient} className="flex-1">
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{client.nome}</CardTitle>
                      <CardDescription>{client.tipo}</CardDescription>
                    </div>
                    <Badge className={getStageColor(client.stage)}>
                      {getStageLabel(client.stage)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {client.telefone}
                  </div>
                  {client.valor > 0 && (
                    <div className="text-lg font-semibold text-primary">
                      R$ {client.valor.toLocaleString('pt-BR')}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(client.score || 0)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tarefas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tarefas</h3>
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Tarefa</DialogTitle>
                  <DialogDescription>Método 5W para organizar tarefas</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="txt">O que? (What)</Label>
                    <Textarea
                      id="txt"
                      value={taskFormData.txt}
                      onChange={(e) => setTaskFormData({...taskFormData, txt: e.target.value})}
                      placeholder="Descreva a tarefa..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="quando">Quando? (When)</Label>
                    <Input
                      id="quando"
                      value={taskFormData.quando}
                      onChange={(e) => setTaskFormData({...taskFormData, quando: e.target.value})}
                      placeholder="Ex: Amanhã às 14h"
                    />
                  </div>
                  <div>
                    <Label htmlFor="onde">Onde? (Where)</Label>
                    <Input
                      id="onde"
                      value={taskFormData.onde}
                      onChange={(e) => setTaskFormData({...taskFormData, onde: e.target.value})}
                      placeholder="Ex: Escritório, cliente, online"
                    />
                  </div>
                  <div>
                    <Label htmlFor="porque">Por que? (Why)</Label>
                    <Input
                      id="porque"
                      value={taskFormData.porque}
                      onChange={(e) => setTaskFormData({...taskFormData, porque: e.target.value})}
                      placeholder="Ex: Fechar negócio, qualificar lead"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleAddTask} className="flex-1">
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className={`${task.done ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id, task.done)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className={`${task.done ? 'line-through' : ''}`}>{task.txt}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {task.quando && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {task.quando}
                          </div>
                        )}
                        {task.onde && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {task.onde}
                          </div>
                        )}
                        {task.porque && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {task.porque}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notas</h3>
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Nota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nota</DialogTitle>
                  <DialogDescription>Adicione uma nota para um cliente</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client_id">Cliente</Label>
                    <Select value={noteFormData.client_id} onValueChange={(value) => setNoteFormData({...noteFormData, client_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={noteFormData.content}
                      onChange={(e) => setNoteFormData({...noteFormData, content: e.target.value})}
                      placeholder="Digite sua nota..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleAddNote} className="flex-1">
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {notes.map((note) => {
              const client = clients.find(c => c.id === note.client_id);
              return (
                <Card key={note.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{client?.nome || 'Cliente não encontrado'}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {new Date(note.created_at).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{note.content}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}