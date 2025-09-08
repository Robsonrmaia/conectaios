import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface AsaasPaymentButtonProps {
  planName: string;
  planValue: number;
  planId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function AsaasPaymentButtonFixed({ planName, planValue, planId, variant = "default", className = "" }: AsaasPaymentButtonProps) {
  
  const handleClick = () => {
    try {
      // Redirecionar direto para o Asaas
      const asaasUrl = 'https://www.asaas.com/cadastro';
      window.open(asaasUrl, '_blank');
      
      toast({
        title: "Redirecionado para Asaas",
        description: "Complete seu cadastro e assinatura no Asaas."
      });

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir página do Asaas",
        variant: "destructive"
      });
    }
  };

  return (
    <Button variant={variant} className={className} onClick={handleClick}>
      Assinar {planName} - R$ {planValue.toFixed(2)}
    </Button>
  );
}