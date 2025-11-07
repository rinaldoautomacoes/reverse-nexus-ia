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
import { EntregasMetricsCards } from "./EntregasMetricsCards"; // Importar o novo componente
import { EntregasConcluidasStatusChart } from "./EntregasConcluidasStatusChart";
import { useAuth } from "@/hooks/useAuth";
import { EntregasConcluidasStatusDonutChart } from "./EntregasConcluidasStatusDonutChart";

interface EntregasConcluidasDashboardProps {
  selectedYear: string;
}

export const EntregasConcluidasDashboard: React.FC<EntregasConcluidasDashboardProps> = ({ selectedYear }) => {
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

        <div className="relative z-10 flex flex-col justify-start pt-12 h-full px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-5xl lg:text-7xl font-bold font-orbitron gradient-text mb-4 animate-slide-up animate-text-pulse-fade">
              Entregas Concluídas
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              Gestão Inteligente de Entregas Finalizadas
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 lg:px-8 py-8 space-y-8">
        {/* Metrics Cards */}
        <EntregasMetricsCards selectedYear={selectedYear} /> {/* Usando o novo componente */}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <EntregasConcluidasStatusChart selectedYear={selectedYear} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <EntregasConcluidasStatusDonutChart selectedYear={selectedYear} />
          </div>
        </div>
      </div>
    </div>
  );
};