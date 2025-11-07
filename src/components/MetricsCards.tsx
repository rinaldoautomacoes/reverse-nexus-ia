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
import { useAuth } from "@/hooks/useAuth";
import { getTotalQuantityOfItems } from "@/lib/utils"; // Import new util

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Truck,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Gauge,
  ListChecks
};

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type

interface MetricsCardsProps {
  selectedYear: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: coletas, isLoading, error } = useQuery<Coleta[], Error>({
    queryKey: ['dashboardColetasMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select(`status_coleta, items(quantity)`) // Select items(quantity)
        .eq('user_id', user.id)
        .eq('type', 'coleta')
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate);
      
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user?.id,
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

  const calculateCollectionMetrics = (coletasData: Coleta[] | undefined) => {
    const totalColetas = coletasData?.length || 0;
    const pendenteCount = coletasData?.filter(c => c.status_coleta === 'pendente').length || 0;
    const agendadaCount = coletasData?.filter(c => c.status_coleta === 'agendada').length || 0;
    const concluidaCount = coletasData?.filter(c => c.status_coleta === 'concluida').length || 0;

    return [
      {
        id: 'total-coletas',
        title: 'Total de Coletas',
        value: totalColetas.toString(),
        description: 'Total de coletas registradas'
      },
      {
        id: 'coletas-pendentes',
        title: 'Coletas Pendentes',
        value: pendenteCount.toString(),
        description: 'Aguardando agendamento ou início',
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
      },
      {
        id: 'coletas-em-transito',
        title: 'Coletas Em Trânsito',
        value: agendadaCount.toString(),
        description: 'Coletas agendadas e em andamento',
        icon_name: 'Truck',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
      },
      {
        id: 'coletas-entregues',
        title: 'Coletas Entregues',
        value: concluidaCount.toString(),
        description: 'Coletas finalizadas e processadas',
        icon_name: 'CheckCircle',
        color: 'text-success-green',
        bg_color: 'bg-success-green/10',
      },
    ];
  };

  const dashboardMetrics = calculateCollectionMetrics(coletas);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardMetrics.map((metric, index) => {
        const isTotalColetasCard = metric.id === 'total-coletas';
        const Icon = isTotalColetasCard ? ListChecks : iconMap[metric.icon_name || ''];
        const iconColorClass = isTotalColetasCard ? 'text-primary' : metric.color;
        const iconBgColorClass = isTotalColetasCard ? 'bg-primary/10' : metric.bg_color;

        if (!Icon) {
          console.warn(`Ícone não encontrado para: ${metric.icon_name}`);
          return null;
        }
        return (
          <Card 
            key={metric.id} 
            className="card-futuristic border-0 animate-slide-up transition-all duration-300 ease-in-out" 
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${iconBgColorClass}`}>
                <Icon className={`h-4 w-4 ${iconColorClass}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-orbitron gradient-text mb-1">
                {metric.value}
              </div>
              {metric.description && (
                <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};