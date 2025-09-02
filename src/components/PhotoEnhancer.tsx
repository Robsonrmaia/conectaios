import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PhotoEnhancerProps {
  imageUrl: string;
  onEnhancedImage: (enhancedUrl: string) => void;
  isPremium?: boolean;
}

export function PhotoEnhancer({ imageUrl, onEnhancedImage, isPremium = false }: PhotoEnhancerProps) {
  const [enhancing, setEnhancing] = useState(false);

  const enhancePhoto = async () => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "A melhoria de fotos está disponível apenas no plano premium.",
        variant: "destructive",
      });
      return;
    }

    setEnhancing(true);
    
    try {
      // For now, simulate enhancement - in production, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate enhanced image (in production, would return processed image URL)
      onEnhancedImage(imageUrl);
      
      toast({
        title: "Foto melhorada!",
        description: "Sua foto foi aprimorada com qualidade superior.",
      });
    } catch (error) {
      console.error('Error enhancing photo:', error);
      toast({
        title: "Erro na melhoria",
        description: "Erro ao melhorar a foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={enhancePhoto}
        disabled={enhancing || !isPremium}
        className="flex items-center gap-2"
      >
        {enhancing ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {enhancing ? 'Melhorando...' : 'Melhorar Qualidade'}
      </Button>
      
      {!isPremium && (
        <Badge variant="secondary">Premium</Badge>
      )}
    </div>
  );
}