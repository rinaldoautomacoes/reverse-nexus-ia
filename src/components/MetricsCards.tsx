import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Gauge // Ícone para 'Total de Aparelhos'
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Truck,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Gauge
};

// Removido: type Item = Tables<'items'>;

export const MetricsCards = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Removido: useQuery para 'items'
  // const { data: items, isLoading, error } = useQuery<Array<{quantity: number, status: string}>, Error>({
  //   queryKey: ['dashboardItemsMetrics', user?.id],
  //   queryFn: async () => {
  //     if (!user?.id) {
  //       return [];
  //     }
  //     const { data, error } = await supabase
  //       .from('items')
  //       .select('quantity, status')
  //       .eq('user_id', user.id);
      
  //     if (error) {
  //       throw new Error(error.message);
  //     }
  //     return data;
  //   },
  //   enabled: !!user?.id,
  // });

  // Removido: useEffect para erros de itens
  // useEffect(() => {
  //   if (error) {
  //     toast({
  //       title: "Erro ao carregar dados dos itens",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   }
  // }, [error, toast]);

  // Ajustado para retornar métricas padrão ou vazias, já que não há mais itens
  const calculateMetrics = () => {
    // Retorna métricas de placeholder ou vazias, já que a tabela 'items' foi removida
    return [
      {
        id: 'total-aparelhos',
        title: 'Total de Aparelhos',
        value: 'N/A', // Valor padrão
        change: '0%', 
        trend: 'neutral',
        icon_name: 'Gauge',
        color: 'text-ai',
        bg_color: 'bg-ai/10',
        description: 'Dados de itens indisponíveis'
      },
      {
        id: 'pendentes',
        title: 'Pendentes',
        value: 'N/A', // Valor padrão
        change: '0%', 
        trend: 'neutral',
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
        description: 'Dados de itens indisponíveis'
      },
      {
        id: 'em-transito',
        title: 'Em Trânsito',
        value: 'N/A', // Valor padrão
        change: '0%', 
        trend: 'neutral',
        icon_name: 'CheckCircle',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
        description: 'Dados de itens indisponíveis'
      },
      {
        id: 'aparelhos-entregues',
        title: 'Aparelhos Entregues',
        value: 'N/A', // Valor padrão
        change: '0%', 
        trend: 'neutral',
        icon_name: 'CheckCircle',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
        description: 'Dados de itens indisponíveis'
      },
    ];
  };

  const dashboardMetrics = calculateMetrics();

  // O estado de carregamento agora é sempre falso, pois não há consulta de itens
  const isLoading = false; 

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-futuristic border-0 animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded mb-1" />
              <div className="h-4 w-48 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Se não houver métricas (o que não deve acontecer com os placeholders), exibe uma mensagem
  if (!dashboardMetrics || dashboardMetrics.length === 0) {
    return (
      <Card className="card-futuristic border-0">
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhuma métrica encontrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardMetrics.map((metric, index) => {
        const Icon = iconMap[metric.icon_name];
        if (!Icon) {
          console.warn(`Ícone não encontrado para: ${metric.icon_name}`);
          return null;
        }
        return (
          <Card 
            key={metric.id} 
            className="card-futuristic border-0 animate-slide-up" 
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bg_color}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-orbitron gradient-text mb-1">
                {metric.value}
              </div>
              {metric.description && (
                <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
              )}
              <div className="flex items-center text-sm">
                <TrendingUp 
                  className={`h-3 w-3 mr-1 ${
                    metric.trend === 'up' ? 'text-primary' : 'text-destructive'
                  }`} 
                />
                <span className={metric.trend === 'up' ? 'text-primary' : 'text-destructive'}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground ml-1">desde o último mês</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};