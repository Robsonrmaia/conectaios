import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/components/ui/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

export default function BrokerSetup() {
  const navigate = useNavigate();
  const { createBrokerProfile } = useBroker();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    creci: '',
    username: '',
    bio: '',
    region_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createBrokerProfile(formData);
      toast({
        title: "Perfil criado com sucesso!",
        description: "Bem-vindo ao ConectaIOS. Vamos começar?"
      });
      navigate('/app');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-brand-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-r from-primary to-brand-secondary rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
          <CardDescription>
            Vamos configurar sua conta de corretor no ConectaIOS
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creci">CRECI</Label>
                <Input
                  id="creci"
                  type="text"
                  value={formData.creci}
                  onChange={(e) => setFormData({...formData, creci: e.target.value})}
                  placeholder="CRECI 123456"
                />
              </div>
              
              <div>
                <Label htmlFor="username">Nome de usuário</Label>
                <div className="space-y-2">
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                    placeholder="robsoncorretor"
                    className="lowercase"
                  />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-primary">
                      Seu site será: <span className="font-mono bg-secondary px-2 py-1 rounded">
                        conectaios.com.br/{formData.username || 'seuusuario'}
                      </span>
                    </p>
                    <p className="text-xs">
                      ✓ Apenas letras minúsculas e números • ✓ Sem espaços ou caracteres especiais
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="region">Região de atuação</Label>
              <Select value={formData.region_id} onValueChange={(value) => setFormData({...formData, region_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ilheus">Ilhéus</SelectItem>
                  <SelectItem value="itabuna">Itabuna</SelectItem>
                  <SelectItem value="salvador">Salvador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Conte um pouco sobre você e sua experiência como corretor..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
              disabled={loading || !formData.name}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando perfil...
                </>
              ) : (
                'Criar Perfil'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}