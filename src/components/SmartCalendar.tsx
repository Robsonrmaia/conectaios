import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { CRM } from '@/data';
import { toast } from '@/hooks/use-toast';

interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  client_id?: string;
}

export default function SmartCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      const crmTasks = await CRM.tasks.list();
      
      const formattedTasks: CalendarTask[] = crmTasks.map(task => ({
        id: task.id,
        title: task.title || 'Tarefa sem título',
        description: task.description || '',
        due_date: task.due_date || new Date().toISOString(),
        status: task.status || 'pending',
        client_id: task.client_id || undefined
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.due_date) {
      toast({
        title: "Erro",
        description: "Título e data são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await CRM.tasks.create({
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date,
        user_id: null,
        client_id: null,
        priority: 'medium',
        status: 'pending'
      });

      setNewTask({ title: '', description: '', due_date: '' });
      fetchTasks();

      toast({
        title: "Sucesso",
        description: "Tarefa adicionada ao calendário!",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa",
        variant: "destructive",
      });
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agenda Inteligente</h2>
          <p className="text-muted-foreground">Gerencie suas tarefas e compromissos</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da tarefa"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da tarefa"
                  rows={3}
                />
              </div>
              <div>
                <Label>Data de Vencimento *</Label>
                <Input
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddTask} className="w-full">
                Adicionar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Tasks for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tarefas - {selectedDate?.toLocaleDateString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Carregando tarefas...</div>
            ) : selectedDateTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhuma tarefa para esta data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => (
                  <Card key={task.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge 
                          variant={task.status === 'done' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.status === 'done' ? 'Concluída' : 'Pendente'}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}