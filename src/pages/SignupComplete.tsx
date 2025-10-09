import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CheckoutStepper } from '@/components/CheckoutStepper';

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <CheckoutStepper currentStep={3} />

        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <img src="/logoconectaios.png" alt="ConectaIOS" className="h-12 mx-auto mb-4" />
            <CardTitle className="text-2xl">
              {!tokenValid ? "Token Inválido" : "Complete seu Cadastro"}
            </CardTitle>
            <CardDescription>
              {!tokenValid
                ? "Este link de ativação é inválido ou já foi utilizado"
                : "Crie seu nome de usuário e senha para acessar a plataforma"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validating ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !tokenValid ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    O link pode ter expirado ou já foi utilizado. Por favor, entre em contato
                    com o suporte para obter um novo link.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => navigate('/checkout')} className="w-full">
                  Voltar para Checkout
                </Button>
              </div>
            ) : signupData ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="space-y-2">
                    <p className="text-sm font-medium text-green-800">Pagamento Confirmado</p>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>
                        <strong>Plano:</strong> {formatPlanName(signupData.plan_id)}
                      </p>
                      <p>
                        <strong>Email:</strong> {signupData.email}
                      </p>
                      <p>
                        <strong>Nome:</strong> {signupData.name}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signupData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={signupData.name}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário *</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seu_usuario"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Escolha um nome de usuário único para sua conta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Criando Conta..." : "Concluir Cadastro"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos Termos de Uso
                </p>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
