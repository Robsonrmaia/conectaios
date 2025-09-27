import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, User, Phone, Mail, Calendar, Edit, Save, X, Plus, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  tipo: string;
  stage: string;
  classificacao: string;
  valor: number;
  created_at: string;
  score: number;
  updated_at: string;
}

interface ClientHistory {
  id: string;
  type: string;
  description: string;
  created_at: string;
  actor: string;
}

interface GlobalClientSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalClientSearch({ open, onOpenChange }: GlobalClientSearchProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<ClientHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [editFormData, setEditFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    tipo: 'comprador',
    valor: ''
  });

  const [historyFormData, setHistoryFormData] = useState({
    action: 'ligacao',
    description: ''
  });

  useEffect(() => {
    if (open && user) {
      fetchClients();
    }
  }, [open, user]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = clients.filter(client =>
        client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefone.includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    if (!user?.id) return;

    try {
      // Buscar clientes reais do CRM
      const { data: crmClients, error } = await supabase
        .from('crm_clients')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (!error && crmClients) {
        const formattedClients = crmClients.map(client => ({
          id: client.id,
          nome: client.name,
          telefone: client.phone || '',
          email: client.email || '',
          tipo: 'Cliente CRM',
          stage: 'Ativo',
          classificacao: 'A',
          valor: 0,
          created_at: client.created_at,
          score: 100,
          updated_at: client.updated_at
        }));
        
        setClients(formattedClients);
        setFilteredClients(formattedClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientHistory = async (clientId: string) => {
    try {
      setLoadingHistory(true);
      
      // Buscar histórico através das tabelas CRM existentes
      const [notesResult, tasksResult, dealsResult] = await Promise.all([
        supabase.from('crm_notes').select('*').eq('client_id', clientId),
        supabase.from('crm_tasks').select('*').eq('client_id', clientId), 
        supabase.from('crm_deals').select('*').eq('client_id', clientId)
      ]);

      const history: ClientHistory[] = [
        ...(notesResult.data?.map(note => ({
          id: note.id,
          type: 'note',
          description: note.content || 'Nota adicionada',
          created_at: note.created_at,
          actor: 'Sistema'
        })) || []),
        ...(tasksResult.data?.map(task => ({
          id: task.id,
          type: 'task', 
          description: `Tarefa: ${task.title}`,
          created_at: task.created_at,
          actor: 'Sistema'
        })) || []),
        ...(dealsResult.data?.map(deal => ({
          id: deal.id,
          type: 'deal',
          description: `Negócio: ${deal.status}`,
          created_at: deal.created_at,
          actor: 'Sistema'
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setClientHistory(history);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setEditFormData({
      nome: client.nome,
      telefone: client.telefone,
      email: client.email || '',
      tipo: client.tipo,
      valor: client.valor.toString()
    });
    fetchClientHistory(client.id);
  };

  const handleEditClient = async () => {
    if (!selectedClient || !user) return;

    try {
      const { error } = await supabase
        .from('crm_clients')
        .update({
          name: editFormData.nome,
          phone: editFormData.telefone,
          email: editFormData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });

      setIsEditing(false);
      fetchClients();
      
      // Update selected client
      const updatedClient = {
        ...selectedClient,
        nome: editFormData.nome,
        telefone: editFormData.telefone,
        email: editFormData.email,
        valor: parseFloat(editFormData.valor) || 0
      };
      setSelectedClient(updatedClient);

    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente",
        variant: "destructive",
      });
    }
  };

  const handleAddHistory = async () => {
    if (!selectedClient || !user) return;

    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          client_id: selectedClient.id,
          content: `${historyFormData.action}: ${historyFormData.description}`,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Histórico adicionado!",
      });

      setHistoryFormData({ action: 'ligacao', description: '' });
      fetchClientHistory(selectedClient.id);

    } catch (error) {
      console.error('Error adding history:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar histórico",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    const icons: { [key: string]: any } = {
      'note': User,
      'task': Calendar,
      'deal': Mail,
      'ligacao': Phone,
      'email': Mail,
      'reuniao': Calendar,
      'visita': User
    };
    return icons[action] || User;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar e Gerenciar Clientes
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-full">
          {/* Lista de Clientes */}
          <div className="w-1/3 flex flex-col">
            <div className="mb-4">
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <Card
                      key={client.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedClient?.id === client.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{client.nome}</h4>
                            <p className="text-xs text-muted-foreground truncate">{client.telefone}</p>
                            <Badge variant="outline" className="text-xs">
                              {client.tipo}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Detalhes do Cliente */}
          <div className="flex-1 flex flex-col">
            {selectedClient ? (
              <Tabs defaultValue="detalhes" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="detalhes" className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{selectedClient.nome}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      {isEditing ? (
                        <Input
                          value={editFormData.nome}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, nome: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{selectedClient.nome}</p>
                      )}
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      {isEditing ? (
                        <Input
                          value={editFormData.telefone}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, telefone: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{selectedClient.telefone}</p>
                      )}
                    </div>
                    <div>
                      <Label>Email</Label>
                      {isEditing ? (
                        <Input
                          value={editFormData.email}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{selectedClient.email || 'Não informado'}</p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleEditClient} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="historico" className="flex-1 flex flex-col space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Adicionar Nova Interação</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
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
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddHistory} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Descreva a interação..."
                        value={historyFormData.description}
                        onChange={(e) => setHistoryFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-2"
                        rows={2}
                      />
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea className="flex-1">
                    <div className="space-y-3">
                      {loadingHistory ? (
                        <div className="text-center py-4">Carregando histórico...</div>
                      ) : clientHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-2" />
                          Nenhum histórico encontrado
                        </div>
                      ) : (
                        clientHistory.map((entry) => {
                          const Icon = getActionIcon(entry.type);
                          return (
                            <div key={entry.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="flex-shrink-0">
                                <div className="p-2 bg-primary/10 rounded-full">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{entry.type}</p>
                                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Por {entry.actor} • {new Date(entry.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>Selecione um cliente para ver os detalhes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}