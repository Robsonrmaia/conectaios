import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CouponValidation {
  valid: boolean;
  discount_percent?: number;
  discount_value?: number;
  error?: string;
}

export function useAsaasCoupon() {
  const [loading, setLoading] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState<CouponValidation | null>(null);

  const validateCoupon = async (code: string): Promise<CouponValidation> => {
    if (!code.trim()) {
      return { valid: false, error: 'Código inválido' };
    }

    try {
      setLoading(true);

      const { data: coupon, error } = await supabase
        .from('asaas_coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        const validation = { valid: false, error: 'Cupom não encontrado ou inválido' };
        setValidatedCoupon(validation);
        toast({
          title: 'Cupom Inválido',
          description: validation.error,
          variant: 'destructive'
        });
        return validation;
      }

      // Verificar validade
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        const validation = { valid: false, error: 'Cupom expirado' };
        setValidatedCoupon(validation);
        toast({
          title: 'Cupom Expirado',
          description: validation.error,
          variant: 'destructive'
        });
        return validation;
      }

      // Verificar usos
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        const validation = { valid: false, error: 'Cupom esgotado' };
        setValidatedCoupon(validation);
        toast({
          title: 'Cupom Esgotado',
          description: validation.error,
          variant: 'destructive'
        });
        return validation;
      }

      const validation: CouponValidation = {
        valid: true,
        discount_percent: coupon.discount_percent || undefined,
        discount_value: coupon.discount_value || undefined
      };

      setValidatedCoupon(validation);
      
      const discountText = validation.discount_percent 
        ? `${validation.discount_percent}% de desconto`
        : `R$ ${validation.discount_value} de desconto`;

      toast({
        title: 'Cupom Válido! 🎉',
        description: discountText
      });

      return validation;
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      const validation = { valid: false, error: 'Erro ao validar cupom' };
      setValidatedCoupon(validation);
      toast({
        title: 'Erro',
        description: validation.error,
        variant: 'destructive'
      });
      return validation;
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = (originalValue: number): number => {
    if (!validatedCoupon || !validatedCoupon.valid) {
      return originalValue;
    }

    if (validatedCoupon.discount_percent) {
      return originalValue * (1 - validatedCoupon.discount_percent / 100);
    }

    if (validatedCoupon.discount_value) {
      return Math.max(0, originalValue - validatedCoupon.discount_value);
    }

    return originalValue;
  };

  const clearCoupon = () => {
    setValidatedCoupon(null);
  };

  return {
    validateCoupon,
    applyCoupon,
    clearCoupon,
    validatedCoupon,
    loading
  };
}
