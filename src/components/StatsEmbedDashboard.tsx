import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export function StatsEmbedDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full max-w-2xl">
      {/* Badge acima do dashboard */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary rounded-full text-sm font-medium border border-primary/20">
          <Activity className="w-4 h-4" />
          Estatísticas em Tempo Real
        </div>
      </div>

      <Card className="w-full shadow-2xl border-0 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Dashboard de Mercado
            </CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Ao Vivo
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="aspect-video rounded-b-lg overflow-hidden relative group">
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 flex items-center justify-center z-10">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                  <div className="text-sm text-muted-foreground">Carregando estatísticas...</div>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>
            
            <iframe
              src="https://estatisticas.gicarneiroimoveis.com.br/"
              title="Dashboard de Estatísticas do Mercado Imobiliário"
              className="w-full h-full border-0"
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              onLoad={() => setIsLoading(false)}
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Indicadores abaixo do dashboard */}
      <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          Dados Atualizados
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Mercado em Movimento
        </div>
      </div>
    </div>
  );
}