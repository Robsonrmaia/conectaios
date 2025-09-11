import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Image, Sparkles, Wand2, Palette, Maximize2 } from 'lucide-react';

export default function ConectaIOSImageApp() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
          <Wand2 className="h-8 w-8" />
          ConectAIOS - Gerador de Imagens
        </h1>
        <p className="text-muted-foreground">
          Ferramenta avançada para criação e melhoria de imagens com IA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Funcionalidades Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <Wand2 className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Geração de Imagens</h3>
              <p className="text-sm text-muted-foreground">Crie imagens únicas com IA</p>
              <Badge variant="outline" className="mt-2">IA Avançada</Badge>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Melhoria de Imagens</h3>
              <p className="text-sm text-muted-foreground">Aprimore qualidade e resolução</p>
              <Badge variant="outline" className="mt-2">Super Resolução</Badge>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <Palette className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Edição Avançada</h3>
              <p className="text-sm text-muted-foreground">Ferramentas profissionais</p>
              <Badge variant="outline" className="mt-2">Pro</Badge>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Button onClick={openFullscreen} size="lg" className="w-full max-w-md">
              <Maximize2 className="h-4 w-4 mr-2" />
              Abrir Ferramenta de Imagens
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>ConectAIOS - Gerador de Imagens</DialogTitle>
          </DialogHeader>
          
          <div className="w-full h-full min-h-[90vh]">
            <iframe
              src="https://imagens-conectaios-420832656535.us-west1.run.app"
              className="w-full h-full border-0 rounded-lg"
              title="ConectAIOS Image Generator"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
              style={{ 
                border: 'none',
                outline: 'none',
                minHeight: '90vh'
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Como usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold mt-0.5">1</div>
              <div>
                <p className="font-medium">Clique em "Abrir Ferramenta de Imagens"</p>
                <p className="text-sm text-muted-foreground">A ferramenta abrirá em modo fullscreen</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold mt-0.5">2</div>
              <div>
                <p className="font-medium">Escolha entre gerar ou melhorar imagens</p>
                <p className="text-sm text-muted-foreground">Use prompts em português para melhores resultados</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold mt-0.5">3</div>
              <div>
                <p className="font-medium">Faça o download das imagens criadas</p>
                <p className="text-sm text-muted-foreground">Todas as imagens ficam prontas para uso profissional</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}