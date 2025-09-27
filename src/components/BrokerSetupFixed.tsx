import React, { useState } from 'react';
import { CRM } from '@/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface BrokerSetupProps {
  onBrokerCreated: (broker: any) => void;
}

export function BrokerSetup({ onBrokerCreated }: BrokerSetupProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    creci: '',
    bio: '',
    whatsapp: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const broker = await CRM.brokers.create({
        user_id: 'current-user-id', // Replace with actual user ID
        creci: formData.creci,
        bio: formData.bio,
        whatsapp: formData.whatsapp,
        minisite_slug: ''
      });

      if (!broker) throw new Error('Failed to create broker');
      
      onBrokerCreated(broker);

      toast({
        title: "Sucesso",
        description: "Perfil de corretor criado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="creci">CRECI</Label>
        <Input
          id="creci"
          value={formData.creci}
          onChange={(e) => setFormData({ ...formData, creci: e.target.value })}
          placeholder="Número do CRECI"
        />
      </div>
      
      <div>
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          value={formData.whatsapp}
          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Input
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Descrição profissional"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Perfil'}
      </Button>
    </form>
  );
}