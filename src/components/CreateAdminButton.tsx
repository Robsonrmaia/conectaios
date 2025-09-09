import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Key } from 'lucide-react';

export default function CreateAdminButton() {
  const [isCreating, setIsCreating] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);

  const createAdminUser = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user');

      if (error) throw error;

      if (data?.success) {
        setAdminCreated(true);
        toast.success(data.message || 'Usuário admin criado com sucesso!');
        
        if (data.credentials) {
          toast.info(`Login: ${data.credentials.email} | Senha: ${data.credentials.password}`, {
            duration: 10000
          });
        }
      } else {
        toast.error('Falha ao criar usuário admin');
      }
    } catch (error: any) {
      console.error('Erro ao criar admin:', error);
      toast.error(`Erro: ${error.message || 'Falha ao criar usuário admin'}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (adminCreated) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardHeader>
          <CardTitle className="text-success flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Criado!
          </CardTitle>
          <CardDescription>
            O usuário administrador foi criado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4" />
              <strong>Login:</strong> admin | <strong>Senha:</strong> admin123
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Criar Usuário Admin
        </CardTitle>
        <CardDescription>
          Crie um usuário administrador para acessar o painel administrativo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={createAdminUser}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Criando Admin...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Criar Usuário Admin
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Credenciais: admin / admin123
        </p>
      </CardContent>
    </Card>
  );
}