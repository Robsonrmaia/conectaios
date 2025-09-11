import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Activity, ExternalLink } from 'lucide-react';

export function StatsEmbedDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(true)}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir
                </Button>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Ao Vivo
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div 
              className="h-[400px] md:h-[500px] lg:aspect-video rounded-b-lg overflow-hidden relative group cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 flex items-center justify-center z-10">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <div className="text-sm text-muted-foreground">Carregando estatísticas...</div>
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Clique para expandir
                </div>
              </div>
              
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
                sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
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

      {/* Modal para visualização completa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <iframe
            src="https://estatisticas.gicarneiroimoveis.com.br/"
            title="Dashboard de Estatísticas - Tela Cheia"
            className="w-full h-full border-0"
            style={{
              width: '100vw',
              height: '100vh',
              border: 'none'
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm"
          >
            Fechar
          </Button>
        </div>
      )}
    </>
  );
}