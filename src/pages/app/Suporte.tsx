import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { SupportTickets } from "@/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SupportTicket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export default function Suporte() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    body: "",
    priority: "normal"
  });
  const { user } = useAuth();

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await SupportTickets.list(user.id);
      
      const mappedTickets: SupportTicket[] = (data || []).map((item: any) => ({
        id: item.id,
        subject: item.subject,
        body: item.body,
        status: item.status,
        priority: item.priority,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setTickets(mappedTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!user) return;

    if (!newTicket.subject.trim() || !newTicket.body.trim()) {
      toast.error("Assunto e descrição são obrigatórios");
      return;
    }

    try {
      await SupportTickets.create({
        ...newTicket,
        user_id: user.id
      });

      setNewTicket({
        subject: "",
        body: "",
        priority: "normal"
      });
      setShowCreateDialog(false);
      loadTickets();
      toast.success("Ticket criado com sucesso!");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Erro ao criar ticket");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'default';
      case 'closed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'in_progress':
        return 'Em Andamento';
      case 'closed':
        return 'Fechado';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'secondary';
      case 'normal':
        return 'default';
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Baixa';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'Alta';
      default:
        return priority;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Central de Suporte
          </h1>
          <p className="text-muted-foreground">
            Abra tickets e acompanhe suas solicitações de suporte
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Assunto do ticket"
                value={newTicket.subject}
                onChange={(e) =>
                  setNewTicket(prev => ({ ...prev, subject: e.target.value }))
                }
              />
              
              <Textarea
                placeholder="Descreva detalhadamente o problema ou solicitação..."
                value={newTicket.body}
                onChange={(e) =>
                  setNewTicket(prev => ({ ...prev, body: e.target.value }))
                }
                rows={6}
              />

              <Select
                value={newTicket.priority}
                onValueChange={(value) =>
                  setNewTicket(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={createTicket} className="w-full">
                Criar Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="truncate">{ticket.subject}</span>
                <div className="flex flex-col gap-1">
                  <Badge variant={getStatusColor(ticket.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      {getStatusLabel(ticket.status)}
                    </div>
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {getPriorityLabel(ticket.priority)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {ticket.body}
                </p>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver Conversa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          Carregando tickets...
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro ticket de suporte para receber ajuda
            </p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Ticket
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona o suporte?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">1. Crie um ticket</h4>
                <p className="text-muted-foreground">
                  Descreva seu problema ou solicitação de forma detalhada
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">2. Receba resposta</h4>
                <p className="text-muted-foreground">
                  Nossa equipe irá analisar e responder seu ticket
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">3. Problema resolvido</h4>
                <p className="text-muted-foreground">
                  Acompanhe o status até a resolução completa
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}