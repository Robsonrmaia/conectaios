import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Info, Mail, Lock, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ConectaLogo from '@/components/ConectaLogo';
import { CheckoutStepper } from '@/components/CheckoutStepper';

// Validação de CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf[10]);
}

// Validação de CNPJ
function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

// Validador unificado
function validarCpfCnpj(valor: string): boolean {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length === 11) return validarCPF(numeros);
  if (numeros.length === 14) return validarCNPJ(numeros);
  return false;
}

// Formatação de CPF/CNPJ
function formatarCpfCnpj(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  
  if (numeros.length <= 11) {
    // CPF: 000.000.000-00
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return numeros
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

const PLANS = [
  { 
    id: 'basic', 
    name: 'Básico', 
    price: 98.00,
    promoPrice: 49.00,
    features: [
      'Até 20 imóveis',
      'CRM completo',
      'Matches ilimitados',
      'Chat em tempo real',
      'Ferramentas básicas',
      'Minisite personalizado'
    ] 
  },
  { 
    id: 'pro', 
    name: 'Profissional', 
    price: 148.00,
    promoPrice: 79.00,
    features: [
      'Até 50 imóveis',
      'Tudo do plano Básico',
      'Ferramentas avançadas',
      '⚡ 2 imóveis publicados no OLX',
      'Suporte prioritário'
    ] 
  },
  { 
    id: 'enterprise', 
    name: 'Premium', 
    price: 198.00,
    promoPrice: 99.00,
    features: [
      'Até 100 imóveis',
      'Tudo do plano Profissional',
      '👑 5 imóveis no OLX (destaque no topo)',
      'API completa',
      'Gerente de conta dedicado'
    ] 
  },
];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || 'pro';
  
  const selectedPlan = PLANS.find(p => p.id === planId) || PLANS[1];
  
  const [loading, setLoading] = useState(false);
  const [cpfValido, setCpfValido] = useState<boolean | null>(null);
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-4">
          <ConectaLogo width={120} height={40} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Assinar ConectaIOS</h1>
        </div>

        <CheckoutStepper currentStep={1} />

        {planId && (
          <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              ✨ Plano <strong>{selectedPlan.name}</strong> pré-selecionado. 
              Preencha os dados abaixo para continuar.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
          <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            <strong className="font-semibold">🔥 Promoção de Lançamento!</strong>
            <br />
            Nos primeiros <strong>3 meses</strong>, você paga apenas <strong>50% do valor</strong>.
            <br />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              Após o 3º mês, o valor volta ao normal (R$ {selectedPlan.price.toFixed(2)}/mês)
            </span>
          </AlertDescription>
        </Alert>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Como funciona:</strong> Após preencher seus dados e confirmar o pagamento,
            você receberá um email com o link para criar sua senha e acessar a plataforma.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
        {/* Resumo do Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Plano {selectedPlan.name}</CardTitle>
            <CardDescription>Resumo da assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-primary">
                  R$ {selectedPlan.promoPrice.toFixed(2)}
                </div>
                <div className="text-2xl line-through text-muted-foreground">
                  R$ {selectedPlan.price.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/mês nos 3 primeiros meses</span>
                <Badge variant="destructive" className="text-xs">50% OFF</Badge>
              </div>
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
                      {plan.name} - R$ {plan.promoPrice.toFixed(2)}/mês (50% OFF por 3 meses)
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
            <CardTitle>Seus Dados</CardTitle>
            <CardDescription>Informações básicas para criar sua conta</CardDescription>
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
                <Label htmlFor="cpf_cnpj">CPF/CNPJ (opcional para teste)</Label>
                <div className="relative">
                  <Input
                    id="cpf_cnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={formData.cpf_cnpj}
                    onChange={(e) => {
                      const valor = formatarCpfCnpj(e.target.value);
                      setFormData({ ...formData, cpf_cnpj: valor });
                      
                      const numeros = valor.replace(/\D/g, '');
                      if (numeros.length >= 11) {
                        setCpfValido(validarCpfCnpj(valor));
                      } else {
                        setCpfValido(null);
                      }
                    }}
                    className={cpfValido === false ? 'border-red-500 pr-10' : cpfValido === true ? 'border-green-500 pr-10' : ''}
                  />
                  {cpfValido === true && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {cpfValido === false && (
                    <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                {cpfValido === false && (
                  <p className="text-sm text-red-500">
                    CPF/CNPJ inválido. Verifique os dígitos.
                  </p>
                )}
                {!formData.cpf_cnpj && (
                  <p className="text-xs text-muted-foreground">
                    Em ambiente de teste, o CPF será preenchido automaticamente
                  </p>
                )}
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Próximo passo:</strong> Após o pagamento, você receberá um email
                  para criar sua senha de acesso.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Processando..." : "Continuar para Pagamento"}
              </Button>

              <div className="space-y-2 text-xs text-center text-muted-foreground">
                <p className="flex items-center justify-center gap-1">
                  <Mail className="w-3 h-3" />
                  Você será redirecionado para o Asaas para concluir o pagamento
                </p>
                <p>Pagamento 100% seguro e criptografado</p>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
