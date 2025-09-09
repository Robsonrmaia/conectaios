import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wand2, Image, Download, Sparkles } from 'lucide-react';

export default function ImageCreator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('huggingface');

  const generateWithHuggingFace = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira uma descrição para a imagem');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-with-gemini', {
        body: { 
          prompt: `Professional real estate image: ${prompt}`,
          model: 'black-forest-labs/FLUX.1-schnell'
        }
      });

      if (error) throw error;

      if (data?.image) {
        setGeneratedImages(prev => [data.image, ...prev.slice(0, 7)]);
        toast.success('Imagem gerada com sucesso!');
      } else {
        toast.error('Falha ao gerar imagem');
      }
    } catch (error: any) {
      console.error('Erro ao gerar imagem:', error);
      toast.error(`Erro: ${error.message || 'Falha ao gerar imagem'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithGemini = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira uma descrição para a imagem');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-image-generator', {
        body: { 
          prompt,
          type: 'general'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Descrição gerada pelo Gemini!');
        toast.info(data.text || 'Use o botão Hugging Face para gerar a imagem');
      } else {
        toast.error('Falha ao gerar com Gemini');
      }
    } catch (error: any) {
      console.error('Erro ao gerar com Gemini:', error);
      toast.error(`Erro: ${error.message || 'Falha ao gerar com Gemini'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `imagem-gerada-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao fazer download da imagem');
    }
  };

  const predefinedPrompts = [
    'Uma casa moderna minimalista com jardim',
    'Apartamento luxuoso com vista para o mar',
    'Escritório corporativo elegante',
    'Loja comercial contemporânea',
    'Casa de campo aconchegante',
    'Prédio residencial moderno'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
          <Wand2 className="h-8 w-8" />
          Criador de Imagens IA
        </h1>
        <p className="text-muted-foreground">
          Gere imagens incríveis usando inteligência artificial
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Geração de Imagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Descreva a imagem que você quer criar</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Uma casa moderna com jardim, estilo minimalista, iluminação natural..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Sugestões rápidas:</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedPrompts.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="huggingface">Hugging Face</TabsTrigger>
              <TabsTrigger value="gemini">Gemini 2.5 Pro</TabsTrigger>
            </TabsList>

            <TabsContent value="huggingface" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Gere imagens de alta qualidade usando modelos FLUX da Hugging Face
              </div>
              <Button
                onClick={generateWithHuggingFace}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Gerando imagem...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Gerar Imagem
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="gemini" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Use o Gemini 2.5 Pro para melhorar e expandir sua descrição
              </div>
              <Button
                onClick={generateWithGemini}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                variant="outline"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    Processando com Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Melhorar Descrição
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imagens Geradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((imageUrl, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Imagem gerada ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', e);
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        size="sm"
                        onClick={() => downloadImage(imageUrl, index)}
                        className="bg-white/20 hover:bg-white/30"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}