import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Coupon {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_value: number | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export function AsaasCouponManager() {
  const { isAdmin } = useAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchCoupons();
    }
  }, [isAdmin]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('asaas_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar cupons',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!code.trim()) {
      toast({
        title: 'Erro',
        description: 'Código do cupom é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!discountPercent && !discountValue) {
      toast({
        title: 'Erro',
        description: 'Informe desconto em % ou valor fixo',
        variant: 'destructive'
      });
      return;
    }

    try {
      const couponData: any = {
        code: code.toUpperCase(),
        is_active: true
      };

      if (discountPercent) {
        couponData.discount_percent = parseInt(discountPercent);
      }
      if (discountValue) {
        couponData.discount_value = parseFloat(discountValue);
      }
      if (maxUses) {
        couponData.max_uses = parseInt(maxUses);
      }
      if (validUntil) {
        couponData.valid_until = validUntil;
      }

      const { error } = await supabase
        .from('asaas_coupons')
        .insert([couponData]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cupom criado com sucesso!'
      });

      // Reset form
      setCode('');
      setDiscountPercent('');
      setDiscountValue('');
      setMaxUses('');
      setValidUntil('');
      setDialogOpen(false);

      fetchCoupons();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar cupom',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cupom?')) return;

    try {
      const { error } = await supabase
        .from('asaas_coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cupom excluído com sucesso!'
      });

      fetchCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir cupom',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('asaas_coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Cupom ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`
      });

      fetchCoupons();
    } catch (error: any) {
      console.error('Error toggling coupon:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar cupom',
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>Apenas administradores podem gerenciar cupons.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cupons de Desconto</CardTitle>
            <CardDescription>Gerencie cupons de desconto para assinaturas</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cupom de desconto
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Código do Cupom</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="EX: PROMO2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percent">Desconto (%)</Label>
                    <Input
                      id="percent"
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="10"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Valor Fixo (R$)</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="50.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="maxUses">Usos Máximos (opcional)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Válido Até (opcional)</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateCoupon} className="w-full">
                  Criar Cupom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Carregando cupons...</p>
        ) : coupons.length === 0 ? (
          <p className="text-muted-foreground">Nenhum cupom cadastrado</p>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <Card key={coupon.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-lg font-bold">{coupon.code}</code>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {coupon.max_uses && (
                        <Badge variant="outline">
                          {coupon.current_uses}/{coupon.max_uses} usos
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {coupon.discount_percent && `${coupon.discount_percent}% de desconto`}
                      {coupon.discount_value && `R$ ${coupon.discount_value} de desconto`}
                      {coupon.valid_until && ` • Válido até ${new Date(coupon.valid_until).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                    >
                      {coupon.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
