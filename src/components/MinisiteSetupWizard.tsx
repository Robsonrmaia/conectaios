import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/hooks/use-toast';

interface MinisiteSetupWizardProps {
  onComplete: () => void;
}

export function MinisiteSetupWizard({ onComplete }: MinisiteSetupWizardProps) {
  const { broker, updateBrokerProfile } = useBroker();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(
    broker?.username || broker?.name?.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      await updateBrokerProfile({ username: username.trim() });
      toast({
        title: "Username configurado!",
        description: "Seu minisite já está disponível.",
      });
      onComplete();
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: "Erro",
        description: "Erro ao configurar username. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert explaining the need */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuração necessária:</strong> Para ativar seu minisite público, você precisa 
          definir um username único. Configure aqui ou vá em <strong>Minisite → Configuração Básica</strong>.
        </AlertDescription>
      </Alert>

      {/* Setup Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-r from-primary to-brand-secondary rounded-full flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Configure seu Minisite</CardTitle>
          <CardDescription>
            Defina um username para seu minisite público
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  @
                </span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="seuusername"
                  className="rounded-l-none font-mono"
                  required
                />
              </div>
              
              {username && (
                <div className="mt-2 p-3 bg-success/5 border border-success/20 rounded-md">
                  <div className="flex items-center gap-2 text-success text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Seu minisite será:</span>
                  </div>
                  <div className="font-mono text-sm mt-1 text-success">
                    {window.location.origin}/@{username}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-brand-secondary"
                disabled={loading || !username.trim()}
              >
                {loading ? 'Configurando...' : 'Ativar Minisite'}
              </Button>
              
              <div className="text-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open('/app/perfil', '_blank')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ou configure no seu Perfil
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-gradient-to-br from-primary/5 to-brand-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg">Benefícios do Minisite</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Página pública personalizada com seus imóveis</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Link fácil de compartilhar com clientes</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Formulário de contato integrado</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Analytics de visitação</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}