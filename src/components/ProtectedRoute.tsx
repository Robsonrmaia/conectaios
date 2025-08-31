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
  console.log('ProtectedRoute - authLoading:', authLoading, 'brokerLoading:', brokerLoading);
  console.log('ProtectedRoute - user:', !!user, 'broker:', !!broker);
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

  // If user exists but no broker profile, show setup
  if (user && !broker) {
    console.log('ProtectedRoute - User exists but no broker, showing setup');
    return <BrokerSetup />;
  }

  console.log('ProtectedRoute - All good, rendering children');
  return <>{children}</>;
}