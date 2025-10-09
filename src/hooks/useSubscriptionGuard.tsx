import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBroker } from './useBroker';
import { toast } from '@/hooks/use-toast';

/**
 * Hook para verificar status da assinatura em tempo real
 * Bloqueia acesso a funcionalidades premium se inativo
 */
export function useSubscriptionGuard() {
  const { broker } = useBroker();
  const navigate = useNavigate();
  
  // Status checks
  const isActive = broker?.subscription_status === 'active';
  const isTrial = broker?.subscription_status === 'trial';
  const isOverdue = broker?.subscription_status === 'overdue';
  const isSuspended = broker?.subscription_status === 'suspended';
  const isCancelled = broker?.subscription_status === 'cancelled';
  
  // Calcular dias até expiração
  const daysUntilExpiration = useMemo(() => {
    if (!broker?.subscription_expires_at) return null;
    
    const expiresAt = new Date(broker.subscription_expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return days;
  }, [broker?.subscription_expires_at]);
  
  // Auto-redirecionar se suspenso (exceto na página de checkout)
  useEffect(() => {
    if (isSuspended && window.location.pathname !== '/app/checkout') {
      toast({
        title: "Assinatura Suspensa",
        description: "Sua assinatura está suspensa por falta de pagamento. Regularize para continuar.",
        variant: "destructive",
      });
      navigate('/app/checkout');
    }
  }, [isSuspended, navigate]);
  
  /**
   * Verifica se usuário pode acessar uma feature específica
   * @param feature Nome da feature (opcional)
   * @returns true se tem acesso, false se bloqueado
   */
  const canAccessFeature = (feature?: string): boolean => {
    // Sempre bloqueia se suspenso
    if (isSuspended) return false;
    
    // Trial tem acesso a tudo temporariamente
    if (isTrial) return true;
    
    // Ativo tem acesso total
    if (isActive) return true;
    
    // Overdue: permitir leitura mas bloquear criação/edição
    if (isOverdue && feature) {
      const readOnlyFeatures = ['view', 'list', 'search'];
      return readOnlyFeatures.some(rf => feature.includes(rf));
    }
    
    // Default: bloqueia
    return false;
  };
  
  /**
   * Mensagem de bloqueio contextual baseada no status
   */
  const getBlockMessage = (): string => {
    if (isSuspended) {
      return 'Sua assinatura está suspensa. Regularize seu pagamento para continuar usando o ConectaIOS.';
    }
    
    if (isOverdue) {
      const daysOverdue = daysUntilExpiration ? Math.abs(daysUntilExpiration) : 0;
      return `Seu pagamento está atrasado há ${daysOverdue} dia${daysOverdue !== 1 ? 's' : ''}. Regularize para manter acesso total às funcionalidades.`;
    }
    
    if (isCancelled) {
      return 'Sua assinatura foi cancelada. Reative para continuar usando o ConectaIOS.';
    }
    
    return 'Esta funcionalidade requer uma assinatura ativa.';
  };
  
  return {
    // Status flags
    isActive,
    isTrial,
    isOverdue,
    isSuspended,
    isCancelled,
    
    // Dados calculados
    daysUntilExpiration,
    
    // Métodos
    canAccessFeature,
    getBlockMessage,
    
    // Status geral
    hasAccess: isActive || isTrial,
    needsAction: isOverdue || isSuspended || isCancelled,
  };
}
