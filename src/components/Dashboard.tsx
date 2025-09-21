import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Package, 
  MapPin, 
  TrendingUp, 
  Brain, 
  Zap,
  Route,
  Clock,
  AlertTriangle,
  Gauge,
  ListChecks,
  Users,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBackground from "@/assets/hero-background.jpg";
import { MetricsCards } from "./MetricsCards";
// import { RouteMap } from "./RouteMap"; // Removido
// import { AIAssistant } from "./AIAssistant"; // Removido
// import { RecentActivity } from "./RecentActivity"; // Removido
import { PerformanceChart } from "./PerformanceChart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
// import { AuthButton } from "./AuthButton"; // Removido
import { CollectionStatusDonutChart } from "./CollectionStatusDonutChart"; // Importar o novo componente

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-background ai-pattern">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-darker/90 to-transparent" />
        
        {/* Botões "Iniciar Rota IA" e "Dashboard IA" no canto superior esquerdo */}
        <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-4 animate-slide-up animation-delay-400">
          {/* Removido o botão "Iniciar Rota IA" */}
          {/* Removido o botão "Dashboard IA" */}
        </div>

        {/* O AuthButton foi movido para o SidebarNav */}
        {/* <div className="absolute top-6 right-6 z-20 animate-slide-up animation-delay-400">
          <AuthButton />
        </div> */}

        <div className="relative z-10 flex flex-col justify-start pt-24 h-full px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-5xl lg:text-7xl font-bold font-orbitron gradient-text mb-4 animate-slide-up animate-text-pulse-fade">
              LogiReversa
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              Plataforma Inteligente de Logística Reversa
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 lg:px-8 py-8 space-y-8">
        {/* AI Status Bar */}
        <div className="card-futuristic p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow" />
              <span className="text-sm font-medium">IA Ativa - Otimizando Rotas</span>
              <Badge variant="secondary" className="bg-neural/20 text-neural">
                <Brain className="w-3 h-3 mr-1" />
                Neural Mode
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary" />
              Sistema Operacional
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <MetricsCards />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <PerformanceChart />
            {/* <RouteMap /> */} {/* Removido */}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <CollectionStatusDonutChart /> {/* Novo gráfico de rosca */}
          </div>
        </div>

        {/* Os botões de ação foram movidos para o SidebarNav */}
      </div>
    </div>
  );
};