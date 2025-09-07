import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Banknote, Smartphone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  available: boolean;
  description: string;
}

interface PaymentSystemProps {
  planName: string;
  planValue: number;
  planId: string;
}

export function PaymentSystem({ planName, planValue, planId }: PaymentSystemProps) {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'processing' | 'success' | 'error'>('select');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  const paymentOptions: PaymentOption[] = [
    {
      id: 'asaas',
      name: 'Asaas (PIX, Cartão, Boleto)',
      icon: <CreditCard className="w-5 h-5" />,
      available: true,
      description: 'Gateway brasileiro com PIX, cartão e boleto'
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      icon: <Smartphone className="w-5 h-5" />,
      available: false,
      description: 'Em breve - PIX instantâneo e cartão'
    },
    {
      id: 'stripe',
      name: 'Stripe Internacional',
      icon: <Banknote className="w-5 h-5" />,
      available: false,
      description: 'Em breve - Para clientes internacionais'
    }
  ];

  const handleAsaasPayment = async () => {
    if (!user || !broker) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setCurrentStep('processing');
    
    try {
      // 1. Criar cliente no Asaas
      console.log('Criando cliente no Asaas...');
      const customerResponse = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_customer',
          data: {
            name: broker.name,
            email: broker.email,
            phone: broker.phone,
            cpfCnpj: broker.phone.replace(/\D/g, ''), // Temporário - usar CPF real
            notificationDisabled: false
          }
        }
      });

      if (customerResponse.error) {
        throw new Error(customerResponse.error.message || 'Erro ao criar cliente');
      }

      const customerId = customerResponse.data?.data?.id;
      if (!customerId) {
        throw new Error('ID do cliente não retornado');
      }

      // 2. Criar assinatura
      console.log('Criando assinatura...');
      const subscriptionResponse = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_subscription',
          data: {
            customer: customerId,
            billingType: 'UNDEFINED', // Cliente escolhe no checkout
            value: planValue,
            nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
            cycle: 'MONTHLY',
            description: `Assinatura ${planName} - ConectaIOS`,
            externalReference: `plan_${broker.id}_${Date.now()}`
          }
        }
      });

      if (subscriptionResponse.error) {
        throw new Error(subscriptionResponse.error.message || 'Erro ao criar assinatura');
      }

      const subscription = subscriptionResponse.data?.data;
      const checkoutUrl = subscriptionResponse.data?.checkoutUrl || subscription?.invoiceUrl;

      if (checkoutUrl) {
        // Abrir checkout em nova aba
        window.open(checkoutUrl, '_blank');
        setCurrentStep('success');
        toast({
          title: "Redirecionando para pagamento",
          description: "Uma nova aba foi aberta com o checkout do Asaas"
        });
      } else {
        throw new Error('URL de checkout não disponível');
      }

    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      setErrorMessage(error.message);
      setCurrentStep('error');
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (optionId: string) => {
    setSelectedPayment(optionId);
    
    switch (optionId) {
      case 'asaas':
        await handleAsaasPayment();
        break;
      case 'mercadopago':
        toast({
          title: "Em desenvolvimento",
          description: "Mercado Pago será disponibilizado em breve",
          variant: "default"
        });
        break;
      case 'stripe':
        toast({
          title: "Em desenvolvimento", 
          description: "Stripe será disponibilizado em breve",
          variant: "default"
        });
        break;
      default:
        toast({
          title: "Opção inválida",
          description: "Selecione uma opção de pagamento válida",
          variant: "destructive"
        });
    }
  };

  if (currentStep === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-center text-muted-foreground">
              Processando pagamento...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <p className="text-center text-green-600 font-medium">
              Checkout aberto com sucesso!
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Complete seu pagamento na nova aba que foi aberta.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('select')}
              className="w-full"
            >
              Tentar outro método
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'error') {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <p className="text-center text-red-600 font-medium">
              Erro no pagamento
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {errorMessage}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('select')}
              className="w-full"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Escolha seu método de pagamento
        </CardTitle>
        <CardDescription>
          Plano {planName} - R$ {planValue.toFixed(2)}/mês
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentOptions.map((option) => (
          <div key={option.id} className="space-y-2">
            <Button
              variant={option.available ? "outline" : "ghost"}
              disabled={!option.available || loading}
              onClick={() => handlePayment(option.id)}
              className={`w-full justify-start gap-3 h-auto p-4 ${
                selectedPayment === option.id ? 'border-primary' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {option.icon}
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.name}</span>
                    {!option.available && (
                      <Badge variant="secondary" className="text-xs">
                        Em breve
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
              {loading && selectedPayment === option.id && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </Button>
            {option.id !== paymentOptions[paymentOptions.length - 1].id && (
              <Separator />
            )}
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Pagamentos processados de forma segura
          </p>
        </div>
      </CardContent>
    </Card>
  );
}