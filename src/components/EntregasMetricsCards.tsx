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
import type { Tables } from "@/integrations/supabase/types"; // Import Tables type

type Coleta = Tables<'coletas'>;
type Item = Tables<'items'>;

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

  // Fetch coletas for the selected year and type 'entrega'
  const { data: entregas, isLoading: isLoadingEntregas, error: entregasError } = useQuery<Coleta[], Error>({
    queryKey: ['entregasForMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select('id, status_coleta') // Only need id and status_coleta
        .eq('user_id', user.id)
        .eq('type', 'entrega')
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate);
      
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch items associated with the fetched entregas
  const collectionIds = entregas?.map(c => c.id) || [];
  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['itemsForEntregasMetrics', user?.id, collectionIds],
    queryFn: async () => {
      if (!user?.id || collectionIds.length === 0) return [];
      const { data, error } = await supabase
        .from('items')
        .select('quantity, collection_id') // Only need quantity and collection_id
        .eq('user_id', user.id)
        .in('collection_id', collectionIds);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id && collectionIds.length > 0,
  });

  useEffect(() => {
    if (entregasError) {
      toast({
        title: "Erro ao carregar dados das entregas",
        description: entregasError.message,
        variant: "destructive",
      });
    }
    if (itemsError) {
      toast({
        title: "Erro ao carregar dados dos itens",
        description: itemsError.message,
        variant: "destructive",
      });
    }
  }, [entregasError, itemsError, toast]);

  const calculateEntregasMetrics = (entregasData: Coleta[] | undefined, itemsData: Item[] | undefined) => {
    const entregasMap = new Map(entregasData?.map(e => [e.id, e.status_coleta]));

    let totalItemsCount = 0;
    let pendenteItemsCount = 0;
    let emTransitoItemsCount = 0;
    let concluidaItemsCount = 0;

    itemsData?.forEach(item => {
      const collectionStatus = item.collection_id ? entregasMap.get(item.collection_id) : undefined;
      const quantity = item.quantity || 0;

      totalItemsCount += quantity;

      switch (collectionStatus) {
        case 'pendente':
          pendenteItemsCount += quantity;
          break;
        case 'agendada': // 'agendada' is 'em trânsito' for entregas
          emTransitoItemsCount += quantity;
          break;
        case 'concluida':
          concluidaItemsCount += quantity;
          break;
      }
    });

    return [
      {
        id: 'total-items',
        title: 'Total de Itens',
        value: totalItemsCount.toString(),
        description: 'Total de itens registrados para entrega',
        icon_name: 'ListChecks',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
      {
        id: 'items-pendentes',
        title: 'Itens Pendentes',
        value: pendenteItemsCount.toString(),
        description: 'Itens aguardando agendamento ou início',
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
      },
      {
        id: 'items-em-transito',
        title: 'Itens Em Trânsito',
        value: emTransitoItemsCount.toString(),
        description: 'Itens agendados e em andamento',
        icon_name: 'Truck',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
      },
      {
        id: 'items-concluidos',
        title: 'Itens Concluídos',
        value: concluidaItemsCount.toString(),
        description: 'Itens entregues e processados',
        icon_name: 'CheckCircle',
        color: 'text-success-green',
        bg_color: 'bg-success-green/10',
      },
    ];
  };

  const dashboardMetrics = calculateEntregasMetrics(entregas, items);

  if (isLoadingEntregas || isLoadingItems) {
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