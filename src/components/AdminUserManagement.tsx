import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/layout/ResponsiveTable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CRM } from '@/data';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Key,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

// Usar tipos da camada de dados unificada
interface Broker {
  id: string;
  name: string;
  email: string;
  status: string;
  user_id?: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'broker' | 'user';
  created_at?: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários",
          variant: "destructive",
        });
        return;
      }

      const mappedUsers: User[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        role: profile.role as 'admin' | 'broker' | 'user',
        created_at: profile.created_at || ''
      })) || [];

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    }
  };

  const fetchBrokers = async () => {
    try {
      const brokersWithProfiles = await CRM.brokers.listWithProfiles();
      
      // Map para interface esperada
      const mappedBrokers: Broker[] = brokersWithProfiles.map(broker => ({
        id: broker.id,
        name: broker.profile?.full_name || broker.profile?.email || 'Nome não disponível',
        email: broker.profile?.email || '',
        status: 'active',
        user_id: broker.user_id
      }));

      setBrokers(mappedBrokers);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar corretores",
        variant: "destructive",
      });
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchBrokers()]);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    try {
      // Call edge function to create user with admin privileges
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso',
      });
      
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o usuário',
        variant: 'destructive',
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'broker' | 'user') => {
    try {
      setLoading(true);
      
      await CRM.profiles.updateRole(userId, newRole);

      toast({
        title: "Sucesso",
        description: "Função do usuário atualizada com sucesso",
      });

      fetchUsers();
      fetchBrokers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro", 
        description: "Erro ao atualizar função do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Call edge function to properly delete user
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: selectedUser.id }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso',
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o usuário',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/auth?action=reset-password`
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Email de redefinição de senha enviado',
      });
      
      setIsResetPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar email de redefinição',
        variant: 'destructive',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/20 text-destructive';
      case 'moderator': return 'bg-warning/20 text-warning';
      default: return 'bg-primary/20 text-primary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success';
      case 'inactive': return 'bg-muted/20 text-muted-foreground';
      case 'suspended': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Gestão de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div>
                  <Label>Senha Temporária</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Senha temporária"
                  />
                </div>
                <div>
                  <Label>Perfil</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateUser} className="flex-1">
                    Criar Usuário
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.full_name || user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.email && <Mail className="h-4 w-4 text-muted-foreground" />}
                        {user.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole: 'admin' | 'broker' | 'user') => updateUserRole(user.id, newRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="broker">Corretor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {user.created_at && format(new Date(user.created_at), 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsResetPasswordDialogOpen(true);
                            }}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </ResponsiveTable>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja enviar um email de redefinição de senha para {selectedUser?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              Enviar Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {selectedUser?.full_name || selectedUser?.email}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}