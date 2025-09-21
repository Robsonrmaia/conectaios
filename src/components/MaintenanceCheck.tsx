import { useEffect, useState } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import UnderConstruction from './UnderConstruction';
import { Button } from './ui/button';

interface MaintenanceCheckProps {
  children: React.ReactNode;
}

export default function MaintenanceCheck({ children }: MaintenanceCheckProps) {
  const { shouldShowMaintenancePage, loading } = useMaintenanceMode();
  const [bypassMaintenance, setBypassMaintenance] = useState(false);

  useEffect(() => {
    // Se estiver carregando por mais de 1.5 segundos, bypass automático
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('MaintenanceCheck: Auto-bypass due to loading timeout');
        setBypassMaintenance(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [loading]);

  // Bypass automático para não bloquear a aplicação
  if (loading || bypassMaintenance) {
    return <>{children}</>;
  }

  if (shouldShowMaintenancePage()) {
    return <UnderConstruction />;
  }

  return <>{children}</>;
}