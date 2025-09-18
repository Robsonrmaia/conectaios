import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Home, Search } from 'lucide-react';

// Loading skeleton for minisite properties
export function MinisitePropertiesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="w-full h-48 mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-2" />
              <div className="flex gap-4 mb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-2/3 mb-3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state when no properties found
export function MinisiteEmptyState({ 
  onContactClick,
  primaryColor = '#1CA9C9' 
}: { 
  onContactClick?: () => void;
  primaryColor?: string;
}) {
  return (
    <Card>
      <CardContent className="text-center py-16">
        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Nenhum imóvel disponível</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Este corretor ainda não publicou imóveis ou eles não estão disponíveis no momento.
          Entre em contato para mais informações sobre oportunidades disponíveis.
        </p>
        {onContactClick && (
          <Button 
            onClick={onContactClick}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Falar com o Corretor
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// No results state for filtered search
export function MinisiteNoResultsState({ 
  onClearSearch 
}: { 
  onClearSearch?: () => void;
}) {
  return (
    <div className="text-center py-16">
      <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Nenhum imóvel encontrado</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Tente ajustar os filtros de pesquisa para encontrar mais imóveis que atendam aos seus critérios.
      </p>
      {onClearSearch && (
        <Button variant="outline" onClick={onClearSearch}>
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}

// Error state component
export function MinisiteErrorState({ 
  message = "Erro ao carregar imóveis",
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="text-center py-16">
        <div className="rounded-full bg-red-100 p-3 w-fit mx-auto mb-4">
          <Building2 className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-red-900">Ops! Algo deu errado</h3>
        <p className="text-red-700 max-w-md mx-auto mb-6">
          {message}. Tente novamente em alguns instantes.
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Tentar Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}