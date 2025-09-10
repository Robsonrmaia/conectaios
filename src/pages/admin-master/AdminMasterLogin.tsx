import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AdminMasterLoginProps {
  onLogin: () => void;
}

export default function AdminMasterLogin({ onLogin }: AdminMasterLoginProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Master password - in production this should be from env variables
    const MASTER_PASSWORD = 'ConectaIOS2024@Admin';
    
    if (password === MASTER_PASSWORD) {
      toast.success('Acesso autorizado!');
      onLogin();
    } else {
      toast.error('Senha incorreta. Acesso negado.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 p-3 rounded-full">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Master
          </CardTitle>
          <CardDescription>
            Acesso restrito ao sistema administrativo
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Área de segurança máxima - Acesso monitorado</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="master-password">Senha Master</Label>
              <Input
                id="master-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha master"
                required
                className="mt-1"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Acessar Sistema'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
            >
              ← Voltar ao site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}