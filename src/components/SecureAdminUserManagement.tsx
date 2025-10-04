import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { UserPlus, Trash2, Shield, ShieldCheck, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  nome: string;
  role: 'user' | 'admin';
  created_at: string;
}

export default function SecureAdminUserManagement() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'user' | 'admin'
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user_id -> role
      const rolesMap = new Map(
        userRoles?.map(ur => [ur.user_id, ur.role]) || []
      );

      // Combine profiles with roles
      const combinedUsers = profiles?.map(profile => ({
        id: profile.id || '',
        email: 'Ver detalhes', // Email will be shown in detail view for security
        nome: profile.name || 'N/A',
        role: (rolesMap.get(profile.id) as 'user' | 'admin') || 'user',
        created_at: profile.created_at || new Date().toISOString()
      })) || [];

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role
        }
      });

      if (error) throw error;

      toast.success('Usuário criado com sucesso!');
      setCreateUserOpen(false);
      setNewUser({ email: '', password: '', name: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: {
          userId: selectedUser.id
        }
      });

      if (error) throw error;

      toast.success('Usuário deletado com sucesso!');
      setDeleteUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao deletar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: 'user' | 'admin') => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('admin_change_user_role', {
        user_id_param: selectedUser.id,
        new_role: newRole
      });

      if (error) throw error;

      // Parse the JSON response
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (result?.success) {
        toast.success('Role alterado com sucesso!');
        setRoleChangeOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(result?.error || 'Erro ao alterar role');
      }
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error.message || 'Erro ao alterar role');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <Badge variant="destructive" className="text-xs sm:text-sm">Admin Only</Badge>
        </div>
        
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto px-3 sm:px-4 text-sm sm:text-base">
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie um novo usuário com as credenciais especificadas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Senha segura"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: 'user' | 'admin') => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !users.length ? (
            <div className="text-center py-4">Carregando usuários...</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.nome}</p>
                        {user.role === 'admin' && (
                          <Badge variant="destructive">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
                    <Dialog open={roleChangeOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setRoleChangeOpen(open);
                      if (!open) setSelectedUser(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="w-full sm:w-auto px-3 sm:px-4 text-sm"
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Alterar Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alterar Role do Usuário</DialogTitle>
                          <DialogDescription>
                            Alterar o role de <strong>{user.nome}</strong> ({user.email})
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Role atual: <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>{user.role}</Badge></p>
                          <div className="flex gap-2">
                            <Button
                              variant={user.role === 'user' ? 'default' : 'outline'}
                              onClick={() => handleRoleChange('user')}
                              disabled={loading || user.role === 'user'}
                            >
                              Tornar Usuário
                            </Button>
                            <Button
                              variant={user.role === 'admin' ? 'default' : 'outline'}
                              onClick={() => handleRoleChange('admin')}
                              disabled={loading || user.role === 'admin'}
                            >
                              Tornar Admin
                            </Button>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRoleChangeOpen(false)}>
                            Cancelar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={deleteUserOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setDeleteUserOpen(open);
                      if (!open) setSelectedUser(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar Exclusão</DialogTitle>
                          <DialogDescription>
                            Tem certeza que deseja deletar o usuário <strong>{user.nome}</strong> ({user.email})?
                            Esta ação não pode ser desfeita.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteUserOpen(false)}>
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
                            {loading ? 'Deletando...' : 'Deletar'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}