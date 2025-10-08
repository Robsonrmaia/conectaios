import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import ConectaLogo from '@/components/ConectaLogo';

const PLANS = [
  { id: 'basic', name: 'Básico', price: 97.00, features: ['10 imóveis', 'Suporte básico'] },
  { id: 'pro', name: 'Profissional', price: 147.00, features: ['50 imóveis', 'Suporte prioritário', 'Analytics'] },
  { id: 'enterprise', name: 'Premium', price: 197.00, features: ['Imóveis ilimitados', 'Suporte 24/7', 'Integração via API'] },
  { id: 'api', name: 'API Empresarial', price: 297.00, features: ['Acesso total à API REST', 'Webhooks personalizados', 'Imóveis ilimitados', 'Suporte prioritário 24/7', 'Documentação completa', 'Rate limit: 10.000 req/dia'] },
];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || 'pro';
  
  const selectedPlan = PLANS.find(p => p.id === planId) || PLANS[1];
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha nome e email para continuar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Criando assinatura pública...');
      
      const { data, error } = await supabase.functions.invoke('create-public-subscription', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cpf_cnpj: formData.cpf_cnpj,
          plan_id: selectedPlan.id,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('✅ Assinatura criada, redirecionando para Asaas...');

      toast({
        title: 'Redirecionando para pagamento',
        description: 'Você será levado para completar o pagamento no Asaas',
      });

      // Salvar email no localStorage para usar depois
      localStorage.setItem('pending_signup_email', formData.email);

      // Redirecionar para Asaas
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('URL de checkout não retornada');
      }

    } catch (error: any) {
      console.error('❌ Erro detalhado:', error);
      
      let errorMessage = 'Erro desconhecido';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      } else if (error.message?.includes('FunctionsFetchError') || error.message?.includes('Edge Function')) {
        errorMessage = 'Serviço temporariamente indisponível. Aguarde alguns segundos e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao processar',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col items-center justify-center p-4">
      {/* Logo ConectaIOS */}
      <div className="mb-8">
        <ConectaLogo width={120} height={40} />
      </div>
      
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6">
        {/* Resumo do Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Plano {selectedPlan.name}</CardTitle>
            <CardDescription>Resumo da assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">
              R$ {selectedPlan.price.toFixed(2)}
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold">Inclui:</p>
              <ul className="space-y-1">
                {selectedPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label>Mudar de plano</Label>
              <Select value={planId} onValueChange={(value) => navigate(`/checkout?plan=${value}`)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toFixed(2)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
            <CardDescription>
              Preencha seus dados para prosseguir com o pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  placeholder="João da Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  placeholder="000.000.000-00"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Ir para pagamento'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Você será redirecionado para o Asaas para concluir o pagamento
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
