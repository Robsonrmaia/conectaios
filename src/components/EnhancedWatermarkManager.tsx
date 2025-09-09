import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { Droplet, Download, Eye, RotateCcw, Upload, Image, Type } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface WatermarkConfig {
  text: string;
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  size: number;
  opacity: number;
  color: string;
  useImage: boolean;
  imageUrl?: string;
  rotation: number;
}

interface EnhancedWatermarkManagerProps {
  images: string[];
  onWatermarkedImages: (images: { original: string; watermarked: string }[]) => void;
  defaultWatermarkText?: string;
}

export function EnhancedWatermarkManager({ 
  images, 
  onWatermarkedImages, 
  defaultWatermarkText = "ConectaIOS" 
}: EnhancedWatermarkManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [watermarkedImages, setWatermarkedImages] = useState<{ original: string; watermarked: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const [config, setConfig] = useState<WatermarkConfig>({
    text: defaultWatermarkText,
    position: 'bottom-right',
    size: 24,
    opacity: 0.8,
    color: '#ffffff',
    useImage: false,
    rotation: 0
  });

  const positionOptions = [
    { value: 'top-left', label: '↖ Superior Esquerda' },
    { value: 'top-center', label: '↑ Superior Centro' },
    { value: 'top-right', label: '↗ Superior Direita' },
    { value: 'center-left', label: '← Centro Esquerda' },
    { value: 'center', label: '• Centro' },
    { value: 'center-right', label: '→ Centro Direita' },
    { value: 'bottom-left', label: '↙ Inferior Esquerda' },
    { value: 'bottom-center', label: '↓ Inferior Centro' },
    { value: 'bottom-right', label: '↘ Inferior Direita' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setConfig(prev => ({ ...prev, imageUrl, useImage: true }));
        toast({
          title: "Imagem carregada",
          description: "Logo da marca d'água pronto para uso",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getWatermarkPosition = (imageWidth: number, imageHeight: number, watermarkWidth: number, watermarkHeight: number) => {
    const padding = 20;
    
    switch (config.position) {
      case 'top-left':
        return { x: padding, y: padding };
      case 'top-center':
        return { x: (imageWidth - watermarkWidth) / 2, y: padding };
      case 'top-right':
        return { x: imageWidth - watermarkWidth - padding, y: padding };
      case 'center-left':
        return { x: padding, y: (imageHeight - watermarkHeight) / 2 };
      case 'center':
        return { x: (imageWidth - watermarkWidth) / 2, y: (imageHeight - watermarkHeight) / 2 };
      case 'center-right':
        return { x: imageWidth - watermarkWidth - padding, y: (imageHeight - watermarkHeight) / 2 };
      case 'bottom-left':
        return { x: padding, y: imageHeight - watermarkHeight - padding };
      case 'bottom-center':
        return { x: (imageWidth - watermarkWidth) / 2, y: imageHeight - watermarkHeight - padding };
      case 'bottom-right':
      default:
        return { x: imageWidth - watermarkWidth - padding, y: imageHeight - watermarkHeight - padding };
    }
  };

  const applyWatermarkToAll = () => {
    if (config.useImage && !config.imageUrl) {
      toast({
        title: "Logo necessário",
        description: "Carregue uma imagem para usar como marca d'água",
        variant: "destructive",
      });
      return;
    }

    if (!config.useImage && !config.text.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Digite o texto da marca d'água",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    const results: { original: string; watermarked: string }[] = [];

    images.forEach((imageUrl) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        if (config.useImage && config.imageUrl) {
          // Apply image watermark
          const watermarkImg = document.createElement('img');
          watermarkImg.onload = () => {
            const maxSize = Math.min(img.width, img.height) * (config.size / 100);
            const aspectRatio = watermarkImg.width / watermarkImg.height;
            
            let watermarkWidth = maxSize;
            let watermarkHeight = maxSize / aspectRatio;
            
            if (watermarkHeight > maxSize) {
              watermarkHeight = maxSize;
              watermarkWidth = maxSize * aspectRatio;
            }

            const { x, y } = getWatermarkPosition(img.width, img.height, watermarkWidth, watermarkHeight);

            ctx.save();
            ctx.globalAlpha = config.opacity;
            
            if (config.rotation !== 0) {
              ctx.translate(x + watermarkWidth / 2, y + watermarkHeight / 2);
              ctx.rotate((config.rotation * Math.PI) / 180);
              ctx.translate(-watermarkWidth / 2, -watermarkHeight / 2);
              ctx.drawImage(watermarkImg, 0, 0, watermarkWidth, watermarkHeight);
            } else {
              ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
            }
            
            ctx.restore();
            
            // Convert to blob
            canvas.toBlob((blob) => {
              if (blob) {
                const watermarkedUrl = URL.createObjectURL(blob);
                results.push({ original: imageUrl, watermarked: watermarkedUrl });
                
                if (results.length === images.length) {
                  setWatermarkedImages(results);
                  onWatermarkedImages(results);
                  setProcessing(false);
                  
                  toast({
                    title: "Marca d'água aplicada! ✨",
                    description: `${results.length} ${results.length === 1 ? 'imagem processada' : 'imagens processadas'} com sucesso.`,
                  });
                }
              }
            }, 'image/jpeg', 0.9);
          };
          
          watermarkImg.src = config.imageUrl;
        } else {
          // Apply text watermark
          const fontSize = Math.max(12, (img.width / 100) * (config.size / 10));
          ctx.font = `bold ${fontSize}px Arial`;
          
          const textMetrics = ctx.measureText(config.text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;

          const { x, y } = getWatermarkPosition(img.width, img.height, textWidth, textHeight);

          ctx.save();
          ctx.globalAlpha = config.opacity;
          
          if (config.rotation !== 0) {
            ctx.translate(x + textWidth / 2, y + textHeight / 2);
            ctx.rotate((config.rotation * Math.PI) / 180);
            ctx.translate(-textWidth / 2, -textHeight / 2);
          }

          // Text with stroke for better visibility
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeText(config.text, config.rotation !== 0 ? -textWidth / 2 : x, config.rotation !== 0 ? textHeight / 2 : y + textHeight);
          
          ctx.fillStyle = config.color;
          ctx.fillText(config.text, config.rotation !== 0 ? -textWidth / 2 : x, config.rotation !== 0 ? textHeight / 2 : y + textHeight);
          
          ctx.restore();

          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const watermarkedUrl = URL.createObjectURL(blob);
              results.push({ original: imageUrl, watermarked: watermarkedUrl });
              
              if (results.length === images.length) {
                setWatermarkedImages(results);
                onWatermarkedImages(results);
                setProcessing(false);
                
                toast({
                  title: "Marca d'água aplicada! ✨",
                  description: `${results.length} ${results.length === 1 ? 'imagem processada' : 'imagens processadas'} com sucesso.`,
                });
              }
            }
          }, 'image/jpeg', 0.9);
        }
      };

      img.onerror = () => {
        console.error('Error loading image for watermark');
        results.push({ original: imageUrl, watermarked: imageUrl });
        
        if (results.length === images.length) {
          setWatermarkedImages(results);
          onWatermarkedImages(results);
          setProcessing(false);
        }
      };

      img.src = imageUrl;
    });
  };

  const downloadAll = () => {
    watermarkedImages.forEach((img, index) => {
      const link = document.createElement('a');
      link.href = img.watermarked;
      link.download = `foto-${index + 1}-marca-dagua.jpg`;
      link.click();
    });

    toast({
      title: "Download iniciado",
      description: `${watermarkedImages.length} ${watermarkedImages.length === 1 ? 'imagem baixada' : 'imagens baixadas'}.`,
    });
  };

  const reset = () => {
    setWatermarkedImages([]);
    setShowPreview(false);
    
    watermarkedImages.forEach(img => {
      URL.revokeObjectURL(img.watermarked);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5" />
          Marca d'Água Avançada
          <Badge variant="secondary">Configuração Completa</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={config.useImage ? 'image' : 'text'} onValueChange={(value) => setConfig(prev => ({ ...prev, useImage: value === 'image' }))}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Texto
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="watermark-text">Texto da Marca d'Água</Label>
              <Input
                id="watermark-text"
                value={config.text}
                onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Digite seu nome ou marca..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <ColorPicker
                value={config.color}
                onChange={(color) => setConfig(prev => ({ ...prev, color }))}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Logo da Marca d'Água</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {config.imageUrl ? 'Trocar Logo' : 'Carregar Logo'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              {config.imageUrl && (
                <div className="mt-2 p-2 border rounded-md">
                  <img src={config.imageUrl} alt="Preview do logo" className="h-16 w-auto mx-auto" />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Position */}
        <div className="space-y-2">
          <Label>Posição</Label>
          <div className="grid grid-cols-3 gap-2">
            {positionOptions.map((option) => (
              <Button
                key={option.value}
                variant={config.position === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, position: option.value as any }))}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label>Tamanho: {config.size}%</Label>
          <Slider
            value={[config.size]}
            onValueChange={([value]) => setConfig(prev => ({ ...prev, size: value }))}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <Label>Opacidade: {Math.round(config.opacity * 100)}%</Label>
          <Slider
            value={[config.opacity * 100]}
            onValueChange={([value]) => setConfig(prev => ({ ...prev, opacity: value / 100 }))}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label>Rotação: {config.rotation}°</Label>
          <Slider
            value={[config.rotation]}
            onValueChange={([value]) => setConfig(prev => ({ ...prev, rotation: value }))}
            max={360}
            min={0}
            step={15}
            className="w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={applyWatermarkToAll}
            disabled={processing || images.length === 0}
            className="flex-1"
          >
            {processing ? (
              <>
                <Droplet className="h-4 w-4 animate-pulse mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Droplet className="h-4 w-4 mr-2" />
                Aplicar Marca d'Água ({images.length})
              </>
            )}
          </Button>
          
          {watermarkedImages.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? 'Ocultar' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                onClick={downloadAll}
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
              <Button
                variant="outline"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </>
          )}
        </div>

        {/* Preview */}
        {showPreview && watermarkedImages.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Prévia das Imagens com Marca d'Água:</h4>
            <div className="grid grid-cols-2 gap-3">
              {watermarkedImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={img.watermarked}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Imagem {index + 1} com marca d'água
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}