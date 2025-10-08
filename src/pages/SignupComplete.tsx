import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle } from 'lucide-react';

export default function SignupComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [email, setEmail] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    username: '',
  });

  useEffect(() => {
    // Tentar pegar email do localStorage ou query params
    const savedEmail = localStorage.getItem('pending_signup_email');
    const queryEmail = searchParams.get('email');
    const emailToUse = queryEmail || savedEmail;

    if (emailToUse) {
      setEmail(emailToUse);
      checkPendingSignup(emailToUse);
    } else {
      toast({
        title: 'Email não encontrado',
        description: 'Não foi possível identificar seu cadastro',
        variant: 'destructive',
      });
      navigate('/checkout');
    }
  }, []);

  const checkPendingSignup = async (emailToCheck: string) => {
    try {
      console.log('🔍 Verificando signup pendente para:', emailToCheck);
      
      const { data, error } = await supabase
        .from('pending_signups')
        .select('*')
        .eq('email', emailToCheck)
        .eq('claimed', false)
        .single();

      if (error || !data) {
        console.error('❌ Signup pendente não encontrado');
        setPaymentConfirmed(false);
      } else {
        console.log('✅ Signup pendente encontrado:', data.id);
        setPaymentConfirmed(true);
      }
    } catch (error) {
      console.error('Erro ao verificar signup:', error);
      setPaymentConfirmed(false);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'As senhas digitadas não são iguais',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('👤 Criando usuário no Supabase...');
      
      // Criar usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (signUpError) throw signUpError;

      console.log('✅ Usuário criado:', authData.user?.id);

      // Vincular subscription ao usuário
      const { error: claimError } = await supabase.functions.invoke('claim-subscription', {
        body: { email },
      });

      if (claimError) {
        console.error('⚠️ Erro ao vincular subscription:', claimError);
        // Não bloquear o fluxo por isso
      }

      // Limpar localStorage
      localStorage.removeItem('pending_signup_email');

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já pode acessar sua área logada',
      });

      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erro ao criar conta:', error);
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p>Verificando seu pagamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Pagamento não confirmado</CardTitle>
            <CardDescription>
              Não encontramos um pagamento pendente para este email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seu pagamento pode ainda estar sendo processado. Por favor, aguarde alguns minutos e tente novamente.
            </p>
            <Button onClick={() => navigate('/checkout')} className="w-full">
              Voltar para checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle>Pagamento confirmado!</CardTitle>
          </div>
          <CardDescription>
            Agora finalize criando sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário (opcional)</Label>
              <Input
                id="username"
                placeholder="joaosilva"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar minha conta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
