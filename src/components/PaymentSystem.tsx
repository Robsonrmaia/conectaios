import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Banknote, Smartphone, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { UserDataForm } from './UserDataForm';

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

interface UserData {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
}

export function PaymentSystem({ planName, planValue, planId }: PaymentSystemProps) {
  const [loading, setLoading] = useState(false);

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

  const handleAsaasPayment = () => {
    setLoading(true);
    
    try {
      // Redirecionar direto para o Asaas
      const asaasUrl = 'https://www.asaas.com/cadastro';
      window.open(asaasUrl, '_blank');
      
      toast({
        title: "Redirecionado para Asaas",
        description: "Complete seu cadastro e assinatura no Asaas que foi aberto em nova aba."
      });

    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir página do Asaas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Finalizar Assinatura
        </CardTitle>
        <CardDescription>
          Plano {planName} - R$ {planValue.toFixed(2)}/mês
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleAsaasPayment}
          disabled={loading}
          className="w-full justify-start gap-3 h-auto p-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <CreditCard className="w-5 h-5" />
            <div className="text-left flex-1">
              <span className="font-medium">Assinar via Asaas</span>
              <p className="text-sm text-muted-foreground">
                PIX, Cartão de Crédito ou Boleto
              </p>
            </div>
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        </Button>
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Você será redirecionado para o Asaas para finalizar o pagamento
          </p>
        </div>
      </CardContent>
    </Card>
  );
}