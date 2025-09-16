import { useEffect, useState } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import UnderConstruction from './UnderConstruction';
import { Button } from './ui/button';

interface MaintenanceCheckProps {
  children: React.ReactNode;
}

export default function MaintenanceCheck({ children }: MaintenanceCheckProps) {
  const { shouldShowMaintenancePage, loading } = useMaintenanceMode();
  const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Timeout de segurança para evitar loading infinito
    const timer = setTimeout(() => {
      console.log('MaintenanceCheck: Loading timeout reached');
      setLoadingTimeout(true);
    }, 8000); // 8 segundos

    // Emergency access after 12 seconds
    const emergencyTimer = setTimeout(() => {
      console.log('MaintenanceCheck: Emergency access enabled');
      setShowEmergencyAccess(true);
    }, 12000);

    if (!loading) {
      clearTimeout(timer);
      clearTimeout(emergencyTimer);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(emergencyTimer);
    };
  }, [loading]);

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando status do sistema...</p>
          {showEmergencyAccess && (
            <div className="mt-6">
              <Button 
                onClick={() => setLoadingTimeout(true)}
                variant="outline"
                size="sm"
              >
                Continuar mesmo assim
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Se deu timeout no loading, sempre permite acesso
  if (loadingTimeout) {
    console.log('MaintenanceCheck: Allowing access due to timeout');
    return <>{children}</>;
  }

  if (shouldShowMaintenancePage()) {
    return <UnderConstruction />;
  }

  return <>{children}</>;
}