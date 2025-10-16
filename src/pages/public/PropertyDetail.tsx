import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PropertyPresentation } from '@/components/PropertyPresentation';
import { PropertyAIAssistant } from '@/components/PropertyAIAssistant';
import { Skeleton } from '@/components/ui/skeleton';

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
  fotos: string[];
  videos: string[];
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  reference_code: string;
  created_at: string;
  user_id: string;
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // SSR safety
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (id) {
      fetchPropertyAndBroker();
    }
  }, [id]);

  const fetchPropertyAndBroker = async () => {
    try {
      console.log('🔍 Buscando imóvel:', id);
      
      // Use edge function to fetch property
      const { data, error } = await supabase.functions.invoke('get-property-public', {
        body: { propertyId: id }
      });

      console.log('📦 Resposta da edge function:', { 
        hasData: !!data, 
        hasProperty: !!data?.property,
        hasBroker: !!data?.broker,
        imageCount: data?.images?.length || 0,
        error 
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error('Erro ao buscar imóvel');
      }

      if (!data?.property) {
        console.error('❌ Propriedade não encontrada no retorno');
        throw new Error('Imóvel não encontrado');
      }

      console.log('✅ Imóvel carregado:', data.property.titulo);
      
      // Map property data correctly
      const mappedProperty = {
        ...data.property,
        fotos: data.property.fotos || []
      };

      setProperty(mappedProperty);
      console.log('✅ Dados carregados com sucesso');

    } catch (error) {
      console.error('💥 Erro fatal:', error);
      toast({
        title: "Erro ao carregar imóvel",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Imóvel não encontrado</h1>
          <p className="text-muted-foreground mb-8">
            O imóvel que você está procurando não existe ou não está disponível.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PropertyPresentation component handles all the UI */}
      <PropertyPresentation 
        property={property}
        isOpen={true}
        onClose={() => navigate('/')}
      />

      {/* AI Assistant - only renders on client side */}
      {isMounted && createPortal(
        <PropertyAIAssistant property={{
          id: property.id,
          title: property.titulo,
          price: property.valor,
          area: property.area,
          bedrooms: property.quartos,
          bathrooms: property.bathrooms,
          parking: property.parking_spots,
          neighborhood: property.neighborhood,
          city: property.city,
          description: property.descricao,
          purpose: property.listing_type,
          type: property.property_type,
          owner_id: property.user_id || ''
        }} />,
        document.body
      )}
    </>
  );
}
