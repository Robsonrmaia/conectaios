import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Edit,
  Trash2,
  Bell,
  Tag,
  Mic
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VoiceTaskRecorder } from '@/components/VoiceTaskRecorder';
import { ClientSelect } from '@/components/ClientSelect';

import 'react-big-calendar/lib/css/react-big-calendar.css';

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  priority: 'baixa' | 'media' | 'alta';
  category: string;
  user_id: string;
  created_at: string;
  completed?: boolean;
  client_name?: string;
  client_phone?: string;
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'pt-BR': ptBR },
});

export default function SmartCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: '',
    time: '09:00',
    priority: 'media' as const,
    category: 'geral',
    client_name: '',
    client_phone: ''
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database schema to Task interface
      const mappedTasks = (data || []).map(dbTask => {
        const quandoParts = dbTask.quando ? dbTask.quando.split(' ') : ['', ''];
        const taskDate = quandoParts[0] || new Date().toISOString().split('T')[0];
        const taskTime = quandoParts[1] || '09:00';
        
        return {
          id: dbTask.id,
          title: dbTask.txt || 'Tarefa sem título',
          description: dbTask.porque || '',
          date: taskDate,
          time: taskTime,
          priority: 'media' as const,
          category: 'Geral',
          user_id: dbTask.user_id,
          created_at: dbTask.created_at,
          client_name: dbTask.quem || '',
          client_phone: ''  // Will be extracted from quem field if it contains phone
        };
      });
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tarefas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          txt: newTask.title,
          quando: `${newTask.date} ${newTask.time}`,
          porque: newTask.description,
          quem: newTask.client_name || '',
          onde: newTask.client_phone || '',
          responsavel: null,
          done: false,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Map database response back to Task interface
        const mappedTask = {
          id: data.id,
          title: data.txt,
          description: data.porque || '',
          date: data.quando?.split(' ')[0] || newTask.date,
          time: data.quando?.split(' ')[1] || newTask.time,
          priority: newTask.priority,
          category: newTask.category,
          user_id: data.user_id,
          created_at: data.created_at,
          client_name: data.quem || '',
          client_phone: data.onde || ''
        };

      setTasks(prev => [...prev, mappedTask]);
      setNewTask({
        title: '',
        description: '',
        date: '',
        time: '09:00',
        priority: 'media',
        category: 'geral',
        client_name: '',
        client_phone: ''
      });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Tarefa criada",
        description: "Nova tarefa adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive",
      });
    }
  };

  const handleVoiceTaskData = async (voiceData: any) => {
    try {
      console.log('Voice task data received:', voiceData);
      
      const today = new Date();
      let taskDate = today;
      
      // Parse date from voice data - fix date issues
      if (voiceData.data) {
        const voiceDate = new Date(voiceData.data);
        // Only use voice date if it's valid and not in the past (older than yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (voiceDate >= yesterday && !isNaN(voiceDate.getTime())) {
          taskDate = voiceDate;
        }
      }
      
      // Format time properly
      const taskTime = voiceData.hora || '09:00';
      
      // Create the complete quando field with date and time
      const quandoValue = `${taskDate.toISOString().split('T')[0]} ${taskTime}`;
      
      // Map Task interface to database schema
      const dbTaskData = {
        txt: voiceData.titulo || 'Nova tarefa por voz',
        porque: voiceData.descricao || '',
        quando: quandoValue,
        onde: voiceData.telefone || '',
        quem: voiceData.cliente || '',
        responsavel: null,
        done: false,
        user_id: user?.id
      };

      console.log('Inserting task data:', dbTaskData);

      const { data, error } = await supabase
        .from('tasks')
        .insert([dbTaskData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Task created successfully:', data);

      // Map back to Task interface for state
      const newTask = {
        id: data.id,
        title: data.txt,
        description: data.porque || '',
        date: data.quando?.split(' ')[0] || taskDate.toISOString().split('T')[0],
        time: data.quando?.split(' ')[1] || taskTime,
        priority: (voiceData.prioridade as 'baixa' | 'media' | 'alta') || 'media',
        category: 'geral',
        user_id: data.user_id,
        created_at: data.created_at,
        client_name: data.quem || '',
        client_phone: data.onde || ''
      };

      setTasks(prev => [...prev, newTask]);
      
      toast({
        title: "✅ Tarefa criada via voz",
        description: `"${newTask.title}" foi adicionada para ${format(taskDate, 'dd/MM/yyyy', { locale: ptBR })} às ${newTask.time}`,
      });
    } catch (error) {
      console.error('Error adding voice task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa via voz. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      setSelectedTask(null);
      
      toast({
        title: "Tarefa excluída",
        description: "Tarefa removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tarefa",
        variant: "destructive",
      });
    }
  };

  // Filtrar tarefas baseado nos filtros ativos
  const filteredTasks = tasks.filter(task => {
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    return true;
  });

  // WeekView melhorada
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2 h-[400px] sm:h-[600px]">
        {/* Header com dias da semana */}
        {days.map((day) => (
          <div key={day.toISOString()} className="p-1 sm:p-2 border-b font-medium text-center bg-muted/50">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {format(day, 'EEE', { locale: ptBR })}
            </div>
            <div className="text-sm sm:text-lg font-semibold">
              {format(day, 'd', { locale: ptBR })}
            </div>
          </div>
        ))}
        
        {/* Tarefas para cada dia */}
        {days.map((day) => {
          const dayTasks = filteredTasks.filter(task => 
            format(new Date(task.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );
          
          return (
            <div 
              key={`tasks-${day.toISOString()}`} 
              onClick={() => {
                // Adicionar tarefa quando clica em célula vazia
                if (dayTasks.length === 0) {
                  setNewTask(prev => ({
                    ...prev,
                    date: format(day, 'yyyy-MM-dd'),
                    time: '09:00'
                  }));
                  setIsAddDialogOpen(true);
                }
              }}
              className="p-1 sm:p-2 space-y-1 overflow-y-auto cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(task);
                  }}
                  className={`p-1 sm:p-2 rounded text-xs cursor-pointer transition-colors ${
                    task.priority === 'alta' 
                      ? 'bg-red-100 border-l-2 border-red-500 hover:bg-red-200' 
                      : task.priority === 'media'
                      ? 'bg-yellow-100 border-l-2 border-yellow-500 hover:bg-yellow-200'
                      : 'bg-green-100 border-l-2 border-green-500 hover:bg-green-200'
                  }`}
                >
                  <div className="font-medium truncate">{task.title}</div>
                  {task.time && (
                    <div className="text-muted-foreground mt-1 hidden sm:block">
                      {task.time}
                    </div>
                  )}
                </div>
              ))}
              {dayTasks.length === 0 && (
                <div className="text-xs text-muted-foreground/60 text-center py-2">
                  + Nova tarefa
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const days = [];
    let currentDay = calendarStart;
    
    while (currentDay <= calendarEnd) {
      days.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }

    return (
      <div>
        {/* Header com dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayTasks = filteredTasks.filter(task => 
              format(new Date(task.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            );
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  // Abrir modal com data pré-preenchida quando clica em célula vazia
                  if (dayTasks.length === 0) {
                    setNewTask(prev => ({
                      ...prev,
                      date: format(day, 'yyyy-MM-dd'),
                      time: '09:00'
                    }));
                    setIsAddDialogOpen(true);
                  }
                }}
                className={`p-1 border rounded h-[60px] overflow-hidden cursor-pointer transition-colors ${
                  isCurrentMonth ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                } ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <div className={`text-sm mb-1 ${
                  isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                } ${isToday ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 1).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      className={`text-xs p-1 rounded cursor-pointer truncate ${
                        task.priority === 'alta' 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : task.priority === 'media'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 1 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayTasks.length - 1}
                    </div>
                  )}
                  {dayTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground/60 text-center pt-2">
                      + Adicionar
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const DayView = () => {
    const dayTasks = filteredTasks.filter(task => 
      format(new Date(task.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="h-[600px] overflow-y-auto">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold">
            {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
        
        <div className="space-y-1">
          {hours.map((hour) => {
            const hourTasks = dayTasks.filter(task => {
              if (!task.time) return hour === 9; // Tarefas sem horário aparecem às 9h
              const taskHour = parseInt(task.time.split(':')[0]);
              return taskHour === hour;
            });

            return (
              <div key={hour} className="flex border-b">
                <div className="w-16 p-2 text-sm text-muted-foreground text-right">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div 
                  className="flex-1 p-2 min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    if (hourTasks.length === 0) {
                      setNewTask(prev => ({
                        ...prev,
                        date: format(currentDate, 'yyyy-MM-dd'),
                        time: `${hour.toString().padStart(2, '0')}:00`
                      }));
                      setIsAddDialogOpen(true);
                    }
                  }}
                >
                  {hourTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      className={`p-2 rounded mb-1 cursor-pointer ${
                        task.priority === 'alta' 
                          ? 'bg-red-100 border-l-4 border-red-500' 
                          : task.priority === 'media'
                          ? 'bg-yellow-100 border-l-4 border-yellow-500'
                          : 'bg-green-100 border-l-4 border-green-500'
                      }`}
                    >
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </div>
                      )}
                      {task.time && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.time}
                        </div>
                      )}
                    </div>
                  ))}
                  {hourTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground/60 text-center py-4">
                      + Nova tarefa às {hour.toString().padStart(2, '0')}:00
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold">Agenda Inteligente</h2>
          <Badge variant="secondary" className="px-2 py-1">
            {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Ligar para cliente..."
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={newTask.time}
                    onChange={(e) => setNewTask(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              {/* Cliente Selection */}
              <div>
                <Label>Cliente (Opcional)</Label>
                <ClientSelect
                  value={newTask.client_name}
                  onValueChange={(clientName) => {
                    setNewTask(prev => ({ 
                      ...prev, 
                      client_name: clientName
                    }));
                  }}
                  placeholder="Buscar cliente..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Prioridade</Label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={newTask.category}
                    onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: vendas, visitas..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cliente (opcional)</Label>
                  <ClientSelect
                    value={newTask.client_name}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, client_name: value }))}
                  />
                </div>
                <div>
                  <Label>Telefone (opcional)</Label>
                  <Input
                    value={newTask.client_phone}
                    onChange={(e) => setNewTask(prev => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <Button onClick={handleAddTask} className="w-full">
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => setIsVoiceRecorderOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
        >
          <Mic className="h-4 w-4 mr-2" />
          Gravar Tarefa
        </Button>
      </div>

      {/* Navegação de vista */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto">
          <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')} size="sm">
            Mês
          </Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')} size="sm">
            Semana
          </Button>
          <Button variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')} size="sm">
            Dia
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(subDays(currentDate, view === 'month' ? 30 : view === 'week' ? 7 : 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-center text-sm sm:text-base min-w-[150px] sm:min-w-[200px]">
            {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            {view === 'week' && `${format(currentDate, 'dd MMM', { locale: ptBR })} - ${format(addDays(currentDate, 6), 'dd MMM yyyy', { locale: ptBR })}`}
            {view === 'day' && format(currentDate, "dd 'de' MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, view === 'month' ? 30 : view === 'week' ? 7 : 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Views */}
      {view === 'week' && <WeekView />}
      
      {view === 'month' && <MonthView />}
      
      {view === 'day' && <DayView />}

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-muted-foreground">{selectedTask.description || 'Sem descrição'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <p className="text-sm">{format(new Date(selectedTask.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <Label>Hora</Label>
                  <p className="text-sm">{selectedTask.time}</p>
                </div>
              </div>
              {selectedTask.client_name && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <p className="text-sm">{selectedTask.client_name}</p>
                  </div>
                  {selectedTask.client_phone && (
                    <div>
                      <Label>Telefone</Label>
                      <p className="text-sm">{selectedTask.client_phone}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <Badge variant={selectedTask.priority === 'alta' ? 'destructive' : selectedTask.priority === 'media' ? 'default' : 'secondary'}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <p className="text-sm">{selectedTask.category}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingTask(selectedTask)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteTask(selectedTask.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Voice Task Recorder */}
      <VoiceTaskRecorder
        isOpen={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onTaskData={handleVoiceTaskData}
      />
    </div>
  );
}