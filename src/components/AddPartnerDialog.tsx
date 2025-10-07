import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDeals } from '@/hooks/useDeals';
import { Badge } from './ui/badge';

interface AddPartnerDialogProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
  existingPartners?: any[];
}

export const AddPartnerDialog = ({ dealId, isOpen, onClose, existingPartners = [] }: AddPartnerDialogProps) => {
  const { addPartner, removePartner } = useDeals();
  const [formData, setFormData] = useState({
    partner_name: '',
    partner_email: '',
    partner_phone: '',
    partner_role: 'broker',
    commission_percentage: '',
    notes: ''
  });

  const handleSubmit = async () => {
    if (!formData.partner_name || !formData.partner_role) {
      toast.error('Preencha nome e papel do parceiro');
      return;
    }

    await addPartner(dealId, {
      partner_name: formData.partner_name,
      partner_email: formData.partner_email || undefined,
      partner_phone: formData.partner_phone || undefined,
      partner_role: formData.partner_role as any,
      commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : undefined,
      notes: formData.notes || undefined
    });

    setFormData({
      partner_name: '',
      partner_email: '',
      partner_phone: '',
      partner_role: 'broker',
      commission_percentage: '',
      notes: ''
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      broker: 'Corretor',
      investor: 'Investidor',
      consultant: 'Consultor',
      lawyer: 'Advogado',
      other: 'Outro'
    };
    return labels[role] || role;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Parceiros
          </DialogTitle>
          <DialogDescription>
            Adicione corretores, investidores ou outros profissionais envolvidos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Partners */}
          {existingPartners.length > 0 && (
            <div className="space-y-3">
              <Label>Parceiros Atuais</Label>
              <div className="space-y-2">
                {existingPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <div className="font-medium">{partner.partner_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getRoleLabel(partner.partner_role)}
                        {partner.commission_percentage && ` • ${partner.commission_percentage}% comissão`}
                      </div>
                      {partner.partner_email && (
                        <div className="text-xs text-muted-foreground">{partner.partner_email}</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePartner(partner.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Partner Form */}
          <div className="space-y-4">
            <Label>Adicionar Novo Parceiro</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.partner_name}
                  onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                  placeholder="João da Silva"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.partner_email}
                  onChange={(e) => setFormData({...formData, partner_email: e.target.value})}
                  placeholder="joao@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.partner_phone}
                  onChange={(e) => setFormData({...formData, partner_phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label>Papel *</Label>
                <Select value={formData.partner_role} onValueChange={(v) => setFormData({...formData, partner_role: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">Corretor</SelectItem>
                    <SelectItem value="investor">Investidor</SelectItem>
                    <SelectItem value="consultant">Consultor</SelectItem>
                    <SelectItem value="lawyer">Advogado</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>% Comissão</Label>
                <Input
                  type="number"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({...formData, commission_percentage: e.target.value})}
                  placeholder="30"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Detalhes sobre a participação..."
                rows={2}
              />
            </div>

            <Button onClick={handleSubmit} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Parceiro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
