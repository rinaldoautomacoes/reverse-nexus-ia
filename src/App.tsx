import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AgendarColeta } from "./pages/AgendarColeta";
import { Relatorios } from "./pages/Relatorios";
import { Coletas } from "./pages/Coletas";
import { ColetasConcluidas } from "./pages/ColetasConcluidas";
import { Auth } from "./pages/Auth";
import { MetricsManagement } from "./pages/MetricsManagement";
import { UserManagement } from "./pages/UserManagement";
import { ClientManagement } from "./pages/ClientManagement";
import { ProductManagement } from "./pages/ProductManagement";
import { Debug } from "./pages/Debug";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary"; // Importação corrigida
import { useIsMobile } from "./hooks/use-mobile";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { cn } from "./lib/utils";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <AppLayout />
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

const AppLayout = () => {
  const isMobile = useIsMobile();
  const { mainContentMarginClass } = useSidebar();
  const [selectedYear, setSelectedYear] = useState<string>('2025');

  return (
    <div className="flex min-h-screen bg-background ai-pattern">
      <SidebarNav selectedYear={selectedYear} setSelectedYear={setSelectedYear} /> {/* Passar props para SidebarNav */}

      <main className={cn("flex-1 transition-all duration-300 ease-in-out", isMobile ? 'ml-0' : mainContentMarginClass)}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/debug" element={<Debug />} />
          
          <Route element={<ProtectedRoute allowedRoles={['standard', 'admin']} />}>
            <Route path="/" element={<Index selectedYear={selectedYear} />} />
            <Route path="/agendar-coleta" element={<AgendarColeta />} />
            <Route path="/coletas-ativas" element={<Coletas />} />
            <Route path="/coletas-concluidas" element={<ColetasConcluidas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/product-management" element={<ProductManagement />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/metrics-management" element={<MetricsManagement />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/client-management" element={<ClientManagement />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;