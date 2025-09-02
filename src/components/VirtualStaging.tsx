import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, Wand2, Download, Eye, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VirtualStagingProps {
  imageUrl: string;
  onStagedImage?: (stagedUrl: string) => void;
}

const ROOM_TYPES = {
  sala: 'Sala de Estar',
  quarto: 'Quarto',
  cozinha: 'Cozinha',
  escritorio: 'Escritório'
};

const STYLES = {
  moderno: 'Moderno',
  classico: 'Clássico',
  luxo: 'Luxo'
};

export function VirtualStaging({ imageUrl, onStagedImage }: VirtualStagingProps) {
  const [processing, setProcessing] = useState(false);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [roomType, setRoomType] = useState('sala');
  const [style, setStyle] = useState('moderno');
  const [showOriginal, setShowOriginal] = useState(false);

  const processVirtualStaging = async () => {
    setProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('virtual-staging', {
        body: {
          imageUrl,
          roomType,
          style
        }
      });

      if (error) throw error;

      if (data?.success && data?.stagedImage) {
        setStagedImage(data.stagedImage);
        onStagedImage?.(data.stagedImage);
        
        toast({
          title: "Virtual Staging Concluído!",
          description: `Ambiente ${ROOM_TYPES[roomType as keyof typeof ROOM_TYPES]} estilo ${STYLES[style as keyof typeof STYLES]} criado com sucesso.`,
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Virtual staging error:', error);
      toast({
        title: "Erro no Virtual Staging",
        description: "Não foi possível processar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (stagedImage) {
      const link = document.createElement('a');
      link.href = stagedImage;
      link.download = `virtual-staging-${roomType}-${style}.png`;
      link.click();
    }
  };

  const resetStaging = () => {
    setStagedImage(null);
    setShowOriginal(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Virtual Staging com IA
          <Badge variant="secondary">Powered by Hugging Face</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Ambiente</label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROOM_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Estilo</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STYLES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botão de Processar */}
        <Button
          onClick={processVirtualStaging}
          disabled={processing}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader className="h-4 w-4 animate-spin mr-2" />
              Criando Ambiente Virtual...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Criar Virtual Staging
            </>
          )}
        </Button>

        {/* Preview das Imagens */}
        {(stagedImage || processing) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Resultado:</h4>
              {stagedImage && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOriginal(!showOriginal)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showOriginal ? 'Ver Mobiliado' : 'Ver Original'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetStaging}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Refazer
                  </Button>
                </div>
              )}
            </div>
            
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              {processing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Processando com IA...
                    </p>
                  </div>
                </div>
              ) : stagedImage ? (
                <img
                  src={showOriginal ? imageUrl : stagedImage}
                  alt={showOriginal ? 'Imagem Original' : 'Virtual Staging'}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            
            {stagedImage && (
              <div className="text-center">
                <Badge variant="secondary">
                  {ROOM_TYPES[roomType as keyof typeof ROOM_TYPES]} • {STYLES[style as keyof typeof STYLES]}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}