import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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
    category: 'geral'
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
      setTasks(data || []);
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
          onde: newTask.description,
          quem: '',
          done: false,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data]);
      setNewTask({
        title: '',
        description: '',
        date: '',
        time: '09:00',
        priority: 'media',
        category: 'geral'
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
      const today = new Date();
      let taskDate = today;
      
      // Se uma data foi especificada na voz, tentar processar
      if (voiceData.data && voiceData.data !== today.toISOString().split('T')[0]) {
        taskDate = new Date(voiceData.data);
      }

      const taskData = {
        title: voiceData.titulo || 'Nova tarefa',
        description: voiceData.descricao || '',
        date: taskDate.toISOString().split('T')[0],
        time: voiceData.hora || '09:00',
        priority: voiceData.prioridade || 'media',
        category: 'geral',
        user_id: user?.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('calendar_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data]);
      
      toast({
        title: "✅ Tarefa criada via voz",
        description: `"${data.title}" foi adicionada para ${format(taskDate, 'dd/MM/yyyy', { locale: ptBR })} às ${data.time}`,
      });
    } catch (error) {
      console.error('Error adding voice task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa via voz",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_tasks')
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
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-3">
          {days.map((day, index) => {
            const dayTasks = tasks.filter(task => 
              new Date(task.date).toDateString() === day.toDateString()
            );

            return (
              <div key={index} className="space-y-3">
                <div className="text-center pb-2 border-b">
                  <div className="text-sm font-semibold">
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                
                <div className="space-y-2 min-h-[200px]">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2 rounded-lg text-xs bg-primary/8 hover:bg-primary/15 border border-primary/10 cursor-pointer transition-all duration-200 shadow-sm"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="font-semibold text-primary mb-1">
                        {task.time}
                      </div>
                      <div className="text-foreground font-medium leading-relaxed">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-muted-foreground mt-1 text-[10px] leading-relaxed">
                          {task.description.length > 40 ? task.description.substring(0, 40) + '...' : task.description}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {dayTasks.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-4">
                      Sem tarefas
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
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Agenda Inteligente</h2>
          <Badge variant="secondary" className="px-2 py-1">
            {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsVoiceRecorderOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Mic className="h-4 w-4 mr-2" />
            Gravar Tarefa
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
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
                <Button onClick={handleAddTask} className="w-full">
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
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
      </div>

      {/* Navegação de vista */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>
            Mês
          </Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>
            Semana
          </Button>
          <Button variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>
            Dia
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(subDays(currentDate, view === 'month' ? 30 : view === 'week' ? 7 : 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[200px] text-center">
            {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            {view === 'week' && `${format(currentDate, 'dd MMM', { locale: ptBR })} - ${format(addDays(currentDate, 6), 'dd MMM yyyy', { locale: ptBR })}`}
            {view === 'day' && format(currentDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, view === 'month' ? 30 : view === 'week' ? 7 : 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Views */}
      {view === 'week' && <WeekView />}
      
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-2">
          {/* Render month view here */}
          <p className="col-span-7 text-center py-8 text-muted-foreground">
            Vista mensal em desenvolvimento
          </p>
        </div>
      )}
      
      {view === 'day' && (
        <div className="space-y-2">
          {/* Render day view here */}
          <p className="text-center py-8 text-muted-foreground">
            Vista diária em desenvolvimento
          </p>
        </div>
      )}

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