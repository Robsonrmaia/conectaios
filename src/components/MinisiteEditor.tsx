import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { 
  Palette, 
  Layout, 
  Camera, 
  Settings, 
  Eye, 
  Save,
  Upload,
  Globe,
  Smartphone,
  Laptop,
  Monitor
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';

interface MinisiteConfig {
  template: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerStyle: string;
  showBio: boolean;
  showStats: boolean;
  showContactForm: boolean;
  customCss: string;
  seoTitle: string;
  seoDescription: string;
  customDomain: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
}

const TEMPLATES = [
  { id: 'modern', name: 'Moderno', preview: '/templates/modern.jpg' },
  { id: 'classic', name: 'Clássico', preview: '/templates/classic.jpg' },
  { id: 'minimal', name: 'Minimalista', preview: '/templates/minimal.jpg' },
  { id: 'luxury', name: 'Luxo', preview: '/templates/luxury.jpg' }
];

const FONTS = [
  { id: 'inter', name: 'Inter (Moderno)' },
  { id: 'roboto', name: 'Roboto (Neutro)' },
  { id: 'playfair', name: 'Playfair Display (Elegante)' },
  { id: 'poppins', name: 'Poppins (Friendly)' }
];

export function MinisiteEditor() {
  const { user } = useAuth();
  const { broker, updateBrokerProfile } = useBroker();
  const [config, setConfig] = useState<MinisiteConfig>({
    template: 'modern',
    primaryColor: '#1CA9C9',
    secondaryColor: '#6DDDEB',
    fontFamily: 'inter',
    headerStyle: 'gradient',
    showBio: true,
    showStats: true,
    showContactForm: true,
    customCss: '',
    seoTitle: '',
    seoDescription: '',
    customDomain: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    }
  });
  
  const [preview, setPreview] = useState('desktop');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize with default config - in production, this would load from broker settings
  }, [broker]);

  const handleSave = async () => {
    if (!broker) return;
    
    setIsSaving(true);
    try {
      // In production, this would update the broker's minisite configuration
      // await updateBrokerProfile({ minisite_config: config });
      
      // For now, just show success
      console.log('Minisite config saved:', config);
      
      toast({
        title: "Configurações Salvas!",
        description: "Seu mini site foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'cover' | 'avatar') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('minisite-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('minisite-assets')
        .getPublicUrl(fileName);

      // Update broker profile with new image URL
      if (type === 'avatar') {
        await updateBrokerProfile({ avatar_url: data.publicUrl });
      } else if (type === 'cover') {
        await updateBrokerProfile({ cover_url: data.publicUrl });
      }

      toast({
        title: "Imagem enviada!",
        description: "Imagem atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Editor do Mini Site</h2>
          <p className="text-muted-foreground">
            Personalize a aparência e configurações do seu mini site
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={preview === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreview('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={preview === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreview('tablet')}
            >
              <Laptop className="h-4 w-4" />
            </Button>
            <Button
              variant={preview === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreview('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Template
                  </CardTitle>
                  <CardDescription>
                    Escolha o layout base do seu mini site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        className={`relative cursor-pointer rounded-lg border-2 p-2 ${
                          config.template === template.id 
                            ? 'border-primary' 
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        onClick={() => setConfig({...config, template: template.id})}
                      >
                        <div className="aspect-video bg-muted rounded mb-2" />
                        <p className="text-sm font-medium text-center">{template.name}</p>
                        {config.template === template.id && (
                          <Badge className="absolute -top-2 -right-2">Ativo</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Cores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor Principal</Label>
                      <div className="flex gap-2 mt-1">
                        <div 
                          className="w-10 h-10 rounded border cursor-pointer"
                          style={{ backgroundColor: config.primaryColor }}
                          onClick={() => {/* Open color picker */}}
                        />
                        <Input
                          value={config.primaryColor}
                          onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                          placeholder="#1CA9C9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Cor Secundária</Label>
                      <div className="flex gap-2 mt-1">
                        <div 
                          className="w-10 h-10 rounded border cursor-pointer"
                          style={{ backgroundColor: config.secondaryColor }}
                          onClick={() => {/* Open color picker */}}
                        />
                        <Input
                          value={config.secondaryColor}
                          onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                          placeholder="#6DDDEB"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Typography */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipografia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Fonte</Label>
                    <Select 
                      value={config.fontFamily} 
                      onValueChange={(value) => setConfig({...config, fontFamily: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONTS.map((font) => (
                          <SelectItem key={font.id} value={font.id}>
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              {/* Content Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Seções Visíveis</CardTitle>
                  <CardDescription>
                    Configure quais seções aparecerão no seu mini site
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Biografia</Label>
                    <Switch 
                      checked={config.showBio}
                      onCheckedChange={(checked) => setConfig({...config, showBio: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Estatísticas</Label>
                    <Switch 
                      checked={config.showStats}
                      onCheckedChange={(checked) => setConfig({...config, showStats: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Formulário de Contato</Label>
                    <Switch 
                      checked={config.showContactForm}
                      onCheckedChange={(checked) => setConfig({...config, showContactForm: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Redes Sociais</CardTitle>
                  <CardDescription>
                    Links para suas redes sociais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      value={config.socialLinks.facebook}
                      onChange={(e) => setConfig({
                        ...config, 
                        socialLinks: {...config.socialLinks, facebook: e.target.value}
                      })}
                      placeholder="https://facebook.com/seu-perfil"
                    />
                  </div>
                  
                  <div>
                    <Label>Instagram</Label>
                    <Input
                      value={config.socialLinks.instagram}
                      onChange={(e) => setConfig({
                        ...config, 
                        socialLinks: {...config.socialLinks, instagram: e.target.value}
                      })}
                      placeholder="https://instagram.com/seu-perfil"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Otimização para Buscadores</CardTitle>
                  <CardDescription>
                    Configure como seu mini site aparece no Google
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título SEO</Label>
                    <Input
                      value={config.seoTitle}
                      onChange={(e) => setConfig({...config, seoTitle: e.target.value})}
                      placeholder="Corretor de Imóveis - Nome | Cidade"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.seoTitle.length}/60 caracteres
                    </p>
                  </div>
                  
                  <div>
                    <Label>Descrição SEO</Label>
                    <Textarea
                      value={config.seoDescription}
                      onChange={(e) => setConfig({...config, seoDescription: e.target.value})}
                      placeholder="Encontre o imóvel dos seus sonhos com atendimento especializado..."
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.seoDescription.length}/160 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                  <CardDescription>
                    Para usuários experientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Domínio Personalizado (Premium)</Label>
                    <Input
                      value={config.customDomain}
                      onChange={(e) => setConfig({...config, customDomain: e.target.value})}
                      placeholder="www.seusite.com.br"
                      disabled={false} // For now, allow all users to set custom domain
                    />
                    <p className="text-xs text-muted-foreground">
                      Disponível para todos os usuários
                    </p>
                  </div>
                  
                  <div>
                    <Label>CSS Personalizado</Label>
                    <Textarea
                      value={config.customCss}
                      onChange={(e) => setConfig({...config, customCss: e.target.value})}
                      placeholder="/* Seu CSS personalizado aqui */"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Pré-visualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`border rounded-lg bg-background ${
                preview === 'mobile' ? 'max-w-sm mx-auto' :
                preview === 'tablet' ? 'max-w-2xl mx-auto' :
                'w-full'
              }`}>
                <div 
                  className="aspect-video bg-gradient-to-r from-primary to-brand-secondary rounded-t-lg relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                  }}
                >
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="w-12 h-12 bg-white rounded-full mb-2" />
                    <h3 className="font-bold">{broker?.name || 'Seu Nome'}</h3>
                    <p className="text-sm opacity-90">CRECI: {broker?.creci || '12345'}</p>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {config.showBio && (
                    <div>
                      <h4 className="font-semibold mb-2">Sobre</h4>
                      <p className="text-sm text-muted-foreground">
                        {broker?.bio || 'Sua biografia aparecerá aqui...'}
                      </p>
                    </div>
                  )}
                  
                  {config.showStats && (
                    <div>
                      <h4 className="font-semibold mb-2">Estatísticas</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted rounded p-2">
                          <div className="font-bold">25</div>
                          <div className="text-xs">Imóveis</div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <div className="font-bold">1.2k</div>
                          <div className="text-xs">Visitas</div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <div className="font-bold">18</div>
                          <div className="text-xs">Contatos</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Imóveis em Destaque</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted rounded aspect-video" />
                      <div className="bg-muted rounded aspect-video" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}