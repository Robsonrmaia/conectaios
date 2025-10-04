import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Users, 
  Building2, 
  TrendingUp, 
  Database,
  Activity,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Search,
  LogOut,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  nome: string;
  role: string;
  created_at: string;
  user_id: string;
  email?: string;
}

interface AdminMasterDashboardProps {
  onLogout: () => void;
}

export default function AdminMasterDashboard({ onLogout }: AdminMasterDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', role: 'user' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    totalProperties: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get auth users emails
      const usersWithEmails = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const { data: authData } = await supabase.auth.admin.getUserById(profile.id); // Use profile.id instead of user_id
            return {
              ...profile,
              email: authData.user?.email || 'N/A'
            };
          } catch {
            return {
              ...profile,
              email: 'N/A'
            };
          }
        })
      );

      setUsers(usersWithEmails as any);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Count users by role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');

      const totalUsers = profiles?.length || 0;
      const adminUsers = profiles?.filter(p => p.role === 'admin')?.length || 0;
      const regularUsers = totalUsers - adminUsers;

      // ⚠️ ATENÇÃO: Count de imóveis - usa tabela 'imoveis'
      // Count properties
      const { data: properties } = await supabase
        .from('imoveis')
        .select('id');

      setStats({
        totalUsers,
        adminUsers,
        regularUsers,
        totalProperties: properties?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          nome: newUser.nome,
          role: newUser.role
        }
      });

      if (error) throw error;

      toast.success('Usuário criado com sucesso!');
      setNewUser({ nome: '', email: '', password: '', role: 'user' });
      setShowCreateForm(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });

      if (error) throw error;

      toast.success('Usuário excluído com sucesso!');
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('admin_change_user_role', {
        user_id_param: userId, // Use user_id_param instead of target_user_id
        new_role: newRole
      });

      if (error) throw error;

      toast.success('Role alterado com sucesso!');
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Erro ao alterar role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'user': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Master
            </h1>
            <p className="text-muted-foreground">
              Sistema de administração principal - ConectaIOS
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-destructive/20 text-destructive">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Acesso Restrito
            </Badge>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Total Usuários</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-2xl font-bold text-destructive">{stats.adminUsers}</div>
                  <div className="text-sm text-muted-foreground">Admins</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-success" />
                <div>
                  <div className="text-2xl font-bold text-success">{stats.regularUsers}</div>
                  <div className="text-sm text-muted-foreground">Usuários Regulares</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-warning" />
                <div>
                  <div className="text-2xl font-bold text-warning">{stats.totalProperties}</div>
                  <div className="text-sm text-muted-foreground">Imóveis</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <CardDescription>
                      Controle total de usuários do sistema
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create User Form */}
                {showCreateForm && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome</Label>
                          <Input
                            id="nome"
                            value={newUser.nome}
                            onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Senha</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <select
                            id="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <Button type="submit">Criar Usuário</Button>
                          <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Search */}
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {/* Users Table */}
                <div className="border rounded-lg">
                  <div className="grid grid-cols-6 gap-4 p-4 font-medium bg-muted/50">
                    <div>Nome</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Criado em</div>
                    <div>Status</div>
                    <div>Ações</div>
                  </div>
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="grid grid-cols-6 gap-4 p-4 border-t">
                        <div className="font-medium">{user.nome}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          <Badge className="bg-success/20 text-success">
                            Ativo
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(
                              user.user_id, 
                              user.role === 'admin' ? 'user' : 'admin'
                            )}
                          >
                            {user.role === 'admin' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.user_id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Monitoramento do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Activity className="h-6 w-6" />
                    Logs do Sistema
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Database className="h-6 w-6" />
                    Status dos Serviços
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-16 justify-start">
                    <Shield className="h-5 w-5 mr-3" />
                    Segurança
                  </Button>
                  <Button variant="outline" className="h-16 justify-start">
                    <Database className="h-5 w-5 mr-3" />
                    Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}