import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Wand2, Image, Download } from 'lucide-react';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageUrl: string) => void;
  type: 'logo' | 'banner' | 'cover';
}

export function ImageGeneratorModal({ isOpen, onClose, onImageGenerated, type }: ImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma descrição para a imagem",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-with-gemini', {
        body: { 
          prompt: `Professional ${type} for real estate: ${prompt}`,
          type: type
        }
      });

      if (error) throw error;

      if (data?.image) {
        setGeneratedImages(prev => [data.image, ...prev.slice(0, 3)]);
        toast({
          title: "Sucesso",
          description: "Imagem gerada com sucesso!"
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao gerar imagem",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: "Erro",
        description: `Erro: ${error.message || 'Falha ao gerar imagem'}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = (imageUrl: string) => {
    onImageGenerated(imageUrl);
    onClose();
    toast({
      title: "Sucesso",
      description: `${type === 'logo' ? 'Logo' : type === 'banner' ? 'Banner' : 'Capa'} aplicada com sucesso!`
    });
  };

  const predefinedPrompts = {
    logo: [
      'Logo moderna para imobiliária',
      'Logo minimalista corretor de imóveis', 
      'Logo elegante real estate',
      'Logo profissional propriedades'
    ],
    banner: [
      'Banner moderno imobiliária',
      'Banner elegante vendas imóveis',
      'Banner profissional corretor',
      'Banner luxury properties'
    ],
    cover: [
      'Capa moderna para corretor',
      'Capa elegante imobiliária',
      'Capa profissional real estate',
      'Capa minimalista propriedades'
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Gerar {type === 'logo' ? 'Logo' : type === 'banner' ? 'Banner' : 'Capa'} com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Descreva o {type === 'logo' ? 'logo' : type === 'banner' ? 'banner' : 'capa'} que você quer criar
            </Label>
            <Textarea
              id="prompt"
              placeholder={`Ex: ${predefinedPrompts[type][0]}, estilo moderno, cores azul e branco...`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Sugestões rápidas:</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedPrompts[type].map((suggestion, index) => (
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

          <Button
            onClick={generateImage}
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

          {generatedImages.length > 0 && (
            <div className="space-y-3">
              <Label>Imagens geradas:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative group">
                      <img
                        src={imageUrl}
                        alt={`${type} gerada ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', e);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUseImage(imageUrl)}
                          className="bg-primary/80 hover:bg-primary"
                        >
                          Usar esta
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}