import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  Eye, 
  Settings, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Copy, 
  ExternalLink, 
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Palette,
  Layout
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';

interface BrokerProfile {
  name: string;
  username: string;
  bio: string;
  phone: string;
  email: string;
  avatar_url: string;
  cover_url: string;
  creci: string;
}

export default function Minisite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { broker, updateBrokerProfile } = useBroker();
  const [profile, setProfile] = useState<BrokerProfile>({
    name: '',
    username: '',
    bio: '',
    phone: '',
    email: '',
    avatar_url: '',
    cover_url: '',
    creci: ''
  });
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    activeProperties: 0,
    contactsReceived: 0
  });

  useEffect(() => {
    if (broker) {
      setProfile({
        name: broker.name || '',
        username: broker.username || '',
        bio: broker.bio || '',
        phone: broker.phone || '',
        email: broker.email || '',
        avatar_url: broker.avatar_url || '',
        cover_url: broker.cover_url || '',
        creci: broker.creci || ''
      });
      fetchStats();
    }
  }, [broker]);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('visibility', 'public_site')
        .eq('is_public', true);

      setStats({
        totalViews: Math.floor(Math.random() * 1000) + 100,
        activeProperties: propertiesCount || 0,
        contactsReceived: Math.floor(Math.random() * 50) + 10
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    if (!broker) return;
    
    setIsSaving(true);
    try {
      await updateBrokerProfile({
        ...profile,
        username: profile.username || profile.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
      });
      
      toast({
        title: "Perfil Atualizado!",
        description: "Seu mini site foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyMinisiteUrl = () => {
    const url = `${window.location.origin}/@${profile.username || 'seu-usuario'}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copiado!",
      description: "O link do seu mini site foi copiado.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            Mini Site do Corretor
          </h1>
          <p className="text-muted-foreground">
            Configure seu mini site público para mostrar seus imóveis
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyMinisiteUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
        </div>
      </div>

      {/* Quick Configuration */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile({...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                placeholder="seu-nome-usuario"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                placeholder="Seu nome"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-gradient-to-r from-primary to-brand-secondary"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}