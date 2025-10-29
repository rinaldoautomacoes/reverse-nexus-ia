import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index"; // Keep for now, but will be less prominent
import NotFound from "./pages/NotFound";
import { AgendarColetaPage } from "./pages/AgendarColetaPage";
import { AgendarEntregaPage } from "./pages/AgendarEntregaPage";
import { Relatorios } from "./pages/Relatorios";
import { RelatoriosEntregas } from "./pages/RelatoriosEntregas";
import { Coletas } from "./pages/Coletas";
import ColetasConcluidas from "./pages/ColetasConcluidas";
import { Auth } from "./pages/Auth";
import { MetricsManagement } from "./pages/MetricsManagement";
import { UserManagement } from "./pages/UserManagement";
import { ClientManagement } from "./pages/ClientManagement";
import { ProductManagement } from "./pages/ProductManagement";
import { EntregasAtivas } from "./pages/EntregasAtivas";
import { EntregasConcluidasPage } from "./pages/EntregasConcluidasPage";
import EntregasConcluidasList from "./pages/EntregasConcluidasList";
import { Debug } from "./pages/Debug";
import Roteirizacao from "./pages/Roteirizacao";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useIsMobile } from "./hooks/use-mobile";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { cn } from "./lib/utils";
import { useState } from "react";
import { SidebarNav } from "./components/SidebarNav";
import { LandingPage } from "./pages/LandingPage";
import { EntregasDashboardPage } from "./pages/EntregasDashboardPage";
import { DriverManagement } from "./pages/DriverManagement";
import { TransportadoraManagement } from "./pages/TransportadoraManagement";
import { GeneralDashboard } from "./pages/GeneralDashboard";
import { ExcelExtractorPage } from "./pages/ExcelExtractorPage";
import { AutomaticCollectionSchedulerPage } from "./pages/AutomaticCollectionSchedulerPage"; // Import the new page
import { DataImportPage } from "./pages/DataImportPage"; // Import the new DataImportPage

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <AppLayout />
            </SidebarProvider>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

const AppLayout = () => {
  const isMobile = useIsMobile();
  const { mainContentMarginClass } = useSidebar();
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const location = useLocation();

  const showSidebar = location.pathname !== '/auth';

  return (
    <div className="flex min-h-screen bg-background ai-pattern">
      {showSidebar && <SidebarNav selectedYear={selectedYear} setSelectedYear={setSelectedYear} />}

      <main className={cn("flex-1 transition-all duration-300 ease-in-out", showSidebar && !isMobile ? mainContentMarginClass : 'ml-0')}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/debug" element={<Debug />} />
          
          <Route element={<ProtectedRoute allowedRoles={['standard', 'admin']} />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard-geral" element={<GeneralDashboard selectedYear={selectedYear} />} />
            <Route path="/coletas-dashboard" element={<Index selectedYear={selectedYear} />} />
            <Route path="/dashboard-entregas" element={<EntregasDashboardPage selectedYear={selectedYear} />} />
            <Route path="/agendar-coleta" element={<AgendarColetaPage />} />
            <Route path="/agendar-entrega" element={<AgendarEntregaPage />} />
            <Route path="/coletas-ativas" element={<Coletas selectedYear={selectedYear} />} />
            <Route path="/coletas-concluidas" element={<ColetasConcluidas selectedYear={selectedYear} />} />
            <Route path="/entregas-ativas" element={<EntregasAtivas selectedYear={selectedYear} />} />
            <Route path="/entregas-concluidas" element={<EntregasConcluidasList selectedYear={selectedYear} />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/relatorios-entregas" element={<RelatoriosEntregas />} />
            <Route path="/product-management" element={<ProductManagement />} />
            <Route path="/roteirizacao" element={<Roteirizacao />} />
            <Route path="/driver-management" element={<DriverManagement />} />
            <Route path="/transportadora-management" element={<TransportadoraManagement />} />
            <Route path="/excel-extractor" element={<ExcelExtractorPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/metrics-management" element={<MetricsManagement />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/client-management" element={<ClientManagement />} />
            <Route path="/agendamento-automatico" element={<AutomaticCollectionSchedulerPage />} />
            <Route path="/data-import" element={<DataImportPage />} /> {/* New route for Data Import */}
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;