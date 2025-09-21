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

interface MetricsCardsProps {
  selectedYear: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: coletas, isLoading, error } = useQuery<Array<{status_coleta: string}>, Error>({
    queryKey: ['dashboardColetasMetrics', user?.id, selectedYear], // Alterado queryKey para incluir selectedYear
    queryFn: async () => {
      if (!user?.id) {
        // Se não houver usuário logado, retornar um array vazio
        return [];
      }

      const startDate = `${selectedYear}-01-01T00:00:00Z`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01T00:00:00Z`;

      const { data, error } = await supabase
        .from('coletas') // Buscar da tabela 'coletas'
        .select('status_coleta') // Selecionar apenas o status da coleta
        .eq('user_id', user.id)
        .gte('created_at', startDate) // Filtrar por created_at dentro do ano selecionado
        .lt('created_at', endDate);
      
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
        description: 'Total de coletas registradas'
      },
      {
        id: 'coletas-pendentes',
        title: 'Coletas Pendentes',
        value: pendenteCount.toString(),
        description: 'Aguardando agendamento ou início',
        icon_name: 'Clock',
        color: 'text-destructive', // ai-purple
        bg_color: 'bg-destructive/10', // ai-purple/10
      },
      {
        id: 'coletas-em-transito',
        title: 'Coletas Em Trânsito',
        value: agendadaCount.toString(),
        description: 'Coletas agendadas e em andamento',
        icon_name: 'Truck',
        color: 'text-warning-yellow', // amarelo
        bg_color: 'bg-warning-yellow/10', // amarelo/10
      },
      {
        id: 'coletas-entregues',
        title: 'Coletas Entregues',
        value: concluidaCount.toString(),
        description: 'Coletas finalizadas e processadas',
        icon_name: 'CheckCircle',
        color: 'text-success-green', // neon-cyan
        bg_color: 'bg-success-green/10', // neon-cyan/10
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
          Nenhuma métrica de coleta encontrada para o ano de {selectedYear}. Agende coletas para ver os dados.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardMetrics.map((metric, index) => {
        // Para o card "Total de Coletas", o ícone e as cores são fixos
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