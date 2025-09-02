import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scan, Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FurnitureDetectorProps {
  imageUrl: string;
  onFurnitureDetected: (furniture: string[]) => void;
}

const MOCK_FURNITURE_DETECTION = [
  'Sofá', 'Mesa de jantar', 'Cadeiras', 'TV', 'Estante', 'Cama', 
  'Guarda-roupa', 'Geladeira', 'Fogão', 'Mesa de centro', 'Poltrona',
  'Luminária', 'Cortinas', 'Quadros decorativos'
];

export function FurnitureDetector({ imageUrl, onFurnitureDetected }: FurnitureDetectorProps) {
  const [detecting, setDetecting] = useState(false);
  const [detectedFurniture, setDetectedFurniture] = useState<string[]>([]);

  const detectFurniture = async () => {
    setDetecting(true);
    
    try {
      // Simulate AI furniture detection - in production, would call Google Vision or API4.AI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock detection results
      const randomFurniture = MOCK_FURNITURE_DETECTION
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 5) + 2);
      
      setDetectedFurniture(randomFurniture);
      onFurnitureDetected(randomFurniture);
      
      toast({
        title: "Móveis detectados!",
        description: `Identificamos ${randomFurniture.length} tipos de móveis na imagem.`,
      });
    } catch (error) {
      console.error('Error detecting furniture:', error);
      toast({
        title: "Erro na detecção",
        description: "Erro ao detectar móveis. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (imageUrl && detectedFurniture.length === 0) {
      // Auto-detect on image load
      detectFurniture();
    }
  }, [imageUrl]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectFurniture}
          disabled={detecting}
          className="flex items-center gap-2"
        >
          {detecting ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Scan className="h-4 w-4" />
          )}
          {detecting ? 'Detectando...' : 'Detectar Móveis'}
        </Button>
      </div>
      
      {detectedFurniture.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {detectedFurniture.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}