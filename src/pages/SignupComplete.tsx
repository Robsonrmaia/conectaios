import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface PendingSignup {
  id: string;
  email: string;
  name: string;
  plan_id: string;
  signup_token: string;
  token_expires_at: string;
  payment_status: string;
}

export default function SignupComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [signupData, setSignupData] = useState<PendingSignup | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const token = searchParams.get('token');
      
      if (!token) {
        toast({
          title: 'Token inválido',
          description: 'Link de cadastro inválido ou expirado.',
          variant: 'destructive',
        });
        navigate('/checkout');
        return;
      }

      // Validate token in pending_signups
      const { data: pendingSignup, error } = await supabase
        .from('pending_signups')
        .select('*')
        .eq('signup_token', token)
        .eq('claimed', false)
        .maybeSingle();

      if (error || !pendingSignup) {
        console.error('Token validation error:', error);
        toast({
          title: 'Token inválido',
          description: 'Link de cadastro inválido, expirado ou já utilizado.',
          variant: 'destructive',
        });
        setValidating(false);
        return;
      }

      // Check if token expired
      const expiresAt = new Date(pendingSignup.token_expires_at);
      if (expiresAt < new Date()) {
        toast({
          title: 'Link expirado',
          description: 'Este link expirou. Entre em contato com o suporte.',
          variant: 'destructive',
        });
        setValidating(false);
        return;
      }

      // Check payment status
      if (pendingSignup.payment_status !== 'confirmed') {
        toast({
          title: 'Pagamento pendente',
          description: 'Seu pagamento ainda não foi confirmado. Aguarde o email de confirmação.',
        });
        setValidating(false);
        return;
      }

      // Token is valid
      setSignupData(pendingSignup);
      setTokenValid(true);
      
      toast({
        title: 'Link válido! ✅',
        description: 'Agora você pode criar sua senha e finalizar seu cadastro.',
      });
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao validar seu link.',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData) {
      toast({
        title: 'Erro',
        description: 'Dados de cadastro não encontrados.',
        variant: 'destructive',
      });
      return;
    }

    if (!password || !confirmPassword || !username) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      toast({
        title: 'Username inválido',
        description: 'O username deve ter entre 3 e 20 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: 'Username inválido',
        description: 'Use apenas letras, números e underscores.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'As senhas digitadas não são iguais.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signupData.email,
        password,
        options: {
          data: {
            username,
            name: signupData.name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Call claim-subscription function
      const { error: claimError } = await supabase.functions.invoke('claim-subscription', {
        body: { email: signupData.email },
      });

      if (claimError) {
        console.error('Error claiming subscription:', claimError);
        // Continue anyway, as the user was created
      }

      // Mark token as used
      await supabase
        .from('pending_signups')
        .update({ 
          claimed: true, 
          claimed_at: new Date().toISOString() 
        })
        .eq('id', signupData.id);

      toast({
        title: 'Cadastro completo! 🎉',
        description: 'Bem-vindo ao ConectaIOS! Redirecionando...',
      });

      // Auto login and redirect
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Ocorreu um erro ao criar sua conta.';
      if (error.message?.includes('already registered')) {
        errorMessage = 'Este email já está cadastrado. Faça login.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to format plan name
  const formatPlanName = (planId: string) => {
    const plans: Record<string, string> = {
      basic: 'Básico',
      pro: 'Profissional',
      enterprise: 'Premium',
      api: 'API Empresarial',
    };
    return plans[planId] || planId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete seu Cadastro</CardTitle>
          <CardDescription>
            {validating ? 'Validando link...' : 
             tokenValid ? 'Crie sua senha para acessar sua conta' : 'Link inválido ou expirado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Verificando seu link...</p>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Este link é inválido, expirou ou já foi utilizado. Se você precisa de ajuda, entre em contato com o suporte.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/checkout')}
                variant="outline"
                className="w-full"
              >
                Voltar ao Checkout
              </Button>
            </div>
          ) : signupData ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Plan info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Pagamento Confirmado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plano: <span className="font-medium text-foreground">{formatPlanName(signupData.plan_id)}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={signupData.name}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="seu_usuario"
                  minLength={3}
                  maxLength={20}
                  required
                />
                <p className="text-xs text-muted-foreground">3-20 caracteres, apenas letras, números e _</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Finalizar Cadastro'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ao criar sua conta, você concorda com nossos Termos de Uso
              </p>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
