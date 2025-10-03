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
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBackground from "@/assets/hero-background.jpg";
import { MetricsCards } from "./MetricsCards";
import { ProductStatusChart } from "./ProductStatusChart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CollectionStatusDonutChart } from "./CollectionStatusDonutChart";
import { CollectionReportSummaryCard } from "./CollectionReportSummaryCard";
import { DeliveryReportSummaryCard } from "./DeliveryReportSummaryCard";
import { EntregasAtivasStatusDonutChart } from "./EntregasAtivasStatusDonutChart";
import { PerformanceChart } from "./PerformanceChart";
import { useQuery } from "@tanstack/react-query";

interface ColetasDashboardProps {
  selectedYear: string;
}

export const ColetasDashboard: React.FC<ColetasDashboardProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Fetch monthly data for performance chart
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-performance', user?.id, selectedYear],
    queryFn: async () => {
      const { data: coletas, error: coletasError } = await supabase
        .from('coletas')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'coleta')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`);

      const { data: entregas, error: entregasError } = await supabase
        .from('coletas')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'entrega')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`);

      if (coletasError || entregasError) throw coletasError || entregasError;

      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthlyStats = months.map((month, index) => {
        const monthNumber = index + 1;
        const coletasCount = coletas?.filter(c => {
          const date = new Date(c.created_at);
          return date.getMonth() + 1 === monthNumber;
        }).length || 0;

        const itemsCount = coletas?.filter(c => {
          const date = new Date(c.created_at);
          return date.getMonth() + 1 === monthNumber;
        }).reduce((sum, c) => sum + (c.qtd_aparelhos_solicitado || 0), 0) || 0;

        return {
          month,
          totalColetas: coletasCount,
          totalItems: itemsCount,
        };
      });

      return monthlyStats;
    },
    enabled: !!user?.id,
  });

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
              Dashboard Home
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              Visão geral e métricas em tempo real
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-futuristic border-0 hover:scale-105 transition-transform">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-orbitron gradient-text">
                <FileText className="h-5 w-5 text-neon-cyan" />
                Relatório de Coletas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CollectionReportSummaryCard selectedYear={selectedYear} />
            </CardContent>
          </Card>

          <Card className="card-futuristic border-0 hover:scale-105 transition-transform">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-orbitron gradient-text">
                <Truck className="h-5 w-5 text-neon-cyan" />
                Relatório de Entregas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryReportSummaryCard selectedYear={selectedYear} />
            </CardContent>
          </Card>

          <Card className="card-futuristic border-0 hover:scale-105 transition-transform">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-orbitron gradient-text">
                <Truck className="h-5 w-5 text-neon-cyan" />
                Status das Entregas
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <EntregasAtivasStatusDonutChart selectedYear={selectedYear} />
            </CardContent>
          </Card>

          <Card className="card-futuristic border-0 hover:scale-105 transition-transform">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-orbitron gradient-text">
                <Package className="h-5 w-5 text-neon-cyan" />
                Status das Coletas
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <CollectionStatusDonutChart selectedYear={selectedYear} />
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PerformanceChart data={monthlyData} selectedYear={selectedYear} />
          <PerformanceChart data={monthlyData} selectedYear={selectedYear} />
        </div>
      </div>
    </div>
  );
};