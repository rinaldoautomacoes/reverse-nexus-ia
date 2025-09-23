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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useIsMobile } from "./hooks/use-mobile";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { cn } from "./lib/utils";
import { useState } from "react";
import { SidebarNav } from "./components/SidebarNav";

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
  const { mainContentMarginClass } = useSidebar(); // Esta classe não será mais usada para o layout principal
  const [selectedYear, setSelectedYear] = useState<string>('2025');

  return (
    <div className="container bg-background ai-pattern">
      {/* Header Area */}
      <div style={{ gridArea: 'header' }} className="bg-card p-2 text-center text-muted-foreground">Header Placeholder</div>

      {/* Left Aside Area (SidebarNav) */}
      {/* O SidebarNav agora é um item de grid e não mais fixo */}
      <SidebarNav selectedYear={selectedYear} setSelectedYear={setSelectedYear} />

      {/* Banner Area */}
      <div style={{ gridArea: 'banner' }} className="bg-secondary/20 p-2 text-center text-muted-foreground">Banner Placeholder</div>

      {/* Main Content Area */}
      <main style={{ gridArea: 'main' }} className="p-4">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/debug" element={<Debug />} />
          
          <Route element={<ProtectedRoute allowedRoles={['standard', 'admin']} />}>
            <Route path="/" element={<Index selectedYear={selectedYear} />} />
            <Route path="/agendar-coleta" element={<AgendarColeta />} />
            <Route path="/coletas-ativas" element={<Coletas selectedYear={selectedYear} />} />
            <Route path="/coletas-concluidas" element={<ColetasConcluidas selectedYear={selectedYear} />} />
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

      {/* Right Aside Area */}
      <div style={{ gridArea: 'right-aside' }} className="bg-card p-2 text-center text-muted-foreground">Right Aside Placeholder</div>

      {/* Low Content Area */}
      <div style={{ gridArea: 'low-content' }} className="bg-secondary/20 p-2 text-center text-muted-foreground">Low Content Placeholder</div>

      {/* Footer Area */}
      <div style={{ gridArea: 'footer' }} className="bg-card p-2 text-center text-sm text-muted-foreground">Footer Placeholder</div>
    </div>
  );
};

export default App;