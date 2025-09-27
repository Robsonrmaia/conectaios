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
  FileText
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
  { id: 'elegant', name: 'Elegante', colors: { primary: '#8B5CF6', secondary: '#A78BFA' } },
  { id: 'professional', name: 'Profissional', colors: { primary: '#059669', secondary: '#10B981' } },
  { id: 'luxury', name: 'Luxo', colors: { primary: '#DC2626', secondary: '#EF4444' } }
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

  const MinisitePreview = () => (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="h-96 p-6"
        style={{ 
          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
          color: 'white'
        }}
      >
        {/* Preview Content */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center">
            <Globe className="h-10 w-10 text-white" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
            <p className="text-white/90">{config.description}</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              {config.phone}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {config.email}
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              São Paulo, SP
            </div>
          </div>
          
          {config.customMessage && (
            <div className="bg-white/10 rounded-lg p-3 text-sm">
              "{config.customMessage}"
            </div>
          )}
          
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="secondary">
              Ver Imóveis
            </Button>
            <Button size="sm" variant="outline" className="text-white border-white">
              Contato
            </Button>
          </div>
        </div>
        
        {/* Mock sections */}
        <div className="mt-8 space-y-4 bg-white/10 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span>📍 Imóveis Disponíveis</span>
            <Badge variant="secondary">12 imóveis</Badge>
          </div>
          {config.showAbout && (
            <div className="text-xs">
              ⭐ "Excelente atendimento!" - Cliente satisfeito
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer rounded-lg border-2 p-3 text-center ${
                      config.template === template.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setConfig({
                      ...config, 
                      template: template.id,
                      primaryColor: template.colors.primary,
                      secondaryColor: template.colors.secondary
                    })}
                  >
                    <div 
                      className="w-full h-12 rounded mb-2"
                      style={{ background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})` }}
                    />
                    <p className="text-sm font-medium">{template.name}</p>
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