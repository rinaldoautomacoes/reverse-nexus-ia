import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import heroBackground from "@/assets/hero-ai-logistics-dashboard.png";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { GeneralMetricsCards } from '@/components/dashboard-general/GeneralMetricsCards';
import { GeneralStatusChart } from '@/components/dashboard-general/GeneralStatusChart';
import { GeneralStatusDonutCharts } from '@/components/dashboard-general/GeneralStatusDonutCharts';
import { GeneralDeliveriesStatusChart } from '@/components/dashboard-general/GeneralDeliveriesStatusChart'; // Importar o novo componente
import { MetricDetailsDialog } from '@/components/dashboard-general/MetricDetailsDialog'; // Importar o novo diálogo

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Updated to include items
type Product = Tables<'products'>;

interface GeneralDashboardProps {
  selectedYear: string;
}

export const GeneralDashboard: React.FC<GeneralDashboardProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch all coletas (both 'coleta' and 'entrega' types) for the selected year
  const { data: allColetas, isLoading: isLoadingAllColetas, error: allColetasError } = useQuery({
    queryKey: ['allColetasForGeneralDashboard', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select(`
          *,
          items(*)
        `)
        .eq('user_id', user.id)
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate);
      
      if (error) {
        throw new Error(error.message);
      }
      return data as Coleta[];
    },
    enabled: !!user?.id,
  });

  // Fetch all products to get their descriptions (needed for charts)
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['allProductsForGeneralDashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('code, description')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const productDescriptionsMap = new Map<string, string>();
  products?.forEach(p => {
    if (p.code && p.description) {
      productDescriptionsMap.set(p.code, p.description);
    }
  });

  if (isLoadingAllColetas || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando dashboard geral...</p>
        </div>
      </div>
    );
  }

  if (allColetasError || productsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar dados do dashboard: {allColetasError?.message || productsError?.message}</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-5xl lg:text-7xl font-bold font-orbitron gradient-text mb-4 animate-slide-up">
              Dashboard Geral
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              Visão unificada e métricas em tempo real de todas as operações
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 lg:px-8 py-8 space-y-8">
        {/* Metrics Cards */}
        <GeneralMetricsCards allColetas={allColetas || []} selectedYear={selectedYear} outstandingItems={[]} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <GeneralStatusChart 
              allColetas={allColetas || []} 
              productDescriptionsMap={productDescriptionsMap} 
              selectedYear={selectedYear} 
            />
            <GeneralDeliveriesStatusChart // Novo gráfico de entregas
              allColetas={allColetas || []} 
              productDescriptionsMap={productDescriptionsMap} 
              selectedYear={selectedYear} 
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <GeneralStatusDonutCharts allColetas={allColetas || []} selectedYear={selectedYear} />
          </div>
        </div>
      </div>
    </div>
  );
};