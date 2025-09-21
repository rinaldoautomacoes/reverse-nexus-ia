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
import { ProductStatusChart } from "./ProductStatusChart"; // Importado o novo componente
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
// import { AuthButton } from "./AuthButton"; // Removido
import { CollectionStatusDonutChart } from "./CollectionStatusDonutChart"; // Importar o novo componente
// import { useState } from "react"; // Importar useState - REMOVIDO

interface DashboardProps {
  selectedYear: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  // const [selectedYear, setSelectedYear] = useState<string>('2025'); // Estado para o ano selecionado - REMOVIDO

  return (
    <div className="min-h-screen bg-background ai-pattern">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-darker/90 to-transparent" />
        
        {/* Botões de seleção de ano - REMOVIDO */}
        {/* <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-4 animate-slide-up animation-delay-400">
          <Button 
            variant="outline" 
            className={`bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/80 glow-effect ${selectedYear === '2025' ? 'border-2 border-neon-cyan' : 'border-transparent'}`}
            onClick={() => setSelectedYear('2025')}
          >
            Ano Atual 2025
          </Button>
          <Button 
            variant="outline" 
            className={`bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/80 glow-effect ${selectedYear === '2026' ? 'border-2 border-neon-cyan' : 'border-transparent'}`}
            onClick={() => setSelectedYear('2026')}
          >
            Ano 2026
          </Button>
        </div> */}

        <div className="relative z-10 flex flex-col justify-start pt-12 h-full px-6 lg:px-8">
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
        {/* Metrics Cards */}
        <MetricsCards selectedYear={selectedYear} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <ProductStatusChart selectedYear={selectedYear} />
            {/* <RouteMap /> */} {/* Removido */}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <CollectionStatusDonutChart selectedYear={selectedYear} />
          </div>
        </div>

        {/* Os botões de ação foram movidos para o SidebarNav */}
      </div>
    </div>
  );
};