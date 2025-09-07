import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CreditCard, Check } from 'lucide-react';

export function AsaasTestButton() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState<string>('');
  
  const testAsaasIntegration = async () => {
    if (!user || !broker) {
      toast.error('Usuário ou corretor não encontrado');
      return;
    }

    setLoading(true);
    setStep(1);

    try {
      // Step 1: Create customer
      console.log('🔄 Step 1: Criando cliente no Asaas...');
      setStep(1);
      
      const { data: customerData, error: customerError } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_customer',
          data: {
            name: broker.name,
            email: broker.email,
            phone: broker.phone?.replace(/\D/g, '') || '', // Remove caracteres especiais
            cpfCnpj: '11144477735', // CPF de teste
            notificationDisabled: false
          }
        }
      });

      if (customerError) {
        console.error('❌ Erro ao criar cliente:', customerError);
        toast.error('Erro ao criar cliente no Asaas');
        return;
      }

      const createdCustomerId = customerData?.data?.id;
      if (!createdCustomerId) {
        toast.error('ID do cliente não retornado pelo Asaas');
        return;
      }

      setCustomerId(createdCustomerId);
      console.log('✅ Cliente criado com sucesso:', createdCustomerId);
      toast.success(`Cliente criado: ${createdCustomerId}`);

      // Step 2: Wait and verify customer
      console.log('🔄 Step 2: Aguardando e verificando cliente...');
      setStep(2);
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos

      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'verify_customer',
          data: {
            customerId: createdCustomerId
          }
        }
      });

      if (verifyError) {
        console.error('❌ Erro ao verificar cliente:', verifyError);
        toast.error('Cliente não foi criado corretamente');
        return;
      }

      console.log('✅ Cliente verificado com sucesso');
      toast.success('Cliente verificado com sucesso');

      // Step 3: Create subscription
      console.log('🔄 Step 3: Criando assinatura...');
      setStep(3);

      const subscriptionPayload = {
        customer: createdCustomerId,
        billingType: 'CREDIT_CARD',
        value: 97,
        nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: 'Teste Assinatura ConectaIOS',
        externalReference: `test_${broker.id}_${Date.now()}`,
        creditCard: {
          holderName: broker.name,
          number: '4000000000000010', // Cartão de teste válido para Asaas
          expiryMonth: '05',
          expiryYear: '2028',
          ccv: '318'
        },
        creditCardHolderInfo: {
          name: broker.name,
          email: broker.email,
          cpfCnpj: '11144477735',
          phone: broker.phone?.replace(/\D/g, '') || '',
          postalCode: '01310-100', // CEP obrigatório
          address: 'Av. Paulista',
          addressNumber: '123',
          addressComplement: 'Teste',
          province: 'Centro',
          city: 'São Paulo',
          state: 'SP'
        }
      };

      console.log('📤 Payload da assinatura:', JSON.stringify(subscriptionPayload, null, 2));

      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'create_subscription',
          data: subscriptionPayload
        }
      });

      if (subscriptionError) {
        console.error('❌ Erro ao criar assinatura:', subscriptionError);
        toast.error(`Erro ao criar assinatura: ${subscriptionError.message}`);
        return;
      }

      console.log('✅ Assinatura criada com sucesso:', subscriptionData);
      toast.success('Assinatura criada com sucesso!');
      setStep(4);

    } catch (error: any) {
      console.error('❌ Erro geral:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (stepNumber: number) => {
    if (step > stepNumber) return <Check className="h-4 w-4 text-green-500" />;
    if (step === stepNumber && loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
  };

  const getStepColor = (stepNumber: number) => {
    if (step > stepNumber) return 'text-green-500';
    if (step === stepNumber && loading) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-semibold">Teste Asaas Integration</h3>
      </div>
      
      {/* Progress Steps */}
      <div className="space-y-2">
        <div className={`flex items-center gap-2 ${getStepColor(1)}`}>
          {getStepIcon(1)}
          <span className="text-sm">1. Criar Cliente</span>
        </div>
        <div className={`flex items-center gap-2 ${getStepColor(2)}`}>
          {getStepIcon(2)}
          <span className="text-sm">2. Verificar Cliente</span>
        </div>
        <div className={`flex items-center gap-2 ${getStepColor(3)}`}>
          {getStepIcon(3)}
          <span className="text-sm">3. Criar Assinatura</span>
        </div>
        <div className={`flex items-center gap-2 ${getStepColor(4)}`}>
          {getStepIcon(4)}
          <span className="text-sm">4. Finalizado</span>
        </div>
      </div>

      {customerId && (
        <div className="p-2 bg-muted rounded text-sm">
          <strong>Customer ID:</strong> {customerId}
        </div>
      )}

      <Button 
        onClick={testAsaasIntegration}
        disabled={loading || !user || !broker}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processando Step {step}...
          </>
        ) : (
          'Testar Integração Asaas'
        )}
      </Button>
      
      {(!user || !broker) && (
        <p className="text-sm text-muted-foreground">
          Faça login para testar a integração
        </p>
      )}
    </div>
  );
}