import { useAuth } from "@/hooks/useAuth";
import { useBroker } from "@/hooks/useBroker";
import { Navigate } from "react-router-dom";
import BrokerSetup from "./BrokerSetup";
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { broker, loading: brokerLoading } = useBroker();

  // Debug logs
  console.log('Current URL:', window.location.pathname);

  if (authLoading || brokerLoading) {
    console.log('ProtectedRoute - Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Allow navigation even without broker profile
  // BrokerSetup will be shown only when accessing profile-related pages

  
  return <>{children}</>;
}