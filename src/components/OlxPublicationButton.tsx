import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { useOlxPublications } from '@/hooks/useOlxPublications';
import { OlxPublicationModal } from './OlxPublicationModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  olx_enabled?: boolean;
  olx_data?: any;
}

interface OlxPublicationButtonProps {
  property: Property;
  onUpdate: () => void;
}

export function OlxPublicationButton({ property, onUpdate }: OlxPublicationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { limit, currentCount, canEnableMore, hasAccess, isLoading, refetchCount } = useOlxPublications();

  const handleSave = async (enabled: boolean, olxData: any) => {
    try {
      // Verificar se pode habilitar (se estiver tentando habilitar)
      if (enabled && !property.olx_enabled && !canEnableMore) {
        toast({
          title: "Limite atingido",
          description: `Você já tem ${currentCount} de ${limit} imóveis publicados no OLX. Faça upgrade do plano para publicar mais.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('imoveis')
        .update({ 
          olx_enabled: enabled,
          olx_data: olxData 
        })
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: enabled ? "✓ Adicionado ao OLX" : "Removido do OLX",
        description: enabled 
          ? "Imóvel será incluído no próximo envio do feed OLX."
          : "Imóvel não será mais publicado no OLX.",
      });

      // Atualizar contadores
      await refetchCount();
      onUpdate();
    } catch (error) {
      console.error('Error updating OLX status:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a configuração OLX.",
        variant: "destructive",
      });
    }
  };

  // Carregando
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        OLX
      </Button>
    );
  }

  // Plano básico: sem acesso ao OLX
  if (!hasAccess) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Lock className="w-4 h-4" />
        OLX
        <Badge variant="secondary">Premium</Badge>
      </Button>
    );
  }

  // Limite atingido e imóvel não está habilitado
  if (!canEnableMore && !property.olx_enabled) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Globe className="w-4 h-4" />
        OLX
        <Badge variant="secondary">{currentCount}/{limit}</Badge>
      </Button>
    );
  }

  // Botão ativo
  return (
    <>
      <Button 
        variant={property.olx_enabled ? "default" : "outline"} 
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="gap-2"
      >
        <Globe className="w-4 h-4" />
        {property.olx_enabled ? 'OLX ✓' : 'OLX'}
        <Badge variant={property.olx_enabled ? "secondary" : "outline"}>
          {currentCount}/{limit}
        </Badge>
      </Button>
      
      <OlxPublicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
        onSave={handleSave}
      />
    </>
  );
}
