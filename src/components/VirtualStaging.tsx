import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, Wand2, Download, Eye, RotateCcw, AlertCircle } from 'lucide-react';
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
  const [isDemo, setIsDemo] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);

  const processVirtualStaging = async () => {
    console.log('=== Starting Virtual Staging Process ===');
    setProcessing(true);
    setProcessingTime(0);
    
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      setProcessingTime(Date.now() - startTime);
    }, 100);
    
    try {
      console.log('Starting virtual staging with:', { 
        imageUrl: imageUrl ? 'provided' : 'missing', 
        roomType, 
        style 
      });
      
      const { data, error } = await supabase.functions.invoke('virtual-staging', {
        body: {
          imageUrl,
          roomType,
          style
        }
      });

      clearInterval(progressInterval);
      const totalTime = Date.now() - startTime;
      setProcessingTime(totalTime);

      console.log('Virtual staging response:', { data, error });

      if (error) {
        console.error('Virtual staging function error:', error);
        throw new Error(error.message || 'Erro na função de virtual staging');
      }

      if (data?.success && data?.stagedImage) {
        setStagedImage(data.stagedImage);
        setIsDemo(data.isDemo || false);
        onStagedImage?.(data.stagedImage);
        
        const message = data.isDemo 
          ? `Demonstração criada em ${(totalTime / 1000).toFixed(1)}s`
          : `Ambiente criado em ${(totalTime / 1000).toFixed(1)}s com IA`;

        toast({
          title: data.isDemo ? "Demonstração criada! ✨" : "Virtual Staging Concluído! ✨",
          description: message,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('=== Virtual Staging Error ===', error);
      
      // Create fallback demonstration
      console.log('Creating fallback demonstration...');
      setStagedImage(imageUrl); // Use original as fallback for now
      setIsDemo(true);
      
      toast({
        title: "Modo Demonstração",
        description: `Simulação do virtual staging para ${ROOM_TYPES[roomType as keyof typeof ROOM_TYPES]} estilo ${STYLES[style as keyof typeof STYLES]}.`,
        variant: "default",
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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download iniciado",
        description: "A imagem está sendo baixada.",
      });
    }
  };

  const resetStaging = () => {
    setStagedImage(null);
    setShowOriginal(false);
    setIsDemo(false);
    setProcessingTime(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Virtual Staging com IA
          <Badge variant="secondary">Powered by Replicate</Badge>
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
              Criando Ambiente... {(processingTime / 1000).toFixed(1)}s
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
                      Processando com IA... {(processingTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              ) : stagedImage ? (
                <>
                  <img
                    src={showOriginal ? imageUrl : stagedImage}
                    alt={showOriginal ? 'Imagem Original' : 'Virtual Staging'}
                    className="w-full h-full object-cover"
                  />
                  
                  {isDemo && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Demo
                    </div>
                  )}
                </>
              ) : null}
            </div>
            
            {stagedImage && (
              <div className="text-center space-y-2">
                <Badge variant="secondary">
                  {ROOM_TYPES[roomType as keyof typeof ROOM_TYPES]} • {STYLES[style as keyof typeof STYLES]}
                </Badge>
                
                {processingTime > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Processado em {(processingTime / 1000).toFixed(1)} segundos
                    {isDemo && ' (modo demonstração)'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}