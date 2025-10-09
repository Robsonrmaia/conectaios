import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, AlertTriangle } from 'lucide-react';

interface ProtectedFeatureProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
  showBlocker?: boolean;
}

/**
 * Higher-Order Component para proteger funcionalidades baseado em assinatura
 * 
 * Uso:
 * ```tsx
 * <ProtectedFeature feature="ai_descriptions">
 *   <AIPropertyDescription propertyId={id} />
 * </ProtectedFeature>
 * ```
 * 
 * @param children - Conteúdo a ser protegido
 * @param feature - Nome da feature (opcional, para controle granular)
 * @param fallback - Componente alternativo se não tiver acesso
 * @param showBlocker - Se deve mostrar bloqueador padrão ou apenas ocultar
 */
export function ProtectedFeature({ 
  children, 
  feature,
  fallback,
  showBlocker = true 
}: ProtectedFeatureProps) {
  const navigate = useNavigate();
  const { 
    canAccessFeature, 
    getBlockMessage,
    isOverdue,
    isSuspended,
    isCancelled 
  } = useSubscriptionGuard();
  
  // Verificar se tem acesso
  const hasAccess = canAccessFeature(feature);
  
  // Se tem acesso, renderiza normalmente
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Se tem fallback customizado, usa ele
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Se não deve mostrar bloqueador, não renderiza nada
  if (!showBlocker) {
    return null;
  }
  
  // Renderiza bloqueador padrão
  return (
    <Card className="border-2 border-dashed border-border">
      <CardContent className="pt-6">
        <div className="text-center space-y-4 max-w-md mx-auto">
          {/* Ícone */}
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {isSuspended || isCancelled ? (
              <Lock className="h-8 w-8 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            )}
          </div>
          
          {/* Título */}
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {isSuspended && 'Acesso Bloqueado'}
              {isOverdue && 'Pagamento Pendente'}
              {isCancelled && 'Assinatura Cancelada'}
              {!isSuspended && !isOverdue && !isCancelled && 'Funcionalidade Premium'}
            </h3>
            
            {/* Mensagem */}
            <p className="text-sm text-muted-foreground">
              {getBlockMessage()}
            </p>
          </div>
          
          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              onClick={() => navigate('/app/checkout')}
              variant={isSuspended ? 'default' : 'outline'}
            >
              {isSuspended || isOverdue ? 'Regularizar Pagamento' : 'Ver Planos'}
            </Button>
            
            {(isSuspended || isOverdue) && (
              <Button 
                variant="ghost"
                onClick={() => navigate('/app/suporte')}
              >
                Falar com Suporte
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
