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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CollectionStatusDonutChart } from "@/components/CollectionStatusDonutChart";
import { useQuery } from "@tanstack/react-query";
import { ColetasMetricsCards } from "@/components/ColetasMetricsCards"; // Import the new metrics cards
import { ColetasStatusChart } from "@/components/ColetasStatusChart"; // Import the new status chart

interface IndexProps {
  selectedYear: string;
}

const Index: React.FC<IndexProps> = ({ selectedYear }) => {
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
              Dashboard Coletas
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              Visão geral e métricas em tempo real das suas coletas
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 lg:px-8 py-8 space-y-8">
        {/* Metrics Cards */}
        <ColetasMetricsCards selectedYear={selectedYear} /> {/* Using the new component */}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <ColetasStatusChart selectedYear={selectedYear} /> {/* Using the new status chart */}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <CollectionStatusDonutChart selectedYear={selectedYear} /> {/* Keeping the existing donut chart */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;