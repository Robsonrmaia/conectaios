import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, isPast, isFuture, startOfWeek, endOfWeek, eachHourOfInterval, setHours, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Check,
  X,
  Target,
  Lightbulb,
  Star,
  AlertCircle,
  CheckCircle,
  Bell,
  Zap
} from 'lucide-react';

interface Task {
  id: string;
  txt: string;
  quando: string;
  onde: string;
  quem: string;
  done: boolean;
  created_at: string;
  responsavel?: string;
}

interface Client {
  id: string;
  nome: string;
  telefone: string;
  stage: string;
  last_contact_at: string;
}

export default function SmartCalendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  const [newTask, setNewTask] = useState({
    txt: '',
    quando: '',
    onde: '',
    quem: '',
    taskType: 'follow_up'
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [tasksResult, clientsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('conectaios_clients')
          .select('id, nome, telefone, stage, last_contact_at')
          .eq('user_id', user?.id)
          .order('last_contact_at', { ascending: true })
      ]);

      if (tasksResult.data) setTasks(tasksResult.data);
      if (clientsResult.data) setClients(clientsResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados da agenda');
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.quando) return false;
      try {
        const taskDate = new Date(task.quando);
        return isSameDay(taskDate, date);
      } catch {
        return false;
      }
    });
  };

  const getClientSuggestions = () => {
    const now = new Date();
    return clients
      .filter(client => {
        if (!client.last_contact_at) return true;
        const lastContact = new Date(client.last_contact_at);
        const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        
        // Suggest follow-up based on client stage
        switch (client.stage) {
          case 'novo_lead': return daysSinceContact >= 1;
          case 'em_negociacao': return daysSinceContact >= 2;  
          case 'proposta_enviada': return daysSinceContact >= 1;
          default: return daysSinceContact >= 7;
        }
      })
      .slice(0, 5);
  };

  const createTask = async () => {
    if (!newTask.txt.trim()) {
      toast.error('Título da tarefa é obrigatório');
      return;
    }

    try {
      const taskData = {
        user_id: user?.id,
        txt: newTask.txt,
        quando: newTask.quando,
        onde: newTask.onde || '',
        quem: newTask.quem || '',
        done: false
      };

      const { error } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (error) throw error;

      toast.success('Tarefa criada com sucesso!');
      setShowNewTask(false);
      setNewTask({ txt: '', quando: '', onde: '', quem: '', taskType: 'follow_up' });
      fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
    }
  };

  const createSuggestedTask = async (client: Client, type: string) => {
    const tomorrow = addDays(new Date(), 1);
    const taskText = type === 'follow_up' 
      ? `Follow-up com ${client.nome}`
      : `Visita agendada com ${client.nome}`;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user?.id,
          txt: taskText,
          quando: format(tomorrow, 'yyyy-MM-dd HH:mm'),
          quem: client.nome,
          onde: type === 'visit' ? 'A definir' : '',
          done: false
        }]);

      if (error) throw error;
      
      toast.success(`${type === 'follow_up' ? 'Follow-up' : 'Visita'} agendado!`);
      fetchData();
    } catch (error) {
      console.error('Error creating suggested task:', error);
      toast.error('Erro ao criar tarefa sugerida');
    }
  };

  const toggleTaskDone = async (taskId: string, done: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ done: !done })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(done ? 'Tarefa reaberta' : 'Tarefa concluída!');
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const getDaysInCurrentMonth = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  };

  const getTaskTypeColor = (task: Task) => {
    if (task.done) return 'bg-success/20 text-success border-success/30';
    if (task.quando && isPast(new Date(task.quando))) return 'bg-destructive/20 text-destructive border-destructive/30';
    return 'bg-primary/20 text-primary border-primary/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const suggestions = getClientSuggestions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agenda Inteligente</h2>
          <p className="text-muted-foreground">Gerencie seus compromissos e follow-ups</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título da Tarefa</Label>
                  <Input
                    value={newTask.txt}
                    onChange={(e) => setNewTask(prev => ({ ...prev, txt: e.target.value }))}
                    placeholder="Ex: Ligar para cliente..."
                  />
                </div>
                
                <div>
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={newTask.quando}
                    onChange={(e) => setNewTask(prev => ({ ...prev, quando: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Cliente/Pessoa</Label>
                  <Select value={selectedClient} onValueChange={(value) => {
                    setSelectedClient(value);
                    const client = clients.find(c => c.id === value);
                    if (client) {
                      setNewTask(prev => ({ ...prev, quem: client.nome }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Local (opcional)</Label>
                  <Input
                    value={newTask.onde}
                    onChange={(e) => setNewTask(prev => ({ ...prev, onde: e.target.value }))}
                    placeholder="Ex: Escritório, Imóvel XYZ..."
                  />
                </div>
                
                <Button onClick={createTask} className="w-full">
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="day">Dia</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="w-full pointer-events-auto"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getTasksForDate(selectedDate).length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhuma tarefa para este dia
                      </p>
                    ) : (
                      getTasksForDate(selectedDate).map(task => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border ${getTaskTypeColor(task)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1 line-clamp-2">{task.txt}</h4>
                              {task.quem && (
                                <div className="flex items-center gap-1 text-xs mb-1">
                                  <User className="h-3 w-3" />
                                  {task.quem}
                                </div>
                              )}
                              {task.onde && (
                                <div className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3" />
                                  {task.onde}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTaskDone(task.id, task.done)}
                            >
                              {task.done ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Sugestões IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestions.map(client => (
                        <div key={client.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{client.nome}</h4>
                              <p className="text-xs text-muted-foreground">
                                Stage: {client.stage}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Follow-up
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createSuggestedTask(client, 'follow_up')}
                              className="text-xs"
                            >
                              Agendar Follow-up
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createSuggestedTask(client, 'visit')}
                              className="text-xs"
                            >
                              Agendar Visita
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Vista semanal em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Vista diária em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Week View Component
interface WeekViewProps {
  selectedDate: Date;
  tasks: Task[];
  onDateSelect: (date: Date) => void;
  onCreateTask: (date: Date) => void;
  onToggleTask: (taskId: string, done: boolean) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ selectedDate, tasks, onDateSelect, onCreateTask, onToggleTask }) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.quando) return false;
      const taskDate = new Date(task.quando);
      return isSameDay(taskDate, date);
    });
  };

  const goToPrevWeek = () => {
    const prevWeek = new Date(selectedDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    onDateSelect(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    onDateSelect(nextWeek);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <Card 
              key={day.toISOString()} 
              className={`min-h-[200px] cursor-pointer transition-colors ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${isToday ? 'bg-primary/5' : ''}`}
              onClick={() => onDateSelect(day)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className={`text-lg ${isToday ? 'text-primary font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id}
                    className={`text-xs p-1 rounded cursor-pointer transition-opacity ${
                      task.done ? 'bg-green-100 text-green-800 line-through opacity-60' : 'bg-blue-100 text-blue-800'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id, !task.done);
                    }}
                  >
                    {task.txt.substring(0, 20)}...
                  </div>
                ))}
                
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayTasks.length - 3} mais
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTask(day);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nova
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Day View Component  
interface DayViewProps {
  selectedDate: Date;
  tasks: Task[];
  onDateSelect: (date: Date) => void;
  onCreateTask: (dateTime: Date) => void;
  onToggleTask: (taskId: string, done: boolean) => void;
}

const DayView: React.FC<DayViewProps> = ({ selectedDate, tasks, onDateSelect, onCreateTask, onToggleTask }) => {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  const hours = eachHourOfInterval({ start: setHours(dayStart, 8), end: setHours(dayEnd, 22) });

  const getTasksForHour = (hour: Date) => {
    return tasks.filter(task => {
      if (!task.quando || !task.onde) return false;
      const taskDate = new Date(task.quando);
      const taskHour = parseInt(task.onde.split(':')[0] || '0');
      return isSameDay(taskDate, selectedDate) && hour.getHours() === taskHour;
    });
  };

  const goToPrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateSelect(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateSelect(nextDay);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            {format(selectedDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-2 max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const hourTasks = getTasksForHour(hour);
          
          return (
            <Card key={hour.toISOString()} className="min-h-[60px]">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="text-sm font-medium text-muted-foreground min-w-[60px]">
                    {format(hour, 'HH:mm')}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {hourTasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`p-2 rounded border transition-opacity ${
                          task.done 
                            ? 'bg-green-50 text-green-800 line-through opacity-60 border-green-200' 
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{task.txt}</div>
                            {task.quem && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <User className="h-3 w-3 inline mr-1" />
                                {task.quem}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleTask(task.id, !task.done)}
                            className="h-6 w-6 p-0"
                          >
                            {task.done ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {hourTasks.length === 0 && (
                      <Button 
                        variant="ghost" 
                        className="w-full h-8 text-xs text-muted-foreground border-dashed border"
                        onClick={() => onCreateTask(hour)}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Agendar para {format(hour, 'HH:mm')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};