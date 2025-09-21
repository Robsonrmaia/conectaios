import { useAuth } from "@/hooks/useAuth";
import { useBroker } from "@/hooks/useBroker";
import { Navigate } from "react-router-dom";
import BrokerSetup from "./BrokerSetup";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { loading: brokerLoading } = useBroker();

  // Otimizado: só mostra loading se auth estiver carregando
  // Broker loading não deve bloquear a navegação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img 
            src="https://hvbdeyuqcliqrmzvyciq.supabase.co/storage/v1/object/public/property-images/logonova.png" 
            alt="ConectaIOS Logo" 
            className="h-8 w-8 animate-spin mx-auto mb-4"
          />
          <p className="text-muted-foreground">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Permite navegação mesmo sem perfil de broker completamente carregado
  return <>{children}</>;
}