import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Gauge, // Ícone para 'Total de Aparelhos'
  ListChecks // Novo ícone para 'Total de Coletas'
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
  Gauge,
  ListChecks // Adicionado ListChecks
};

type Coleta = Tables<'coletas'>; // Alterado para Coleta

export const MetricsCards = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: coletas, isLoading, error } = useQuery<Array<{status_coleta: string}>, Error>({
    queryKey: ['dashboardColetasMetrics', user?.id], // Alterado queryKey
    queryFn: async () => {
      if (!user?.id) {
        // Se não houver usuário logado, retornar um array vazio
        return [];
      }
      const { data, error } = await supabase
        .from('coletas') // Buscar da tabela 'coletas'
        .select('status_coleta') // Selecionar apenas o status da coleta
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user?.id, // A query só será executada se houver um user.id
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados das coletas",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const calculateCollectionMetrics = (coletasData: Array<{status_coleta: string}> | undefined) => {
    if (!coletasData || coletasData.length === 0) {
      return [];
    }

    const totalColetas = coletasData.length;
    const pendenteCount = coletasData.filter(c => c.status_coleta === 'pendente').length;
    const agendadaCount = coletasData.filter(c => c.status_coleta === 'agendada').length; // Mapeado para 'Em Trânsito'
    const concluidaCount = coletasData.filter(c => c.status_coleta === 'concluida').length; // Mapeado para 'Entregues'

    return [
      {
        id: 'total-coletas',
        title: 'Total de Coletas',
        value: totalColetas.toString(),
        change: '+12%', // Placeholder
        trend: 'up',
        icon_name: 'ListChecks', // Ícone para total de coletas
        color: 'text-ai',
        bg_color: 'bg-ai/10',
        description: 'Total de coletas registradas'
      },
      {
        id: 'coletas-pendentes',
        title: 'Coletas Pendentes',
        value: pendenteCount.toString(),
        change: '-5%', // Placeholder
        trend: 'down',
        icon_name: 'Clock',
        color: 'text-destructive', // Alterado para destructive
        bg_color: 'bg-destructive/10', // Alterado para destructive/10
        description: 'Aguardando agendamento ou início'
      },
      {
        id: 'coletas-em-transito',
        title: 'Coletas Em Trânsito',
        value: agendadaCount.toString(),
        change: '+8%', // Placeholder
        trend: 'up',
        icon_name: 'Truck', // Ícone para 'Em Trânsito'
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
        description: 'Coletas agendadas e em andamento'
      },
      {
        id: 'coletas-entregues',
        title: 'Coletas Entregues',
        value: concluidaCount.toString(),
        change: '+15%', // Placeholder
        trend: 'up',
        icon_name: 'CheckCircle',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
        description: 'Coletas finalizadas e processadas'
      },
    ];
  };

  const dashboardMetrics = calculateCollectionMetrics(coletas); // Usar a nova função de cálculo

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

  if (!dashboardMetrics || dashboardMetrics.length === 0) {
    return (
      <Card className="card-futuristic border-0">
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhuma métrica de coleta encontrada. Agende coletas para ver os dados.
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