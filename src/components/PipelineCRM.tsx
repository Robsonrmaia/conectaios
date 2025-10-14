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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, UserPlus, User, Phone, Calendar, CheckCircle, XCircle, Clock, Target, Star, FileText, Edit, Search, Mail, MapPin, MessageSquare, Cake, History as HistoryIcon, Mic, Building, Map as MapIcon, Briefcase, Heart, Users, Send } from 'lucide-react';
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
  valor: number;
  photo?: string;
  created_at: string;
  score: number;
  updated_at: string;
  broker_id?: string;
  user_id?: string;
  historico?: any[];
}

interface ClientHistory {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id?: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  client_id: string;
}

const STAGES = [
  { 
    id: 'novo_lead', 
    name: 'Novo Lead', 
    icon: UserPlus,
    gradient: 'from-slate-500/10 to-slate-600/5',
    color: 'text-slate-700 dark:text-slate-300',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
  },
  { 
    id: 'qualificado', 
    name: 'Qualificado', 
    icon: Target,
    gradient: 'from-blue-500/10 to-blue-600/5',
    color: 'text-blue-700 dark:text-blue-300',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
  },
  { 
    id: 'proposta', 
    name: 'Proposta', 
    icon: FileText,
    gradient: 'from-yellow-500/10 to-yellow-600/5',
    color: 'text-yellow-700 dark:text-yellow-300',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
  },
  { 
    id: 'negociacao', 
    name: 'Negociação', 
    icon: MessageSquare,
    gradient: 'from-orange-500/10 to-orange-600/5',
    color: 'text-orange-700 dark:text-orange-300',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
  },
  { 
    id: 'finalizado', 
    name: 'Finalizado', 
    icon: CheckCircle,
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    color: 'text-emerald-700 dark:text-emerald-300',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
  },
  { 
    id: 'perdido', 
    name: 'Perdido', 
    icon: XCircle,
    gradient: 'from-red-500/10 to-red-600/5',
    color: 'text-red-700 dark:text-red-300',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
  }
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
    valor: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    indicacao: '',
    profissao: '',
    estado_civil: '',
    observacoes: ''
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
        .from('clients')
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
        .from('crm_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setTasks(tasksData || []);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('crm_notes') // Use actual table name
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setNotes((notesData as any) || []);

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
        .from('clients')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
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
          ? { ...client, stage: newStage, updated_at: new Date().toISOString() }
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
        .from('clients')
        .insert({
          user_id: user.id,
          nome: clientFormData.nome,
          telefone: clientFormData.telefone,
          email: clientFormData.email || null,
          tipo: clientFormData.tipo,
          valor: parseFloat(clientFormData.valor) || 0,
          stage: 'novo_lead',
          score: 0,
          endereco: clientFormData.endereco || null,
          cidade: clientFormData.cidade || null,
          estado: clientFormData.estado || null,
          cep: clientFormData.cep || null,
          indicacao: clientFormData.indicacao || null,
          profissao: clientFormData.profissao || null,
          estado_civil: clientFormData.estado_civil || null,
          observacoes: clientFormData.observacoes || null
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
      setClientFormData({ 
        nome: '', 
        telefone: '', 
        email: '', 
        data_nascimento: '', 
        tipo: 'comprador', 
        valor: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        indicacao: '',
        profissao: '',
        estado_civil: '',
        observacoes: ''
      });
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
        parseFloat(String(voiceData.valor || voiceData.budget || voiceData.orcamento).replace(/\D/g, '')) || 0 : 0,
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      indicacao: '',
      profissao: '',
      estado_civil: '',
      observacoes: ''
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
        .from('clients')
        .update({ updated_at: new Date().toISOString() })
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
        .from('crm_tasks')
        .insert({
          user_id: user.id,
          title: taskFormData.txt,
          description: taskFormData.porque,
          due_date: taskFormData.quando,
          status: 'pending'
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
        .from('crm_notes')
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
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">Pipeline CRM</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setGlobalSearchOpen(true)}
            variant="outline"
            className="w-full sm:w-auto min-h-[44px] touch-target"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar Clientes
          </Button>
          <Button 
            onClick={() => setIsVoiceRecorderOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto min-h-[44px] touch-target"
          >
            <Mic className="h-4 w-4 mr-2" />
            Gravar Cliente
          </Button>
          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto min-h-[44px] touch-target">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleAddClient(); }} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={clientFormData.nome}
                    onChange={(e) => setClientFormData({...clientFormData, nome: e.target.value})}
                    required
                    placeholder="Nome completo do cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={clientFormData.telefone}
                    onChange={(e) => setClientFormData({...clientFormData, telefone: e.target.value})}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={clientFormData.email}
                    onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                    type="email"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    value={clientFormData.data_nascimento}
                    onChange={(e) => setClientFormData({...clientFormData, data_nascimento: e.target.value})}
                    type="date"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Interesse</Label>
                  <Select value={clientFormData.tipo} onValueChange={(value) => setClientFormData({...clientFormData, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprador">Comprador</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="locatario">Locatário</SelectItem>
                      <SelectItem value="investidor">Investidor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="valor">Valor de Interesse (R$)</Label>
                  <Input
                    id="valor"
                    value={clientFormData.valor}
                    onChange={(e) => setClientFormData({...clientFormData, valor: e.target.value})}
                    type="number"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações Iniciais (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={historyFormData.description}
                    onChange={(e) => setHistoryFormData({...historyFormData, description: e.target.value})}
                    placeholder="Primeiras impressões, necessidades específicas..."
                  />
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
      <TooltipProvider>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:gap-4 min-w-max md:min-w-0">
          {STAGES.map((stage) => {
            const stageClients = clients.filter(c => c.stage === stage.id);
            const totalValue = stageClients.reduce((acc, c) => acc + c.valor, 0);
            const avgDays = stageClients.length > 0 
              ? Math.round(stageClients.reduce((acc, c) => {
                  const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  return acc + days;
                }, 0) / stageClients.length)
              : 0;
            
            return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <Card className={`
                    min-w-[280px] md:min-w-0 w-[280px] md:w-full h-fit flex-shrink-0
                    bg-gradient-to-br ${stage.gradient} border-2
                    ${snapshot.isDraggingOver ? 'border-primary shadow-lg scale-[1.02]' : 'border-transparent'}
                    transition-all duration-300
                  `}>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stage.gradient}`}>
                            <stage.icon className={`h-4 w-4 ${stage.color}`} />
                          </div>
                          <CardTitle className={`text-sm font-bold ${stage.color}`}>
                            {stage.name}
                          </CardTitle>
                        </div>
                        <Badge className={`${stage.badgeColor} font-semibold transition-transform hover:scale-110`}>
                          {stageClients.length}
                        </Badge>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full bg-gradient-to-r ${stage.gradient} transition-all duration-500`}
                          style={{ 
                            width: `${Math.min(100, (totalValue / 1000000) * 100)}%` 
                          }}
                        />
                      </div>
                      {/* KPIs */}
                      <div className="flex items-center justify-between text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`flex items-center gap-1 font-semibold ${stage.color}`}>
                              💰 {totalValue > 0 ? `R$ ${(totalValue / 1000).toFixed(0)}k` : 'R$ 0'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Valor total: R$ {totalValue.toLocaleString('pt-BR')}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`flex items-center gap-1 text-muted-foreground ${avgDays > 14 ? 'text-red-500' : ''}`}>
                              ⏱️ {avgDays}d
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tempo médio no stage: {avgDays} dias</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardHeader>
                  <CardContent className="space-y-3 pt-4" {...provided.droppableProps} ref={provided.innerRef}>
                    {stageClients.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                        <div className={`p-3 rounded-full bg-gradient-to-br ${stage.gradient}`}>
                          <stage.icon className={`h-6 w-6 ${stage.color} opacity-50`} />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Nenhum cliente aqui ainda
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Arraste um card para cá
                        </p>
                      </div>
                    )}
                    {stageClients.map((client, index) => {
                      const daysSinceUpdate = Math.floor((Date.now() - new Date(client.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <Draggable key={client.id} draggableId={client.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                group relative p-4 rounded-2xl cursor-grab overflow-hidden
                                backdrop-blur-xl bg-gradient-to-br from-card/95 via-card/90 to-card/85
                                border border-border/50
                                shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]
                                hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.12)]
                                hover:scale-[1.02] hover:-translate-y-2
                                active:cursor-grabbing active:scale-[0.98]
                                transition-all duration-500 ease-out
                                before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none
                                ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-2 border-primary ring-2 ring-primary/50' : ''}
                              `}
                              onClick={() => setSelectedClient(client)}
                            >
                              {/* Badge de temperatura no canto com backdrop blur */}
                              <div className="absolute -top-2 -right-2 z-20">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {(() => {
                                      if (daysSinceUpdate <= 2) return (
                                        <div className="relative">
                                          <div className="absolute inset-0 bg-red-500 rounded-full blur-lg animate-pulse" />
                                          <Badge className="relative bg-red-500 text-white shadow-2xl backdrop-blur-sm border border-white/20">
                                            <span className="animate-pulse">🔥</span>
                                          </Badge>
                                        </div>
                                      );
                                      if (daysSinceUpdate <= 7) return (
                                        <Badge className="bg-orange-500 text-white shadow-xl backdrop-blur-sm border border-white/20">
                                          ☀️
                                        </Badge>
                                      );
                                      return (
                                        <Badge className="bg-blue-400 text-white shadow-lg backdrop-blur-sm border border-white/20">
                                          ❄️
                                        </Badge>
                                      );
                                    })()}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {daysSinceUpdate === 0 ? 'Atualizado hoje' :
                                       daysSinceUpdate === 1 ? 'Atualizado ontem' :
                                       `Atualizado há ${daysSinceUpdate} dias`}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>

                              {/* VIP Badge no topo esquerdo com shadow glow */}
                              {client.valor > 500000 && (
                                <div className="absolute -top-2 -left-2 z-20">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full blur-xl opacity-75" />
                                        <Badge className="relative bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold shadow-2xl backdrop-blur-sm border border-yellow-200/30 animate-pulse">
                                          <Star className="h-3 w-3 mr-1 fill-white" />
                                          VIP
                                        </Badge>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cliente Premium - Valor acima de R$ 500k</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}

                              {/* Conteúdo Principal - 4 Camadas */}
                              <div className="space-y-3">
                                {/* Camada 1: Identificação */}
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-lg transition-transform group-hover:scale-110 ring-2 ring-background">
                                    <AvatarImage src={client.photo || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                                      {client.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors cursor-default">
                                            {client.nome}
                                          </h4>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="font-semibold">{client.nome}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      {client.score > 0 && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-xs font-bold shrink-0 border-primary/30">
                                              {client.score}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Score de qualificação: {client.score}/100</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                    
                                    {/* Telefone */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
                                          <Phone className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{client.telefone}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{client.telefone}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                
                                {/* Camada 2: Metadata */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs font-medium">
                                    {client.tipo === 'comprador' && '🏠 Comprador'}
                                    {client.tipo === 'vendedor' && '💰 Vendedor'}
                                    {client.tipo === 'locatario' && '🔑 Locatário'}
                                    {client.tipo === 'investidor' && '📈 Investidor'}
                                  </Badge>
                                  {client.email && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="text-xs">
                                          <Mail className="h-3 w-3" />
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-[200px] truncate">{client.email}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {client.data_nascimento && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="text-xs">
                                          <Cake className="h-3 w-3" />
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Aniversário: {new Date(client.data_nascimento).toLocaleDateString('pt-BR')}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                
                                {/* Camada 3: Dados Comerciais */}
                                {client.valor > 0 && (
                                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        R$ {client.valor.toLocaleString('pt-BR')}
                                      </span>
                                    </div>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="text-xs">
                                          {daysSinceUpdate === 0 ? 'Hoje' :
                                           daysSinceUpdate === 1 ? 'Ontem' :
                                           `${daysSinceUpdate}d atrás`}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Última interação há {daysSinceUpdate} dias</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                )}
                              </div>
                              
                              {/* Camada 4: Quick Actions (hover) */}
                              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background/95 to-transparent 
                                            opacity-0 group-hover:opacity-100 transition-all duration-300 
                                            flex items-center justify-center gap-2 rounded-b-2xl backdrop-blur-sm">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 px-2 hover:bg-green-500/20 hover:text-green-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://wa.me/55${client.telefone.replace(/\D/g, '')}`, '_blank');
                                      }}
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>WhatsApp</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 px-2 hover:bg-blue-500/20 hover:text-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (client.email) window.location.href = `mailto:${client.email}`;
                                      }}
                                      disabled={!client.email}
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Email</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 px-2 hover:bg-purple-500/20 hover:text-purple-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsTaskDialogOpen(true);
                                      }}
                                    >
                                      <Calendar className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Agendar</TooltipContent>
                                </Tooltip>
                              </div>
                              
                              {/* Indicador visual de drag */}
                              <div className="absolute inset-0 border-2 border-dashed border-primary rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
                            </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                  </CardContent>
                  </Card>
                )}
              </Droppable>
            );
          })}
          </div>
        </div>
      </DragDropContext>
      </TooltipProvider>

      {/* Tasks Section Premium */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-primary/10 shadow-inner">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <span>Tarefas Pendentes</span>
              {tasks.filter(task => task.status === 'pending').length > 0 && (
                <Badge className="bg-primary text-primary-foreground shadow-lg animate-pulse">
                  {tasks.filter(task => task.status === 'pending').length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsTaskDialogOpen(true)} className="shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {tasks.filter(task => task.status === 'pending').slice(0, 5).map((task) => {
              const isUrgent = task.due_date && new Date(task.due_date) < new Date(Date.now() + 24 * 60 * 60 * 1000);
              const isToday = task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString();
              const priorityColor = task.priority === 'high' ? 'border-red-500' : task.priority === 'medium' ? 'border-yellow-500' : 'border-green-500';
              const linkedClient = task.client_id ? clients.find(c => c.id === task.client_id) : null;
              
              return (
                <div 
                  key={task.id} 
                  className={`group relative flex items-center gap-3 p-4 rounded-xl border-l-4 ${priorityColor} 
                             bg-card/50 backdrop-blur-sm hover:bg-card border border-border/50
                             hover:shadow-xl hover:scale-[1.01] transition-all duration-300`}
                >
                  {/* Avatar do Cliente vinculado */}
                  {linkedClient && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-md cursor-default">
                            <AvatarImage src={linkedClient.photo || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-semibold">
                              {linkedClient.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{linkedClient.nome}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">
                        {task.title}
                      </p>
                      {(isUrgent || isToday) && (
                        <Badge variant="destructive" className="text-xs shrink-0 animate-pulse">
                          {isToday ? 'Hoje' : 'Urgente'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                      {task.priority && (
                        <Badge variant="outline" className="text-xs">
                          {task.priority === 'high' ? '🔴 Alta' : 
                           task.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 rounded-full hover:bg-emerald-500 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {tasks.filter(task => task.status === 'pending').length === 0 && (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    Tudo pronto! 🎉
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa pendente no momento
                  </p>
                </div>
              </div>
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
                          {selectedClient.updated_at 
                            ? formatDistanceToNow(new Date(selectedClient.updated_at), { 
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
                    
                    {((selectedClient as any).endereco || (selectedClient as any).cidade || (selectedClient as any).profissao) && (
                      <>
                        <Separator className="my-4" />
                        
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedClient as any).endereco && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                Endereço
                              </label>
                              <p className="text-sm text-muted-foreground">{(selectedClient as any).endereco}</p>
                            </div>
                          )}
                          
                          {(selectedClient as any).cidade && (
                            <div>
                              <label className="text-sm font-medium">Cidade</label>
                              <p className="text-sm text-muted-foreground">
                                {(selectedClient as any).cidade}{(selectedClient as any).estado ? ` - ${(selectedClient as any).estado}` : ''}
                              </p>
                            </div>
                          )}
                          
                          {(selectedClient as any).cep && (
                            <div>
                              <label className="text-sm font-medium">CEP</label>
                              <p className="text-sm text-muted-foreground">{(selectedClient as any).cep}</p>
                            </div>
                          )}
                          
                          {(selectedClient as any).profissao && (
                            <div>
                              <label className="text-sm font-medium">Profissão</label>
                              <p className="text-sm text-muted-foreground">{(selectedClient as any).profissao}</p>
                            </div>
                          )}
                          
                          {(selectedClient as any).estado_civil && (
                            <div>
                              <label className="text-sm font-medium">Estado Civil</label>
                              <p className="text-sm text-muted-foreground">{(selectedClient as any).estado_civil}</p>
                            </div>
                          )}
                          
                          {(selectedClient as any).indicacao && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Indicação</label>
                              <p className="text-sm text-muted-foreground">{(selectedClient as any).indicacao}</p>
                            </div>
                          )}
                          
                          {(selectedClient as any).observacoes && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Observações</label>
                              <p className="text-sm text-muted-foreground">{(selectedClient as any).observacoes}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
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
                  
                  <Separator className="my-6" />

                  <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold">Informações Complementares</h4>
                    <Badge variant="secondary" className="ml-auto">Opcional</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="endereco" className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Endereço
                      </Label>
                      <Input
                        id="endereco"
                        value={clientFormData.endereco}
                        onChange={(e) => setClientFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        placeholder="Rua, número, bairro"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cidade" className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-primary" />
                        Cidade
                      </Label>
                      <Input
                        id="cidade"
                        value={clientFormData.cidade}
                        onChange={(e) => setClientFormData(prev => ({ ...prev, cidade: e.target.value }))}
                        placeholder="São Paulo"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="estado" className="flex items-center gap-2">
                        <MapIcon className="h-3.5 w-3.5 text-primary" />
                        Estado
                      </Label>
                      <Select value={clientFormData.estado} onValueChange={(value) => setClientFormData(prev => ({ ...prev, estado: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="cep" className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        CEP
                      </Label>
                      <Input
                        id="cep"
                        value={clientFormData.cep}
                        onChange={(e) => setClientFormData(prev => ({ ...prev, cep: e.target.value }))}
                        placeholder="00000-000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="profissao" className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        Profissão
                      </Label>
                      <Input
                        id="profissao"
                        value={clientFormData.profissao}
                        onChange={(e) => setClientFormData(prev => ({ ...prev, profissao: e.target.value }))}
                        placeholder="Ex: Empresário"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="estado_civil" className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5 text-primary" />
                        Estado Civil
                      </Label>
                      <Select value={clientFormData.estado_civil} onValueChange={(value) => setClientFormData(prev => ({ ...prev, estado_civil: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        <SelectItem value="uniao_estavel">União Estável</SelectItem>
                      </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="indicacao" className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        Como nos conheceu?
                      </Label>
                      <Input
                        id="indicacao"
                        value={clientFormData.indicacao}
                        onChange={(e) => setClientFormData(prev => ({ ...prev, indicacao: e.target.value }))}
                        placeholder="Ex: Indicação de fulano"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes" className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Observações Gerais
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={clientFormData.observacoes}
                      onChange={(e) => setClientFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Anotações importantes sobre o cliente..."
                      rows={3}
                    />
                    </div>
                  </div>
                </Card>
                </div>
              </ScrollArea>
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