import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PaymentSystem } from './PaymentSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AsaasPaymentButtonProps {
  planName: string;
  planValue: number;
  planId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function AsaasPaymentButtonFixed({ planName, planValue, planId, variant = "default", className = "" }: AsaasPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          Assinar {planName} - R$ {planValue.toFixed(2)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Assinatura</DialogTitle>
        </DialogHeader>
        <PaymentSystem 
          planName={planName}
          planValue={planValue}
          planId={planId}
        />
      </DialogContent>
    </Dialog>
  );
}