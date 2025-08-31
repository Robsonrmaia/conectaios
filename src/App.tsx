import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BrokerProvider } from "@/hooks/useBroker";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Ferramentas from "./pages/app/Ferramentas";
import Videos from "./pages/app/Videos";
import Indicacoes from "./pages/app/Indicacoes";
import Patrocinios from "./pages/app/Patrocinios";
import AIAssistant from "./pages/app/AIAssistant";
import Perfil from "./pages/app/Perfil";
import Admin from "./pages/app/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  console.log('AppLayout rendering, children:', children);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="ml-4" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrokerProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <AppLayout>
            <Routes>
              <Route index element={
                <>
                  {console.log('Rendering Dashboard route')}
                  <Dashboard />
                </>
              } />
              <Route path="imoveis" element={
                <>
                  {console.log('Rendering Imoveis route')}
                  <Imoveis />
                </>
              } />
              <Route path="marketplace" element={
                <>
                  {console.log('Rendering Marketplace route')}
                  <Marketplace />
                </>
              } />
              <Route path="minisite/:brokerId" element={
                <>
                  {console.log('Rendering Minisite route')}
                  <Minisite />
                </>
              } />
              <Route path="match" element={
                <>
                  {console.log('Rendering Match route')}
                  <Match />
                </>
              } />
              <Route path="deals" element={
                <>
                  {console.log('Rendering Deals route')}
                  <Deals />
                </>
              } />
              <Route path="inbox" element={
                <>
                  {console.log('Rendering Inbox route')}
                  <Inbox />
                </>
              } />
              <Route path="crm" element={
                <>
                  {console.log('Rendering CRM route')}
                  <CRM />
                </>
              } />
              <Route path="ferramentas" element={
                <>
                  {console.log('Rendering Ferramentas route')}
                  <Ferramentas />
                </>
              } />
              <Route path="videos" element={
                <>
                  {console.log('Rendering Videos route')}
                  <Videos />
                </>
              } />
              <Route path="indicacoes" element={
                <>
                  {console.log('Rendering Indicacoes route')}
                  <Indicacoes />
                </>
              } />
              <Route path="patrocinios" element={
                <>
                  {console.log('Rendering Patrocinios route')}
                  <Patrocinios />
                </>
              } />
              <Route path="ai-assistant" element={
                <>
                  {console.log('Rendering AIAssistant route')}
                  <AIAssistant />
                </>
              } />
              <Route path="perfil" element={
                <>
                  {console.log('Rendering Perfil route')}
                  <Perfil />
                </>
              } />
              <Route path="admin" element={
                <>
                  {console.log('Rendering Admin route')}
                  <Admin />
                </>
              } />
              <Route path="*" element={
                <>
                  {console.log('Rendering NotFound route')}
                  <NotFound />
                </>
              } />
            </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </BrokerProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
