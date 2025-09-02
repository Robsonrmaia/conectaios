import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Download, Eye, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { WatermarkGenerator } from '@/components/WatermarkGenerator';

interface WatermarkManagerProps {
  images: string[];
  onWatermarkedImages: (images: { original: string; watermarked: string }[]) => void;
  defaultWatermarkText?: string;
}

export function WatermarkManager({ 
  images, 
  onWatermarkedImages, 
  defaultWatermarkText = "ConectaIOS" 
}: WatermarkManagerProps) {
  const [watermarkText, setWatermarkText] = useState(defaultWatermarkText);
  const [processing, setProcessing] = useState(false);
  const [watermarkedImages, setWatermarkedImages] = useState<{ original: string; watermarked: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const applyWatermarkToAll = () => {
    if (!watermarkText.trim()) {
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
      // Create a temporary canvas element for watermarking
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx?.drawImage(img, 0, 0);

        // Add watermark
        if (ctx) {
          const fontSize = Math.max(16, img.width / 30);
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';

          const x = img.width - 20;
          const y = img.height - 20;

          // Draw text with stroke for better visibility
          ctx.strokeText(watermarkText, x, y);
          ctx.fillText(watermarkText, x, y);
        }

        // Convert canvas to blob and get URL
        canvas.toBlob((blob) => {
          if (blob) {
            const watermarkedUrl = URL.createObjectURL(blob);
            results.push({ original: imageUrl, watermarked: watermarkedUrl });
            
            // When all images are processed
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
    
    // Clean up blob URLs
    watermarkedImages.forEach(img => {
      URL.revokeObjectURL(img.watermarked);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5" />
          Marca d'Água
          <Badge variant="secondary">Proteção de Imagens</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="space-y-2">
          <Label htmlFor="watermark-text">Texto da Marca d'Água</Label>
          <Input
            id="watermark-text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Digite seu nome ou marca..."
          />
          <p className="text-xs text-muted-foreground">
            O texto será posicionado no canto inferior direito
          </p>
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