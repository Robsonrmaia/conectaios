import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
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
  neighborhood?: string;
  city?: string;
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
}

interface ClientAIPropertyDescriptionProps {
  property: Property;
  onDescriptionGenerated: (description: string) => void;
}

export function ClientAIPropertyDescription({ property, onDescriptionGenerated }: ClientAIPropertyDescriptionProps) {
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { sendMessage, loading } = useAI();

  const generateClientDescription = useCallback(async () => {
    if (isGenerating || loading) return;

    setIsGenerating(true);
    
    const prompt = `
      Como especialista em marketing imobiliário, crie uma descrição emocional e persuasiva para este imóvel direcionada ao CLIENTE FINAL que está visualizando o compartilhamento:
      
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
      ${property.city ? `• Cidade: ${property.city}` : ''}
      ${property.has_sea_view ? `• Vista para o mar: Sim` : ''}
      ${property.furnishing_type && property.furnishing_type !== 'unfurnished' ? `• Mobiliado: Sim` : ''}
      ${property.sea_distance ? `• Distância da praia: ${property.sea_distance}m` : ''}
      
      🎯 FOQUE EM ASPECTOS QUE EMOCIONAM E CONVENCEM CLIENTES:
      • Como será a nova vida neste imóvel (lifestyle e experiências)
      • Conforto, segurança e comodidade para toda a família
      • Localização privilegiada e todas as conveniências próximas
      • Sensação de realização pessoal e conquista
      • Valorização do investimento e futuro financeiro
      • Características especiais que tornam o imóvel único
      • Momentos especiais que poderão viver ali
      
      INSTRUÇÕES:
      1. Use linguagem emocional mas elegante, direcionada a quem está interessado em comprar/alugar
      2. Desperte o desejo e a identificação com o imóvel
      3. Fale sobre sonhos, conquistas e qualidade de vida
      4. Mencione benefícios práticos de forma inspiradora
      5. Máximo 120 palavras para compartilhamento
      6. Use linguagem calorosa e convincente
      7. NÃO use emojis, asteriscos (*) ou caracteres especiais
      8. Termine com um call-to-action sutil
      
      Gere apenas a descrição, sem explicações adicionais.`;

    try {
      console.log('Sending AI request for property:', property.titulo);
      const response = await sendMessage(prompt);
      console.log('AI response received:', response?.slice(0, 100) + '...');
      
      setGeneratedDescription(response);
      onDescriptionGenerated(response);
      
      toast({
        title: "Descrição personalizada criada!",
        description: "Descrição otimizada para atrair clientes interessados.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar a descrição. Usando descrição padrão.",
        variant: "destructive",
      });
      
      // Fallback description
      const fallbackDescription = `${property.titulo} - ${property.property_type} para ${property.listing_type} em ${property.neighborhood || property.city || 'localização privilegiada'}. ${property.area}m², ${property.quartos} quartos, ${property.bathrooms} banheiros. ${property.has_sea_view ? 'Vista para o mar. ' : ''}Um lar perfeito para realizar seus sonhos. Entre em contato e agende uma visita!`;
      
      setGeneratedDescription(fallbackDescription);
      onDescriptionGenerated(fallbackDescription);
    } finally {
      setIsGenerating(false);
    }
  }, [property.id, property.titulo, sendMessage, isGenerating, loading, onDescriptionGenerated]);

  // Auto-generate on mount
  useEffect(() => {
    console.log('ClientAI Effect:', { 
      propertyId: property.id, 
      hasDescription: !!generatedDescription, 
      isGenerating, 
      loading,
      propertyTitle: property.titulo 
    });
    
    if (!generatedDescription && !isGenerating && !loading && property.id && property.titulo) {
      console.log('Starting AI description generation for:', property.titulo);
      generateClientDescription();
    }
  }, [property.id, property.titulo, generateClientDescription]); // Add proper dependencies

  return (
    <div className="text-center py-2">
      {(isGenerating || loading) && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Personalizando descrição para clientes...
        </div>
      )}
      
      {generatedDescription && !isGenerating && !loading && (
        <div className="text-sm text-muted-foreground">
          ✨ Descrição personalizada para clientes
        </div>
      )}
    </div>
  );
}