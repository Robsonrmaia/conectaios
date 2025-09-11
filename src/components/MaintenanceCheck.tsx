import { useEffect } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import UnderConstruction from './UnderConstruction';

interface MaintenanceCheckProps {
  children: React.ReactNode;
}

export default function MaintenanceCheck({ children }: MaintenanceCheckProps) {
  const { shouldShowMaintenancePage, loading } = useMaintenanceMode();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando status do sistema...</p>
        </div>
      </div>
    );
  }

  if (shouldShowMaintenancePage()) {
    return <UnderConstruction />;
  }

  return <>{children}</>;
}