import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AgendarColeta } from "./pages/AgendarColeta";
import { RotaInteligente } from "./pages/RotaInteligente";
import { Relatorios } from "./pages/Relatorios";
import { IAInsights } from "./pages/IAInsights";
import { Coletas } from "./pages/Coletas";
import { Auth } from "./pages/Auth";
import { MetricsManagement } from "./pages/MetricsManagement";
import { ItemsManagement } from "./pages/ItemsManagement";
import { UserManagement } from "./pages/UserManagement";
import { ClientManagement } from "./pages/ClientManagement"; // Importar a nova página
import { Debug } from "./pages/Debug";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SidebarNav } from "./components/SidebarNav";
import { useIsMobile } from "./hooks/use-mobile";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext"; // Importar o contexto do sidebar
import { cn } from "./lib/utils"; // Importar cn para classes condicionais

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider> {/* Envolve toda a aplicação com o provedor do sidebar */}
              <AppLayout />
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

// Componente auxiliar para usar o hook useSidebar
const AppLayout = () => {
  const isMobile = useIsMobile();
  const { mainContentMarginClass } = useSidebar(); // Obtém a classe de margem do contexto

  return (
    <div className="flex min-h-screen bg-background ai-pattern">
      {/* Sidebar de navegação */}
      <SidebarNav />

      {/* Conteúdo principal */}
      <main className={cn("flex-1 transition-all duration-300 ease-in-out", isMobile ? 'ml-0' : mainContentMarginClass)}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/debug" element={<Debug />} />
          
          {/* Rotas acessíveis a todos os usuários autenticados (padrão e admin) */}
          <Route element={<ProtectedRoute allowedRoles={['standard', 'admin']} />}>
            <Route path="/" element={<Index />} />
            <Route path="/agendar-coleta" element={<AgendarColeta />} />
            <Route path="/rota-inteligente" element={<RotaInteligente />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/ia-insights" element={<IAInsights />} />
            <Route path="/coletas" element={<Coletas />} />
          </Route>

          {/* Rotas acessíveis SOMENTE a administradores */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/metrics-management" element={<MetricsManagement />} />
            <Route path="/items-management" element={<ItemsManagement />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/client-management" element={<ClientManagement />} /> {/* Nova rota */}
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;