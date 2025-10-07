import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ListChecks // Ícone para 'Total de Entregas'
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  ListChecks
};

interface EntregasMetricsCardsProps {
  selectedYear: string;
}

export const EntregasMetricsCards: React.FC<EntregasMetricsCardsProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: entregas, isLoading, error } = useQuery<Array<{status_coleta: string}>, Error>({
    queryKey: ['dashboardEntregasMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas') // Usamos a tabela 'coletas' para representar as entregas
        .select('status_coleta')
        .eq('user_id', user.id)
        .eq('type', 'entrega') // FILTRO CORRIGIDO: Apenas registros do tipo 'entrega'
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
        title: "Erro ao carregar dados das entregas",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const calculateEntregasMetrics = (entregasData: Array<{status_coleta: string}> | undefined) => {
    const totalEntregas = entregasData?.length || 0;
    const pendenteCount = entregasData?.filter(e => e.status_coleta === 'pendente').length || 0;
    const emTransitoCount = entregasData?.filter(e => e.status_coleta === 'agendada').length || 0; // 'agendada' é 'em trânsito' para entregas
    const concluidaCount = entregasData?.filter(e => e.status_coleta === 'concluida').length || 0;

    return [
      {
        id: 'total-entregas',
        title: 'Total de Entregas',
        value: totalEntregas.toString(),
        description: 'Total de entregas registradas',
        icon_name: 'ListChecks',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
      {
        id: 'entregas-pendentes',
        title: 'Entregas Pendentes',
        value: pendenteCount.toString(),
        description: 'Entregas aguardando agendamento ou início', // Alterado aqui
        icon_name: 'Clock',
        color: 'text-destructive', // ai-purple
        bg_color: 'bg-destructive/10', // ai-purple/10
      },
      {
        id: 'entregas-em-transito',
        title: 'Entregas Em Trânsito',
        value: emTransitoCount.toString(),
        description: 'Entregas agendadas e em andamento',
        icon_name: 'Truck',
        color: 'text-warning-yellow', // amarelo
        bg_color: 'bg-warning-yellow/10', // amarelo/10
      },
      {
        id: 'entregas-concluidas',
        title: 'Entregas Concluídas',
        value: concluidaCount.toString(),
        description: 'Entregas finalizadas e processadas',
        icon_name: 'CheckCircle',
        color: 'text-success-green', // neon-cyan
        bg_color: 'bg-success-green/10', // neon-cyan/10
      },
    ];
  };

  const dashboardMetrics = calculateEntregasMetrics(entregas);

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
        const Icon = iconMap[metric.icon_name || ''];
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};