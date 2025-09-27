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
  title: string;
  price: number;
  area_total: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  purpose: string;
  type: string;
  description: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  condo_fee?: number;
  iptu?: number;
}

interface AIPropertyDescriptionProps {
  property: Property;
  onDescriptionGenerated: (description: string) => void;
  onClose: () => void;
  targetAudience?: 'brokers' | 'clients';
  initialDescription?: string;
  autoSaveToDatabase?: boolean;
}

export function AIPropertyDescription({ property, onDescriptionGenerated, onClose, targetAudience = 'clients', initialDescription, autoSaveToDatabase = true }: AIPropertyDescriptionProps) {
  const [generatedDescription, setGeneratedDescription] = useState(initialDescription || '');
  const [hasGenerated, setHasGenerated] = useState(!!initialDescription);
  const [copied, setCopied] = useState(false);
  const { sendMessage, loading } = useAI();
  const { speak, isSpeaking, stop, isCurrentlySpeaking } = useElevenLabsVoice();

  const generateDescription = async () => {
    // Prevent duplicate generation
    if (loading || (hasGenerated && generatedDescription && !confirm('Já existe uma descrição gerada. Deseja gerar uma nova?'))) {
      return;
    }

    const prompt = targetAudience === 'brokers' 
      ? `🏢 DESCRIÇÃO PROFISSIONAL PARA CORRETORES 
      
      Imóvel: ${property.type || 'Não especificado'} para ${property.purpose || 'Não especificado'}
      Valor: R$ ${property.price ? property.price.toLocaleString('pt-BR') : 'Não informado'}
      • Área: ${property.area_total ? `${property.area_total}m²` : 'Não informada'}
      • Quartos: ${property.bedrooms || 'Não informado'}
      • Banheiros: ${property.bathrooms || 'Não informado'}
      • Vagas: ${property.parking || 'Não informado'}
      ${property.neighborhood ? `• Bairro: ${property.neighborhood}` : ''}
      ${property.street ? `• Endereço: ${property.street}` : ''}
      ${property.condo_fee ? `• Condomínio: R$ ${property.condo_fee.toLocaleString('pt-BR')}` : ''}
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
      5. RETORNE APENAS o texto da descrição, sem formatação markdown
      6. Máximo 180 palavras, seja conciso e impactante`

      : `🏡 DESCRIÇÃO ATRATIVA PARA CLIENTES FINAIS

      Imóvel: ${property.type || 'Não especificado'} para ${property.purpose || 'Não especificado'}
      Valor: R$ ${property.price ? property.price.toLocaleString('pt-BR') : 'Consulte'}
      • Área: ${property.area_total ? `${property.area_total}m²` : 'Não informada'}
      • Quartos: ${property.bedrooms || 'Não informado'}
      • Banheiros: ${property.bathrooms || 'Não informado'}
      • Vagas: ${property.parking || 'Não informado'}
      ${property.neighborhood ? `• Bairro: ${property.neighborhood}` : ''}
      ${property.street ? `• Endereço: ${property.street}` : ''}
      ${property.condo_fee ? `• Condomínio: R$ ${property.condo_fee.toLocaleString('pt-BR')}` : ''}
      
      💫 CRIE UMA DESCRIÇÃO ENVOLVENTE QUE:
      • Desperte emoção e desejo pelo imóvel
      • Destaque o estilo de vida que o imóvel proporciona
      • Use linguagem calorosa e acolhedora
      • Mencione benefícios práticos do dia a dia
      • Crie conexão emocional com o futuro morador
      • Destaque características únicas e diferenciais
      • Mencione a beleza e charme de Ilhéus quando relevante
      
      INSTRUÇÕES:
      1. Use linguagem persuasiva e emocional
      2. Esta descrição será lida por potenciais compradores/inquilinos
      3. Foque na experiência de morar no imóvel
      4. Seja acolhedor e inspirador
      5. RETORNE APENAS o texto da descrição, sem formatação markdown
      6. Máximo 180 palavras, seja envolvente e cativante`;

    try {
      const response = await sendMessage(prompt);
      setGeneratedDescription(response);
      setHasGenerated(true);

      // Auto-save to database if enabled
      if (autoSaveToDatabase) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase
            .from('imoveis')
            .update({ description: response })
            .eq('id', property.id);
          
          console.log('✅ Descrição salva automaticamente no banco');
        } catch (saveError) {
          console.error('❌ Erro ao salvar descrição no banco:', saveError);
        }
      }

      toast({
        title: "Descrição gerada com sucesso!",
        description: `Descrição ${targetAudience === 'brokers' ? 'para corretores' : 'para clientes'} criada pela IA.`
      });
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast({
        title: "Erro ao gerar descrição",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Descrição copiada para a área de transferência."
    });
  };

  const useDescription = () => {
    onDescriptionGenerated(generatedDescription);
    onClose();
    toast({
      title: "Descrição aplicada!",
      description: "A descrição foi aplicada ao imóvel."
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Descrição com IA
        </CardTitle>
        <CardDescription>
          Gere uma descrição {targetAudience === 'brokers' ? 'profissional para corretores' : 'atrativa para clientes'} usando inteligência artificial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasGenerated ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Clique no botão abaixo para gerar uma descrição personalizada para este imóvel
            </p>
            <Button 
              onClick={generateDescription} 
              disabled={loading}
              size="lg"
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
              placeholder="Descrição gerada aparecerá aqui..."
              className="min-h-[200px] resize-none"
            />
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              
              <Button
                onClick={() => {
                  if (isCurrentlySpeaking) {
                    stop();
                  } else {
                    speak(generatedDescription);
                  }
                }}
                variant="outline"
                size="sm"
                disabled={isSpeaking}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {isCurrentlySpeaking ? 'Parar' : 'Ouvir'}
              </Button>
              
              <Button onClick={generateDescription} variant="outline" size="sm" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Nova Descrição
              </Button>
              
              <Button onClick={useDescription} className="ml-auto">
                Usar Esta Descrição
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}