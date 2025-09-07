import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';

interface AsaasPaymentButtonProps {
  planName: string;
  planValue: number;
  planId: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function AsaasPaymentButtonFixed({ 
  planName, 
  planValue, 
  planId, 
  variant = "default", 
  className = "" 
}: AsaasPaymentButtonProps) {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [loading, setLoading] = useState(false);
  
  const handlePayment = async () => {
    if (!user || !broker) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar um plano",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando processo de pagamento Asaas...');
      
      // Step 1: Create customer in Asaas
      console.log('Criando cliente no Asaas...');
      const { data: customerData, error: customerError } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_customer',
          data: {
            name: broker.name,
            email: broker.email,
            phone: broker.phone,
            cpfCnpj: broker.creci && broker.creci.trim() !== '' && broker.creci !== '434343' 
              ? broker.creci 
              : '11144477735', // CPF de teste válido para sandbox
            notificationDisabled: false
          }
        }
      });

      if (customerError) {
        console.error('Erro ao criar cliente Asaas:', customerError);
        throw new Error('Erro ao criar cliente no Asaas');
      }

      console.log('Cliente criado no Asaas:', customerData);
      const customerId = customerData.data?.id || customerData.id;
      
      if (!customerId) {
        console.error('Customer data structure:', customerData);
        throw new Error('ID do cliente não retornado pelo Asaas');
      }

      // Step 2: Create subscription
      console.log('Criando assinatura no Asaas...');
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_subscription',
          data: {
            customer: customerId,
            billingType: 'CREDIT_CARD',
            value: planValue,
            nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
            cycle: 'MONTHLY',
            description: `Assinatura ${planName} - ConectaIOS`,
            externalReference: `broker_${broker.id}_plan_${planId}`,
            creditCard: {
              holderName: broker.name,
              number: '5162306219378829', // Cartão de teste
              expiryMonth: '05',
              expiryYear: '2028',
              ccv: '318'
            },
            creditCardHolderInfo: {
              name: broker.name,
              email: broker.email,
              cpfCnpj: broker.creci && broker.creci.trim() !== '' && broker.creci !== '434343' 
                ? broker.creci 
                : '11144477735',
              phone: broker.phone,
              addressNumber: '123',
              addressComplement: 'Sala 1',
              province: 'Centro'
            }
          }
        }
      });

      if (subscriptionError) {
        console.error('Erro ao criar assinatura:', subscriptionError);
        throw new Error('Erro ao criar assinatura no Asaas');
      }

      console.log('Assinatura criada:', subscriptionData);

      // Step 3: Update broker with subscription info
      console.log('Atualizando broker com dados da assinatura...');
      const { error: updateError } = await supabase
        .from('conectaios_brokers')
        .update({
          asaas_customer_id: customerId,
          subscription_status: 'active',
          plan_id: planId,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', broker.id);

      if (updateError) {
        console.error('Erro ao atualizar broker:', updateError);
        throw new Error('Erro ao atualizar dados do corretor');
      }

      console.log('Pagamento processado com sucesso!');

      toast({
        title: "Sucesso!",
        description: `Assinatura do plano ${planName} ativada com sucesso!`,
      });

      // Redirect to invoice if available
      if (subscriptionData.invoiceUrl) {
        window.open(subscriptionData.invoiceUrl, '_blank');
      }

    } catch (error) {
      console.error('Erro no processo de pagamento:', error);
      
      let errorMessage = 'Erro desconhecido no pagamento';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Erro no Pagamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Assinar {planName} - R$ {planValue.toFixed(2)}
        </>
      )}
    </Button>
  );
}