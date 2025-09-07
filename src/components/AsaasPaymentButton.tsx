import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';

interface AsaasPaymentButtonProps {
  planName: string;
  planValue: number;
  planId: string;
  variant?: "default" | "outline";
  className?: string;
}

export function AsaasPaymentButton({ 
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
      // First, create or update customer in Asaas
      const customerResponse = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_customer',
          data: {
            name: broker.name,
            email: broker.email,
            phone: broker.phone || '',
            cpfCnpj: broker.creci && broker.creci.length >= 11 ? broker.creci : '00000000000',
            externalReference: broker.id
          }
        }
      });

      if (customerResponse.error) throw customerResponse.error;

      const customerId = customerResponse.data.customer?.id;
      if (!customerId) {
        throw new Error('Erro ao criar cliente no Asaas');
      }

      // Create payment/subscription
      const paymentResponse = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_subscription',
          data: {
            customer: customerId,
            billingType: "CREDIT_CARD",
            value: planValue,
            nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            cycle: "MONTHLY",
            description: `Assinatura ${planName} - ConectaIOS`,
            externalReference: `${broker.id}-${planId}`,
            discount: {
              value: 0,
              dueDateLimitDays: 0
            }
          }
        }
      });

      if (paymentResponse.error) throw paymentResponse.error;

      const subscription = paymentResponse.data.subscription;
      if (!subscription) {
        throw new Error('Erro ao criar assinatura');
      }

      // Update broker with subscription info
      const { error: updateError } = await supabase
        .from('conectaios_brokers')
        .update({
          plan_id: planId,
          subscription_status: 'active',
          asaas_customer_id: customerId,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', broker.id);

      if (updateError) throw updateError;

      // Redirect to payment page or show success
      if (subscription.invoiceUrl) {
        window.open(subscription.invoiceUrl, '_blank');
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para completar o pagamento",
        });
      } else {
        toast({
          title: "Assinatura criada!",
          description: `Sua assinatura do plano ${planName} foi criada com sucesso`,
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erro no pagamento",
        description: "Houve um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={variant}
      className={`w-full ${className}`}
      onClick={handlePayment}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Assinar via Asaas
        </>
      )}
    </Button>
  );
}