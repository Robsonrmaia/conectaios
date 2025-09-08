import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BarChart3,
  Palette,
  Layout,
  TrendingUp,
  Users
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { MinisiteEditorIntegrated } from '@/components/MinisiteEditorIntegrated';
import { MinisiteProvider } from '@/hooks/useMinisite';
import { MinisiteAnalytics } from '@/components/MinisiteAnalytics';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { generateMinisiteUrl, cleanUsername } from '@/lib/urls';

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
    setIsEnabled(broker.status === 'active'); // 👈 importantíssimo
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
      username: profile.username || cleanUsername(profile.name),
      status: isEnabled ? 'active' : 'inactive',
    });
    toast({ title: "Perfil Atualizado!", description: "Seu mini site foi atualizado com sucesso." });
  } catch (error) {
    console.error('Error updating profile:', error);
    toast({ title: "Erro", description: "Erro ao atualizar perfil. Tente novamente.", variant: "destructive" });
  } finally {
    setIsSaving(false);
  }
};

  const copyMinisiteUrl = () => {
    const username = profile.username || 'seu-usuario';
    const url = generateMinisiteUrl(username);
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copiado!",
      description: "O link do seu mini site foi copiado.",
    });
  };

  // Show setup wizard if no username is configured
  if (!broker?.username) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            Mini Site do Corretor
          </h1>
          <p className="text-muted-foreground">
            Configure seu minisite público para compartilhar com clientes
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Configure seu Minisite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Primeiro, configure seu username para criar seu minisite.
            </p>
            <Button onClick={() => window.location.reload()}>
              Configurar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MinisiteProvider>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            Mini Site do Corretor
          </h1>
          <p className="text-muted-foreground">
            Configure e monitore seu mini site público
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyMinisiteUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
          
          <Button variant="outline" asChild>
            <a 
              href={generateMinisiteUrl(profile.username || 'seu-usuario')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visualizar
            </a>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visitas Totais</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imóveis Ativos</p>
                <p className="text-2xl font-bold">{stats.activeProperties}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contatos</p>
                <p className="text-2xl font-bold">{stats.contactsReceived}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">
                  {stats.totalViews > 0 ? ((stats.contactsReceived / stats.totalViews) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração Básica</CardTitle>
          <CardDescription>
            Configure as informações essenciais do seu mini site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile({...profile, username: cleanUsername(e.target.value)})}
                placeholder="seu-nome-usuario"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Seu mini site será: {generateMinisiteUrl(profile.username || 'seu-usuario')}
              </p>
            </div>
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                placeholder="Seu nome completo"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
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

      {/* Main Tabs */}
      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Editor Visual
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <MinisiteEditorIntegrated />
        </TabsContent>

        <TabsContent value="analytics">
          <MinisiteAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* URL Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de URL</CardTitle>
              <CardDescription>
                Gerencie como seu mini site é acessado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL Atual</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={generateMinisiteUrl(profile.username || 'seu-usuario')}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" onClick={copyMinisiteUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mini Site Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Tornar seu mini site público e acessível
                  </p>
                </div>
                <Switch 
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle>Privacidade e Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Indexação no Google</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que o Google encontre seu mini site
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Analytics Público</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar estatísticas básicas no mini site
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* WhatsApp Button */}
      <WhatsAppButton 
        phone={broker?.phone}
        message={`Olá ${broker?.name}! Gostaria de saber mais sobre seu mini site.`}
        showOnScroll={true}
      />
      </div>
    </MinisiteProvider>
  );
}
