import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface DebugProperty {
  id: string;
  title: string;
  visibility: string;
  price: number;
  city: string;
  neighborhood: string;
  parking: number;
  condo_fee: number;
  updated_at: string;
}

export default function MarketplaceDebug() {
  const [properties, setProperties] = useState<DebugProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    try {
      console.log('🔍 [DEBUG] Iniciando consulta properties_market...');
      
      const { data, error: queryError } = await supabase
        .from('properties_market')
        .select('id,title,visibility,price,city,neighborhood,parking,condo_fee,updated_at')
        .eq('show_in_marketplace', true)
        .order('updated_at', { ascending: false });

      if (queryError) {
        console.error('❌ [DEBUG] Erro na query:', queryError);
        setError(queryError);
        return;
      }

      console.log('✅ [DEBUG] Dados retornados:', data?.length || 0, 'registros');
      console.log('📊 [DEBUG] Primeiros 3 registros:', data?.slice(0, 3));
      
      setProperties(data || []);
    } catch (err) {
      console.error('❌ [DEBUG] Erro geral:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug: properties_market</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-4">
              <h3 className="font-semibold mb-2">Erro:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-y-2 mb-4">
            <p className="text-sm">
              <strong>Total de registros:</strong> {properties.length}
            </p>
            <p className="text-sm">
              <strong>Query executada:</strong>
            </p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
{`supabase
  .from('properties_market')
  .select('id,title,visibility,price,city,neighborhood,parking,condo_fee,updated_at')
  .eq('show_in_marketplace', true)
  .order('updated_at', { ascending: false })`}
            </pre>
          </div>

          <div className="space-y-4">
            {properties.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum imóvel encontrado com show_in_marketplace = true
              </p>
            ) : (
              properties.map((prop) => (
                <Card key={prop.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{prop.title}</h3>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{prop.id.slice(0, 8)}</Badge>
                          <Badge>{prop.visibility}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>💰 R$ {prop.price?.toLocaleString('pt-BR')}</p>
                          <p>📍 {prop.city} - {prop.neighborhood}</p>
                          {prop.parking > 0 && <p>🚗 {prop.parking} vaga(s)</p>}
                          {prop.condo_fee > 0 && <p>🏢 Condomínio: R$ {prop.condo_fee}</p>}
                          <p className="text-xs">🕒 {new Date(prop.updated_at).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
