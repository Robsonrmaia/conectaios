import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { DomainConfiguration } from '@/components/DomainConfiguration';
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
import { useMinisite } from '@/hooks/useMinisite';

const TEMPLATES = [
  { id: 'modern', name: 'Moderno', preview: '/templates/modern.jpg' },
  { id: 'classic', name: 'Clássico', preview: '/templates/classic.jpg' },
  { id: 'minimal', name: 'Minimalista', preview: '/templates/minimal.jpg' },
  { id: 'luxury', name: 'Luxo', preview: '/templates/luxury.jpg' }
];

export function MinisiteEditorIntegrated() {
  const { user } = useAuth();
  const { broker, updateBrokerProfile } = useBroker();
  const { config, loading, updateConfig, saveConfig, generateUrl } = useMinisite();
  const [preview, setPreview] = useState('desktop');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!config) return;
    
    setIsSaving(true);
    try {
      await saveConfig();
      await generateUrl();
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'cover' | 'avatar') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('property-images')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando configurações...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

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
          <Tabs value="design" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="domain">Domínio</TabsTrigger>
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
                          config.template_id === template.id 
                            ? 'border-primary' 
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        onClick={() => updateConfig({ template_id: template.id })}
                      >
                        <div className="aspect-video bg-muted rounded mb-2" />
                        <p className="text-sm font-medium text-center">{template.name}</p>
                        {config.template_id === template.id && (
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
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Cor Principal</Label>
                      <div className="mt-2">
                        <ColorPicker
                          value={config.primary_color}
                          onChange={(color) => updateConfig({ primary_color: color })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Cor Secundária</Label>
                      <div className="mt-2">
                        <ColorPicker
                          value={config.secondary_color}
                          onChange={(color) => updateConfig({ secondary_color: color })}
                        />
                      </div>
                    </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Sobre o Corretor</Label>
                      <Switch 
                        checked={config.show_about}
                        onCheckedChange={(checked) => updateConfig({ show_about: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Imóveis</Label>
                      <Switch 
                        checked={config.show_properties}
                        onCheckedChange={(checked) => updateConfig({ show_properties: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Formulário de Contato</Label>
                      <Switch 
                        checked={config.show_contact_form}
                        onCheckedChange={(checked) => updateConfig({ show_contact_form: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Telefone/WhatsApp</Label>
                    <Input
                      value={config.phone || ''}
                      onChange={(e) => updateConfig({ phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={config.email || ''}
                      onChange={(e) => updateConfig({ email: e.target.value })}
                      placeholder="contato@exemplo.com"
                    />
                  </div>

                  <div>
                    <Label>Mensagem Personalizada</Label>
                    <Textarea
                      value={config.custom_message || ''}
                      onChange={(e) => updateConfig({ custom_message: e.target.value })}
                      placeholder="Mensagem que aparecerá no seu minisite..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Imagens do Perfil
                  </CardTitle>
                  <CardDescription>
                    Faça upload das imagens do seu perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="space-y-2">
                    <Label>Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      {broker?.avatar_url ? (
                        <img 
                          src={broker.avatar_url} 
                          alt="Avatar atual"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'avatar');
                          }}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                          <Button variant="outline" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Alterar Foto
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Cover Upload */}
                  <div className="space-y-2">
                    <Label>Imagem de Capa</Label>
                    <div className="space-y-4">
                      {broker?.cover_url ? (
                        <img 
                          src={broker.cover_url} 
                          alt="Capa atual"
                          className="w-full h-32 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'cover');
                          }}
                          className="hidden"
                          id="cover-upload"
                        />
                        <Label htmlFor="cover-upload" className="cursor-pointer">
                          <Button variant="outline" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Alterar Capa
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>
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
                    <Label>Título do Mini Site</Label>
                    <Input
                      value={config.title}
                      onChange={(e) => updateConfig({ title: e.target.value })}
                      placeholder="Seu Nome - Corretor de Imóveis"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.title.length}/60 caracteres
                    </p>
                  </div>
                  
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={config.description || ''}
                      onChange={(e) => updateConfig({ description: e.target.value })}
                      placeholder="Encontre o imóvel dos seus sonhos com atendimento especializado..."
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(config.description || '').length}/160 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domain" className="space-y-4">
              <DomainConfiguration />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`
                mx-auto border rounded-lg overflow-hidden bg-muted/50
                ${preview === 'mobile' ? 'max-w-sm' : 
                  preview === 'tablet' ? 'max-w-md' : 'w-full'}
              `}>
                <div className="aspect-video bg-white flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div 
                      className="w-12 h-12 rounded-full mx-auto"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <h3 className="font-semibold">{config.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Preview do minisite em {preview === 'mobile' ? 'celular' : 
                                             preview === 'tablet' ? 'tablet' : 'desktop'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL Info */}
          <Card>
            <CardHeader>
              <CardTitle>URL do Mini Site</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {config.generated_url || '/broker/' + broker?.username}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este será o endereço público do seu mini site
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}