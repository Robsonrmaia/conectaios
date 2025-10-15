import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  Monitor, 
  Smartphone, 
  Copy, 
  ExternalLink, 
  Palette, 
  Type, 
  Image, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Star,
  Eye,
  Share2,
  Layout,
  FileText,
  Building2
} from 'lucide-react';
import { useBroker } from '@/hooks/useBroker';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { generateMinisiteUrl, generateBrokerIdentifier, generateMinisitePath } from '@/lib/urls';

interface MinisiteConfig {
  template: string;
  primaryColor: string;
  secondaryColor: string;
  title: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
  customMessage: string;
  showProperties: boolean;
  showContactForm: boolean;
  showAbout: boolean;
}

const TEMPLATES = [
  { id: 'modern', name: 'Moderno', colors: { primary: '#1CA9C9', secondary: '#6DDDEB' } },
  { id: 'hero-visual', name: 'Hero Visual', colors: { primary: '#1CA9C9', secondary: '#6DDDEB' } }
];

export function FunctionalMinisite() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [config, setConfig] = useState<MinisiteConfig>({
    template: 'modern',
    primaryColor: '#1CA9C9',
    secondaryColor: '#6DDDEB',
    title: 'Meu Minisite Imobiliário',
    description: 'Encontre o imóvel dos seus sonhos',
    phone: '(11) 99999-9999',
    email: 'contato@corretor.com',
    whatsapp: '11999999999',
    customMessage: 'Olá! Sou especialista em imóveis e estou aqui para te ajudar.',
    showProperties: true,
    showContactForm: true,
    showAbout: true
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState('desktop');

  useEffect(() => {
    if (broker) {
      setConfig(prev => ({
        ...prev,
        title: `${(broker as any).nome || broker.name || 'Corretor'} - Corretor de Imóveis`,
        email: broker.email || prev.email,
        phone: (broker as any).telefone || (broker as any).phone || prev.phone,
        description: `Especialista em imóveis em ${(broker as any).cidade || (broker as any).city || 'São Paulo'}`
      }));
    }
  }, [broker]);

  const generateMinisite = async () => {
    if (!config.title.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um título para o seu minisite",
        variant: "destructive",
      });
      return;
    }

    if (!broker?.id) {
      toast({
        title: "Erro",
        description: "Dados do corretor não encontrados",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate unique identifier and paths using utilities
      const uniqueId = generateBrokerIdentifier(broker);
      const minisitePath = generateMinisitePath(uniqueId);
      
      // Save or update minisite config in database
      const minisiteData = {
        user_id: broker?.user_id || user?.id, // Add required user_id field
        template_id: config.template,
        primary_color: config.primaryColor,
        secondary_color: config.secondaryColor,
        title: config.title,
        show_properties: config.showProperties,
        show_contact: config.showContactForm,
        show_about: config.showAbout
      };

      // Check if minisite config already exists
      const { data: existingConfig } = await supabase
        .from('minisite_configs')
        .select('id')
        .eq('user_id', broker?.user_id || user?.id) // Use user_id instead of broker_id
        .maybeSingle();

      let result;
      if (existingConfig) {
        // Update existing config
        result = await supabase
          .from('minisite_configs')
          .update(minisiteData)
          .eq('id', existingConfig.id)
          .select()
          .single();
      } else {
        // Insert new config
        result = await supabase
          .from('minisite_configs')
          .insert([minisiteData]) // Wrap in array for insert
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }
      
      const fullUrl = generateMinisiteUrl(uniqueId);
      setGeneratedUrl(fullUrl);
      
      toast({
        title: "Sucesso!",
        description: "Seu minisite foi gerado e salvo com sucesso!",
      });
    } catch (error) {
      console.error('Error generating minisite:', error);
      toast({
        title: "Erro",
        description: `Erro ao gerar minisite: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyUrl = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      toast({
        title: "URL copiada!",
        description: "Link do minisite copiado para área de transferência.",
      });
    }
  };

  const MinisitePreview = () => {
    const isHeroVisual = config.template === 'hero-visual';
    
    return (
      <div className="border rounded-lg overflow-hidden shadow-xl">
        {isHeroVisual ? (
          /* ========== HERO VISUAL: Preview gigante ========== */
          <div 
            className="relative min-h-[500px] bg-cover bg-center flex items-center justify-center"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop')`
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50"></div>
            
            {/* Conteúdo */}
            <div className="relative text-center text-white px-6 max-w-3xl space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Atendimento especializado
              </div>
              
              {/* Título GRANDE */}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {config.title}
              </h1>
              
              {/* Descrição */}
              <p className="text-lg text-white/90 max-w-xl mx-auto">
                {config.description}
              </p>
              
              {/* Contatos */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {config.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {config.email}
                </div>
              </div>
              
              {/* CTAs grandes */}
              <div className="flex justify-center gap-3 pt-2">
                <Button 
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8"
                >
                  Ver Imóveis
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white bg-white/10 hover:bg-white/20 backdrop-blur font-semibold px-8"
                >
                  Contato
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ========== MODERN: Preview simples ========== */
          <div 
            className="relative h-64 p-6 flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
            }}
          >
            <div className="text-center space-y-4 text-white max-w-lg">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm">
                <Building2 className="h-4 w-4" />
                Atendimento especializado
              </div>
              
              {/* Título */}
              <h1 className="text-2xl font-bold">
                {config.title}
              </h1>
              
              {/* Descrição */}
              <p className="text-white/90 text-sm">
                {config.description}
              </p>
              
              {/* Contatos */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-3 w-3" />
                  {config.phone}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-3 w-3" />
                  {config.email}
                </div>
              </div>
              
              {/* CTAs */}
              <div className="flex justify-center gap-2">
                <Button 
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
                >
                  Ver Imóveis
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-white text-white hover:bg-white/20"
                >
                  Contato
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Preview de imóveis (igual para ambos) */}
        <div className="p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Imóveis em Destaque</h2>
            <Badge>12 disponíveis</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-gray-100"></div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900">Apartamento</p>
                  <p className="text-lg font-bold" style={{ color: config.primaryColor }}>
                    R$ 450.000
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Minisite Funcional</h2>
          <p className="text-muted-foreground">
            Crie seu site profissional em minutos
          </p>
        </div>
        {generatedUrl && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyUrl}>
              <Share2 className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            <Button onClick={() => window.open(generatedUrl, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
                      config.template === template.id 
                        ? 'border-primary shadow-lg scale-105' 
                        : 'border-border hover:border-muted-foreground hover:shadow-md'
                    }`}
                    onClick={() => setConfig({
                      ...config, 
                      template: template.id,
                      primaryColor: template.colors.primary,
                      secondaryColor: template.colors.secondary
                    })}
                  >
                    {/* Preview visual do template */}
                    <div 
                      className={`w-full ${template.id === 'hero-visual' ? 'h-32' : 'h-20'} relative`}
                      style={{ 
                        background: template.id === 'hero-visual'
                          ? `linear-gradient(135deg, ${template.colors.primary}dd, ${template.colors.secondary}dd), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop') center/cover`
                          : `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})`
                      }}
                    >
                      {template.id === 'hero-visual' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="text-white text-center px-4">
                            <p className="text-xs font-semibold">Hero com imagem</p>
                            <p className="text-[10px] opacity-80">Visual impactante</p>
                          </div>
                        </div>
                      )}
                      {template.id === 'modern' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white text-center px-4">
                            <p className="text-xs font-semibold">Layout limpo</p>
                            <p className="text-[10px] opacity-80">Profissional</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Nome do template */}
                    <div className={`p-3 text-center ${
                      config.template === template.id 
                        ? 'bg-primary/5' 
                        : 'bg-white'
                    }`}>
                      <p className="text-sm font-semibold">{template.name}</p>
                      {config.template === template.id && (
                        <Badge className="mt-1" variant="default">
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título do Site</label>
                <Input
                  value={config.title}
                  onChange={(e) => setConfig({...config, title: e.target.value})}
                  placeholder="Meu Minisite Imobiliário"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={config.description}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  placeholder="Encontre o imóvel dos seus sonhos"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={config.phone}
                    onChange={(e) => setConfig({...config, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={config.email}
                    onChange={(e) => setConfig({...config, email: e.target.value})}
                    placeholder="contato@corretor.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">WhatsApp</label>
                <Input
                  value={config.whatsapp}
                  onChange={(e) => setConfig({...config, whatsapp: e.target.value})}
                  placeholder="11999999999"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Mensagem Personalizada</label>
                <Textarea
                  value={config.customMessage}
                  onChange={(e) => setConfig({...config, customMessage: e.target.value})}
                  placeholder="Sua mensagem de apresentação..."
                  rows={3}
                />
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
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cor Principal</label>
                  <div className="flex gap-2 mt-1">
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    <Input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Cor Secundária</label>
                  <div className="flex gap-2 mt-1">
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: config.secondaryColor }}
                    />
                    <Input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={generateMinisite}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando Minisite...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Gerar Minisite
              </>
            )}
          </Button>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </span>
                <div className="flex gap-1 text-xs">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    Desktop
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    Mobile
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}>
                <MinisitePreview />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {generatedUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  ✅ Minisite Publicado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL do Minisite</label>
                  <div className="flex gap-2 mt-1">
                    <Input value={generatedUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" onClick={copyUrl}>
                      Copiar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(generatedUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Site
                  </Button>
                  <Button variant="outline" className="w-full" onClick={copyUrl}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium mb-2">Próximos passos:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Compartilhe o link nas redes sociais</li>
                    <li>• Adicione à bio do Instagram/WhatsApp</li>
                    <li>• Inclua na assinatura de email</li>
                    <li>• Imprima em cartões de visita</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}