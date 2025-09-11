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
import { MinisitePreview } from '@/components/MinisitePreview';
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
  Monitor,
  Sparkles,
  Wand2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { useMinisite } from '@/hooks/useMinisite';
import { ImageGeneratorModal } from '@/components/ImageGeneratorModal';
import { ConectaIOSImageModal } from '@/components/ConectaIOSImageModal';

const TEMPLATES = [
  { 
    id: 'modern', 
    name: 'Moderno', 
    preview: '/templates/modern.jpg',
    description: 'Design limpo e contemporâneo',
    colors: { primary: '#1CA9C9', secondary: '#64748B' },
    style: 'modern'
  },
  { 
    id: 'classic', 
    name: 'Clássico', 
    preview: '/templates/classic.jpg',
    description: 'Elegante e tradicional',
    colors: { primary: '#8B5CF6', secondary: '#374151' },
    style: 'classic'
  },
  { 
    id: 'minimal', 
    name: 'Minimalista', 
    preview: '/templates/minimal.jpg',
    description: 'Simplicidade e foco no conteúdo',
    colors: { primary: '#10B981', secondary: '#6B7280' },
    style: 'minimal'
  },
  { 
    id: 'luxury', 
    name: 'Luxo', 
    preview: '/templates/luxury.jpg',
    description: 'Sofisticado para imóveis premium',
    colors: { primary: '#F59E0B', secondary: '#1F2937' },
    style: 'luxury'
  }
];

