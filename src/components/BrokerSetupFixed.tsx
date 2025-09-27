import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function BrokerSetupFixed() {
  const { createBrokerProfile, loading } = useBroker();
  const [formData, setFormData] = useState({
    name: '',
    creci: '',
    phone: '',
    bio: '',
    whatsapp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createBrokerProfile(formData);
      toast({
        title: 'Perfil criado!',
        description: 'Seu perfil de corretor foi configurado com sucesso.',
      });
    } catch (error) {
      console.error('Error creating broker profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar perfil. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Configure seu Perfil</h1>
        <p className="text-muted-foreground">
          Preencha as informações básicas para começar a usar o sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Corretor</CardTitle>
          <CardDescription>
            Estes dados aparecerão no seu minisite e perfil público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creci">CRECI</Label>
                <Input
                  id="creci"
                  value={formData.creci}
                  onChange={(e) => setFormData({...formData, creci: e.target.value})}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Conte um pouco sobre sua experiência como corretor..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                'Finalizar Configuração'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}