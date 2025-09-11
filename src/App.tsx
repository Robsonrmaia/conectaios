import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BrokerProvider, useBroker } from "@/hooks/useBroker";
import { MinisiteProvider } from "@/hooks/useMinisite";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import MaintenanceCheck from "@/components/MaintenanceCheck";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/app/Dashboard";
import Imoveis from "./pages/app/Imoveis";
import Marketplace from "./pages/app/Marketplace";
import Minisite from "./pages/app/Minisite";
import Match from "./pages/app/Match";
import Deals from "./pages/app/Deals";
import Inbox from "./pages/app/Inbox";
import CRM from "./pages/app/CRM";
import MinhasBuscas from "./pages/app/MinhasBuscas";
import Ferramentas from "./pages/app/Ferramentas";
import ConectaIOSImageApp from "./components/ConectaIOSImageApp";
import Videos from "./pages/app/Videos";
import Indicacoes from "./pages/app/Indicacoes";
import Patrocinios from "./pages/app/Patrocinios";
import AIAssistant from "./pages/app/AIAssistant";
import AuditLogs from "./pages/app/AuditLogs";
import Perfil from "./pages/app/Perfil";
import Admin from "./pages/app/Admin";
import Suporte from "./pages/app/Suporte";
import AdminMaster from "./pages/AdminMaster";
import NotFound from "./pages/NotFound";
import PropertyDetail from "@/pages/public/PropertyDetail";
import BrokerMinisite from "@/pages/public/BrokerMinisite";
import PublicProbe from "@/pages/PublicProbe";

const AtRedirect = () => {
  const { username } = useParams<{ username: string }>();
  const clean = (username ?? "").replace(/^@+/, "");
  return <Navigate to={`/broker/${clean}`} replace />;
};

const BrokerRedirect = () => {
  return <Navigate to="/" replace />;
};

const queryClient = new QueryClient();

const UserInfo = () => {
  const { user, signOut } = useAuth();
  const { broker } = useBroker();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium">{broker?.name || user.email?.split('@')[0]}</div>
        <div className="text-xs text-muted-foreground">{broker?.creci || 'Corretor'}</div>
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={broker?.avatar_url} />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { shouldShowTour, completeTour, loading } = useOnboarding();

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4 shrink-0">
            <SidebarTrigger />
            <UserInfo />
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      {shouldShowTour && (
        <OnboardingTour onComplete={completeTour} />
      )}
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrokerProvider>
          <MinisiteProvider>
            <MaintenanceCheck>
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin-master" element={<AdminMaster />} />
                <Route path="/@:username" element={<AtRedirect />} />
                <Route path="/broker" element={<BrokerRedirect />} />
                <Route path="/broker/:username" element={<BrokerMinisite />} />
                <Route path="/imovel/:id" element={<PropertyDetail />} />
                <Route path="/public-test" element={<PublicProbe />} />
                <Route path="/app/*" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="imoveis" element={<Imoveis />} />
                        <Route path="minhas-buscas" element={<MinhasBuscas />} />
                        <Route path="marketplace" element={<Marketplace />} />
                        <Route path="minisite" element={<Minisite />} />
                        <Route path="match" element={<Match />} />
                        <Route path="deals" element={<Deals />} />
                        <Route path="inbox" element={<Inbox />} />
                        <Route path="crm" element={<CRM />} />
                        <Route path="ferramentas" element={<Ferramentas />} />
                        <Route path="ferramentas/image-creator" element={<ConectaIOSImageApp />} />
                        <Route path="videos" element={<Videos />} />
                        <Route path="indicacoes" element={<Indicacoes />} />
                        <Route path="patrocinios" element={<Patrocinios />} />
                         <Route path="ai-assistant" element={<AIAssistant />} />
                         <Route path="audit-logs" element={<AuditLogs />} />
                         <Route path="admin" element={<Admin />} />
                         <Route path="perfil" element={<Perfil />} />
                         <Route path="suporte" element={<Suporte />} />
                         <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </MaintenanceCheck>
          </MinisiteProvider>
        </BrokerProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;