export function MinisiteEditorIntegrated() {
  const { user } = useAuth();
  const { broker, updateBrokerProfile } = useBroker();
  const { config, loading, updateConfig, saveConfig, generateUrl } = useMinisite();
  const [preview, setPreview] = useState('desktop');
  const [activeTab, setActiveTab] = useState('design');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imageGeneratorType, setImageGeneratorType] = useState<'logo' | 'banner' | 'cover'>('logo');

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
      } else if (type === 'logo') {
        await updateBrokerProfile({ avatar_url: data.publicUrl }); // Logo uses avatar_url for now
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

  const generateWithGemini = async (prompt: string, type: 'logo' | 'cover') => {
    setIsGeneratingLogo(true);
    try {
      console.log('Starting Gemini generation with prompt:', prompt, 'type:', type);
      
      const response = await supabase.functions.invoke('generate-with-gemini', {
        body: { prompt, type }
      });

      console.log('Gemini generation response:', response);

      if (response.error) {
        console.error('Gemini generation error:', response.error);
        throw new Error(response.error.message || 'Erro na geração com Gemini');
      }

      // Since Gemini 2.5 Nano doesn't generate images directly, show the text response
      if (response.data?.text) {
        toast({
          title: "Gemini Nano - Sugestão Gerada",
          description: `Sugestão: ${response.data.text}. Use esta descrição com o botão "Gerar com IA" para criar a imagem.`,
        });
      } else if (response.data?.note) {
        toast({
          title: "Info",
          description: response.data.note,
        });
      }
    } catch (error) {
      console.error('Error with Gemini:', error);
      
      toast({
        title: "Erro",
        description: "Erro ao processar com Gemini. Tente novamente ou use o gerador com IA.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const generateCoverWithAI = async (prompt: string) => {
    setIsGeneratingLogo(true);
    try {
      console.log('Starting cover generation with prompt:', prompt);
      
      const enhancedPrompt = `Professional real estate cover image: ${prompt}. High quality, architectural photography style, bright and welcoming`;
      
      const response = await supabase.functions.invoke('generate-logo', {
        body: { prompt: enhancedPrompt }
      });

      console.log('Cover generation response:', response);

      if (response.error) {
        console.error('Cover generation error:', response.error);
        throw new Error(response.error.message || 'Erro na geração da capa');
      }

      if (!response.data?.image) {
        throw new Error('Nenhuma imagem foi retornada');
      }

      // Convert base64 to blob and upload
      const base64Data = response.data.image.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const file = new File([blob], `cover_${Date.now()}.png`, { type: 'image/png' });
      await handleImageUpload(file, 'cover');
      
      toast({
        title: "Capa gerada!",
        description: "Sua imagem de capa foi criada e aplicada com sucesso.",
      });
    } catch (error) {
      console.error('Error generating cover:', error);
      
      let errorMessage = "Erro ao gerar capa. Tente novamente.";
      if (error.message?.includes('insufficient permissions')) {
        errorMessage = "Token do Hugging Face sem permissão. Configure um novo token.";
      } else if (error.message?.includes('token not configured')) {
        errorMessage = "Token do Hugging Face não configurado.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const generateLogoWithAI = async (prompt: string) => {
    setIsGeneratingLogo(true);
    try {
      console.log('Starting logo generation with prompt:', prompt);
      
      const response = await supabase.functions.invoke('generate-logo', {
        body: { prompt }
      });

      console.log('Logo generation response:', response);

      if (response.error) {
        console.error('Logo generation error:', response.error);
        throw new Error(response.error.message || 'Erro na geração do logo');
      }

      if (!response.data?.image) {
        throw new Error('Nenhuma imagem foi retornada');
      }

      // Convert base64 to blob and upload
      const base64Data = response.data.image.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const file = new File([blob], `logo_${Date.now()}.png`, { type: 'image/png' });
      await handleImageUpload(file, 'logo');
      
      toast({
        title: "Logo gerado!",
        description: "Seu logo foi criado e aplicado com sucesso.",
      });
    } catch (error) {
      console.error('Error generating logo:', error);
      
      // Show more specific error messages
      let errorMessage = "Erro ao gerar logo. Tente novamente.";
      if (error.message?.includes('insufficient permissions')) {
        errorMessage = "Token do Hugging Face sem permissão. Configure um novo token.";
      } else if (error.message?.includes('token not configured')) {
        errorMessage = "Token do Hugging Face não configurado.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleImageGenerated = async (imageUrl: string) => {
    try {
      if (imageGeneratorType === 'logo') {
        // Convert data URL to blob and upload
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `logo-${Date.now()}.png`, { type: 'image/png' });
        await handleImageUpload(file, 'logo');
      }
    } catch (error) {
      console.error('Error applying generated image:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar imagem gerada",
        variant: "destructive"
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
      <div className="flex items-center justify-end">        
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6 order-2 lg:order-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1 p-1">
              <TabsTrigger value="design" className="text-xs sm:text-sm">Design</TabsTrigger>
              <TabsTrigger value="content" className="text-xs sm:text-sm">Conteúdo</TabsTrigger>
              <TabsTrigger value="images" className="text-xs sm:text-sm">Imagens</TabsTrigger>
              <TabsTrigger value="seo" className="text-xs sm:text-sm">SEO</TabsTrigger>
              <TabsTrigger value="domain" className="text-xs sm:text-sm">Domínio</TabsTrigger>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {TEMPLATES.map((template) => (
                       <div
                         key={template.id}
                         className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                           config.template_id === template.id 
                             ? 'border-primary bg-primary/5' 
                             : 'border-border hover:border-muted-foreground hover:bg-muted/30'
                         }`}
                         onClick={() => {
                           updateConfig({ 
                             template_id: template.id,
                             primary_color: template.colors.primary,
                             secondary_color: template.colors.secondary
                           });
                         }}
                       >
                         <div className="aspect-video rounded mb-2 bg-gradient-to-br overflow-hidden" style={{
                           background: `linear-gradient(135deg, ${template.colors.primary}15, ${template.colors.secondary}15)`
                         }}>
                           {template.id === 'modern' && (
                             <svg viewBox="0 0 200 120" className="w-full h-full">
                               <rect width="200" height="120" fill="#f8fafc"/>
                               <rect width="200" height="20" fill={template.colors.primary}/>
                               <rect x="20" y="35" width="160" height="8" rx="4" fill="#e2e8f0"/>
                               <rect x="20" y="50" width="120" height="6" rx="3" fill="#cbd5e1"/>
                               <rect x="20" y="70" width="50" height="30" rx="8" fill={template.colors.primary} opacity="0.8"/>
                               <rect x="80" y="70" width="50" height="30" rx="8" fill={template.colors.secondary} opacity="0.6"/>
                               <rect x="140" y="70" width="40" height="30" rx="8" fill="#e2e8f0"/>
                             </svg>
                           )}
                           {template.id === 'classic' && (
                             <svg viewBox="0 0 200 120" className="w-full h-full">
                               <rect width="200" height="120" fill="#fefefe"/>
                               <rect x="10" y="10" width="180" height="100" rx="8" fill="none" stroke={template.colors.primary} strokeWidth="2"/>
                               <rect x="20" y="25" width="160" height="12" rx="6" fill={template.colors.primary}/>
                               <rect x="30" y="45" width="140" height="6" rx="3" fill="#94a3b8"/>
                               <rect x="30" y="60" width="100" height="4" rx="2" fill="#cbd5e1"/>
                               <circle cx="40" cy="85" r="8" fill={template.colors.secondary}/>
                               <circle cx="65" cy="85" r="8" fill={template.colors.secondary} opacity="0.7"/>
                               <circle cx="90" cy="85" r="8" fill={template.colors.secondary} opacity="0.5"/>
                               <rect x="120" y="77" width="60" height="16" rx="8" fill={template.colors.primary} opacity="0.8"/>
                             </svg>
                           )}
                           {template.id === 'minimal' && (
                             <svg viewBox="0 0 200 120" className="w-full h-full">
                               <rect width="200" height="120" fill="#ffffff"/>
                               <line x1="20" y1="30" x2="180" y2="30" stroke={template.colors.primary} strokeWidth="1"/>
                               <rect x="20" y="40" width="80" height="4" rx="2" fill="#64748b"/>
                               <rect x="20" y="50" width="60" height="3" rx="1.5" fill="#94a3b8"/>
                               <rect x="140" y="40" width="40" height="40" rx="20" fill={template.colors.primary} opacity="0.1"/>
                               <circle cx="160" cy="60" r="15" fill="none" stroke={template.colors.primary} strokeWidth="2"/>
                               <rect x="20" y="70" width="30" height="3" rx="1.5" fill="#cbd5e1"/>
                               <rect x="20" y="80" width="25" height="3" rx="1.5" fill="#e2e8f0"/>
                             </svg>
                           )}
                           {template.id === 'luxury' && (
                             <svg viewBox="0 0 200 120" className="w-full h-full">
                               <defs>
                                 <linearGradient id="luxuryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                   <stop offset="0%" stopColor={template.colors.primary}/>
                                   <stop offset="100%" stopColor={template.colors.secondary}/>
                                 </linearGradient>
                               </defs>
                               <rect width="200" height="120" fill="#0f172a"/>
                               <rect x="20" y="20" width="160" height="80" rx="12" fill="url(#luxuryGrad)" opacity="0.15"/>
                               <rect x="30" y="30" width="140" height="8" rx="4" fill={template.colors.primary}/>
                               <rect x="40" y="45" width="120" height="4" rx="2" fill="#fbbf24"/>
                               <polygon points="60,65 80,55 100,65 80,75" fill={template.colors.primary} opacity="0.8"/>
                               <polygon points="110,65 130,55 150,65 130,75" fill={template.colors.secondary} opacity="0.6"/>
                               <rect x="40" y="85" width="120" height="2" rx="1" fill="#fbbf24" opacity="0.5"/>
                             </svg>
                           )}
                         </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                        {config.template_id === template.id && (
                          <Badge className="absolute -top-2 -right-2 bg-primary">Ativo</Badge>
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
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Logo da Empresa</Label>
                    <div className="flex items-center gap-4">
                      {broker?.avatar_url ? (
                        <img 
                          src={broker.avatar_url} 
                          alt="Logo atual"
                          className="w-16 h-16 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'logo');
                            }}
                            className="hidden"
                            id="logo-upload"
                         />
                         <Label htmlFor="logo-upload" className="cursor-pointer">
                           <Button variant="outline" asChild>
                             <span>
                               <Upload className="h-4 w-4 mr-2" />
                               Upload Logo
                             </span>
                           </Button>
                         </Label>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setImageGeneratorType('logo');
                              setShowImageGenerator(true);
                            }}
                            disabled={isGeneratingLogo}
                          >
                            <Wand2 className="h-4 w-4 mr-2" />
                            Gerar Logo com IA
                          </Button>
                       </div>
                      </div>
                    </div>
                  </div>

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
                        <div className="flex gap-2">
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
                                Upload Capa
                              </span>
                            </Button>
                          </Label>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const prompt = window.prompt("Descreva a imagem de capa (ex: 'casa moderna com jardim', 'prédio elegante'):");
                              if (prompt) generateCoverWithAI(prompt);
                            }}
                            disabled={isGeneratingLogo}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {isGeneratingLogo ? 'Gerando...' : 'Criar Capa com IA'}
                          </Button>
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
        <div className="space-y-4 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview do Mini Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MinisitePreview 
                config={config}
                broker={broker}
                preview={preview}
              />
              
              {config.generated_url && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">URL do Mini Site:</p>
                  <code className="text-xs bg-white p-1 rounded break-all">{config.generated_url || '/broker/' + broker?.username}</code>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <ConectaIOSImageModal
        isOpen={showImageGenerator}
        onClose={() => setShowImageGenerator(false)}
        onImageGenerated={handleImageGenerated}
        type={imageGeneratorType}
      />
    </div>
  );
}