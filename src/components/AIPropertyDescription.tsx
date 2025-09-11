import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Copy, Check, Loader2, Volume2 } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { toast } from '@/hooks/use-toast';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms: number;
  parking_spots: number;
  listing_type: string;
  property_type: string;
  descricao: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  condominium_fee?: number;
  iptu?: number;
}

interface AIPropertyDescriptionProps {
  property: Property;
  onDescriptionGenerated: (description: string) => void;
  onClose: () => void;
}

export function AIPropertyDescription({ property, onDescriptionGenerated, onClose }: AIPropertyDescriptionProps) {
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const { sendMessage, loading } = useAI();
  const { speak, isSpeaking, stop } = useElevenLabsVoice();

  const generateDescription = async () => {
    const prompt = `
      Como especialista imobiliário, crie uma descrição técnica e comercial para este imóvel direcionada a OUTROS CORRETORES:
      
      🏠 DADOS DO IMÓVEL:
      • Título: ${property.titulo}
      • Tipo: ${property.property_type}
      • Finalidade: ${property.listing_type} 
      • Valor: R$ ${property.valor?.toLocaleString('pt-BR')}
      • Área: ${property.area}m²
      • Quartos: ${property.quartos}
      • Banheiros: ${property.bathrooms}
      • Vagas: ${property.parking_spots}
      ${property.neighborhood ? `• Bairro: ${property.neighborhood}` : ''}
      ${property.address ? `• Endereço: ${property.address}` : ''}
      ${property.condominium_fee ? `• Condomínio: R$ ${property.condominium_fee.toLocaleString('pt-BR')}` : ''}
      ${property.iptu ? `• IPTU: R$ ${property.iptu.toLocaleString('pt-BR')}` : ''}
      
      🎯 FOQUE EM ASPECTOS RELEVANTES PARA CORRETORES:
      • Potencial de ROI e valorização da região
      • Facilidades para fechamento (financiamento, documentação)
      • Diferenciais competitivos frente à concorrência
      • Características únicas que facilitam a venda
      • Perfil ideal do comprador/investidor
      • Argumentos de venda mais eficazes
      • Aspectos técnicos e comerciais importantes
      
      INSTRUÇÕES:
      1. Use linguagem profissional B2B, seja direto e objetivo
      2. Esta descrição será lida por outros profissionais imobiliários
      3. Destaque o potencial comercial do imóvel
      4. Mencione características da região de Ilhéus quando relevante
      5. Máximo 200 palavras
      6. NÃO use emojis, asteriscos (*) ou caracteres especiais
      7. Use apenas texto limpo e profissional
      
      Gere apenas a descrição, sem explicações adicionais.`;

    try {
      const response = await sendMessage(prompt);
      setGeneratedDescription(response);
      toast({
        title: "Descrição gerada!",
        description: "Descrição criada com IA. Você pode editá-la antes de usar.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar a descrição. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Descrição copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a descrição.",
        variant: "destructive",
      });
    }
  };

  const useDescription = () => {
    onDescriptionGenerated(generatedDescription);
    toast({
      title: "Descrição aplicada!",
      description: "A descrição foi aplicada ao imóvel.",
    });
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Gerar Descrição com IA
        </CardTitle>
        <CardDescription>
          Crie uma descrição profissional e atrativa para: <strong>{property.titulo}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedDescription ? (
          <div className="text-center py-8">
            <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nossa IA criará uma descrição personalizada baseada nas informações do imóvel
            </p>
            <Button 
              onClick={generateDescription} 
              disabled={loading}
              className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Gerar Descrição
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={generatedDescription}
              onChange={(e) => setGeneratedDescription(e.target.value)}
              rows={8}
              placeholder="Descrição gerada aparecerá aqui..."
              className="resize-none"
            />
            
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => isSpeaking ? stop() : speak(generatedDescription)}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  {isSpeaking ? 'Parar' : 'Ouvir'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={generateDescription}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Gerar Nova"
                  )}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={useDescription}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Usar Descrição
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}