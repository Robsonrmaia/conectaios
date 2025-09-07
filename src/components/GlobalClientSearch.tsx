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
  updated_at: string;
  documents?: string[];
}

interface ClientHistory {
  id: string;
  action: string;
  description: string;
  created_at: string;
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

  const [editFormData, setEditFormData] = useState({
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
    try {
      const { data, error } = await supabase
        .from('conectaios_clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
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
      const { data, error } = await supabase
        .from('client_history')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientHistory(data || []);
    } catch (error) {
      console.error('Error fetching client history:', error);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setEditFormData({
      nome: client.nome,
      telefone: client.telefone,
      email: client.email || '',
      data_nascimento: client.data_nascimento || '',
      tipo: client.tipo,
      valor: client.valor.toString()
    });
    fetchClientHistory(client.id);
  };

  const handleEditClient = async () => {
    if (!selectedClient || !user) return;

    try {
      const { error } = await supabase
        .from('conectaios_clients')
        .update({
          nome: editFormData.nome,
          telefone: editFormData.telefone,
          email: editFormData.email,
          data_nascimento: editFormData.data_nascimento || null,
          tipo: editFormData.tipo,
          valor: parseFloat(editFormData.valor) || 0,
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
        ...editFormData,
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
        .from('client_history')
        .insert({
          client_id: selectedClient.id,
          action: historyFormData.action,
          description: historyFormData.description,
          user_id: user.id
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

      setHistoryFormData({ action: 'ligacao', description: '' });
      fetchClientHistory(selectedClient.id);
      fetchClients();

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
      'ligacao': Phone,
      'email': Mail,
      'reuniao': Calendar,
      'visita': User,
      'proposta': User,
      'contrato': User
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
                            <AvatarImage src={client.photo || undefined} />
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
                    <div>
                      <Label>Data de Nascimento</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editFormData.data_nascimento}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">
                          {selectedClient.data_nascimento || 'Não informado'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      {isEditing ? (
                        <Select value={editFormData.tipo} onValueChange={(value) => setEditFormData(prev => ({ ...prev, tipo: value }))}>
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
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{selectedClient.tipo}</p>
                      )}
                    </div>
                    <div>
                      <Label>Valor de Interesse</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editFormData.valor}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, valor: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">
                          R$ {selectedClient.valor.toLocaleString('pt-BR')}
                        </p>
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
                      {clientHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-2" />
                          Nenhum histórico encontrado
                        </div>
                      ) : (
                        clientHistory.map((item) => {
                          const IconComponent = getActionIcon(item.action);
                          return (
                            <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                              <IconComponent className="h-4 w-4 mt-1 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {item.action}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(item.created_at), { 
                                      addSuffix: true, 
                                      locale: ptBR 
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{item.description}</p>
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
                  <Search className="h-12 w-12 mx-auto mb-4" />
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