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
              disabled
            />
            <p className="text-sm text-muted-foreground">
              💡 Esta funcionalidade foi migrada para uma ferramenta mais avançada. 
              Use o botão abaixo para acessar o ConectAIOS Image Generator.
            </p>
          </div>

          <Button
            onClick={() => window.open('/app/ferramentas/image-creator', '_blank')}
            className="w-full"
          >
            <Image className="h-4 w-4 mr-2" />
            Abrir ConectAIOS Image Generator
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}