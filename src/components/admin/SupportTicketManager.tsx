import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  MessageSquare,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  category: string;
  user_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution?: string;
}

export default function SupportTicketManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolution, setResolution] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar chamados',
          variant: 'destructive'
        });
        return;
      }

      setTickets((data as SupportTicket[]) || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar chamados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };

      if (newStatus === 'resolvido' || newStatus === 'fechado') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolution = resolution;
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar chamado',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Chamado atualizado com sucesso'
      });

      fetchTickets();
      setSelectedTicket(null);
      setResolution('');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar chamado',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'destructive';
      case 'em_andamento': return 'default';
      case 'resolvido': return 'secondary';
      case 'fechado': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-200';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgente':
      case 'alta':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolvido':
      case 'fechado':
        return <CheckCircle className="h-4 w-4" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const stats = {
    total: tickets.length,
    aberto: tickets.filter(t => t.status === 'aberto').length,
    em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
    resolvido: tickets.filter(t => t.status === 'resolvido').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-500">{stats.aberto}</div>
                <div className="text-sm text-muted-foreground">Abertos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-500">{stats.em_andamento}</div>
                <div className="text-sm text-muted-foreground">Em Andamento</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.resolvido}</div>
                <div className="text-sm text-muted-foreground">Resolvidos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="aberto">Abertos</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="resolvido">Resolvidos</SelectItem>
              <SelectItem value="fechado">Fechados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum chamado encontrado</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'Não há chamados de suporte no momento.'
                  : `Não há chamados com status "${statusFilter}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">{ticket.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        ID: {ticket.user_id.slice(0, 8)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {ticket.category}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {getPriorityIcon(ticket.priority)}
                      <span className="ml-1 capitalize">{ticket.priority}</span>
                    </Badge>
                    <Badge variant={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {ticket.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                        className="flex-1 sm:flex-none"
                      >
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          {selectedTicket?.title}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedTicket && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={getStatusColor(selectedTicket.status)}>
                              {getStatusIcon(selectedTicket.status)}
                              <span className="ml-1 capitalize">
                                {selectedTicket.status.replace('_', ' ')}
                              </span>
                            </Badge>
                            <Badge className={getPriorityColor(selectedTicket.priority)}>
                              {getPriorityIcon(selectedTicket.priority)}
                              <span className="ml-1 capitalize">{selectedTicket.priority}</span>
                            </Badge>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Descrição:</h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                              {selectedTicket.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Categoria:</span>
                              <p className="text-muted-foreground capitalize">
                                {selectedTicket.category.replace('_', ' ')}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Criado em:</span>
                              <p className="text-muted-foreground">
                                {new Date(selectedTicket.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          {selectedTicket.resolution && (
                            <div>
                              <h4 className="font-medium mb-2">Resolução:</h4>
                              <p className="text-sm text-muted-foreground bg-green-50 p-3 rounded-lg border border-green-200">
                                {selectedTicket.resolution}
                              </p>
                            </div>
                          )}

                          {(selectedTicket.status === 'aberto' || selectedTicket.status === 'em_andamento') && (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">Resolução:</label>
                                <Textarea
                                  value={resolution}
                                  onChange={(e) => setResolution(e.target.value)}
                                  placeholder="Descreva como o problema foi resolvido..."
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                {selectedTicket.status === 'aberto' && (
                                  <Button
                                    onClick={() => updateTicketStatus(selectedTicket.id, 'em_andamento')}
                                    size="sm"
                                    variant="outline"
                                  >
                                    Marcar em Andamento
                                  </Button>
                                )}
                                <Button
                                  onClick={() => updateTicketStatus(selectedTicket.id, 'resolvido')}
                                  size="sm"
                                >
                                  Marcar como Resolvido
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {ticket.status === 'aberto' && (
                    <Button
                      onClick={() => updateTicketStatus(ticket.id, 'em_andamento')}
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                    >
                      Atender
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}