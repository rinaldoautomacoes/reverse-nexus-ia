import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, // Changed from Truck to Package for collections
  Clock, 
  CheckCircle,
  AlertTriangle,
  ListChecks // Icon for 'Total de Coletas'
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
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  ListChecks
};

interface ColetasMetricsCardsProps {
  selectedYear: string;
}

export const ColetasMetricsCards: React.FC<ColetasMetricsCardsProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch coletas for the selected year and type 'coleta'
  const { data: coletas, isLoading: isLoadingColetas, error: coletasError } = useQuery<Coleta[], Error>({
    queryKey: ['coletasForMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select('id, status_coleta') // Only need id and status_coleta
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

  // Fetch items associated with the fetched coletas
  const collectionIds = coletas?.map(c => c.id) || [];
  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['itemsForColetasMetrics', user?.id, collectionIds],
    queryFn: async () => {
      if (!user?.id || collectionIds.length === 0) return [];
      const { data, error } = await supabase
        .from('items')
        .select('quantity, collection_id, model, name') // Added model and name
        .eq('user_id', user.id)
        .in('collection_id', collectionIds);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id && collectionIds.length > 0,
  });

  useEffect(() => {
    if (coletasError) {
      toast({
        title: "Erro ao carregar dados das coletas",
        description: coletasError.message,
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
  }, [coletasError, itemsError, toast]);

  const generateItemDescription = (itemModelsMap: Map<string, number>) => {
    const models = Array.from(itemModelsMap.keys());
    if (models.length === 0) return "Nenhum item";
    if (models.length === 1) return models[0];
    if (models.length === 2) return `${models[0]} e ${models[1]}`;
    return `${models[0]}, ${models[1]} e outros`; // For more than 2 types
  };

  const calculateColetasMetrics = (coletasData: Coleta[] | undefined, itemsData: Item[] | undefined) => {
    const coletasMap = new Map(coletasData?.map(c => [c.id, c.status_coleta]));

    let totalItemsCount = 0;
    const pendenteItems: Map<string, number> = new Map();
    const emTransitoItems: Map<string, number> = new Map();
    const concluidaItems: Map<string, number> = new Map();

    itemsData?.forEach(item => {
      const collectionStatus = item.collection_id ? coletasMap.get(item.collection_id) : undefined;
      const quantity = item.quantity || 0;
      const itemType = item.model || item.name || 'Item Desconhecido';

      totalItemsCount += quantity;

      switch (collectionStatus) {
        case 'pendente':
          pendenteItems.set(itemType, (pendenteItems.get(itemType) || 0) + quantity);
          break;
        case 'agendada': // 'agendada' is 'em trânsito' for coletas
          emTransitoItems.set(itemType, (emTransitoItems.get(itemType) || 0) + quantity);
          break;
        case 'concluida':
          concluidaItems.set(itemType, (concluidaItems.get(itemType) || 0) + quantity);
          break;
      }
    });

    const totalPendenteCount = Array.from(pendenteItems.values()).reduce((sum, q) => sum + q, 0);
    const totalEmTransitoCount = Array.from(emTransitoItems.values()).reduce((sum, q) => sum + q, 0);
    const totalConcluidaCount = Array.from(concluidaItems.values()).reduce((sum, q) => sum + q, 0);

    return [
      {
        id: 'total-items',
        title: 'Total de Itens',
        value: totalItemsCount.toString(),
        description: generateItemDescription(new Map([...pendenteItems, ...emTransitoItems, ...concluidaItems])),
        icon_name: 'ListChecks',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
      {
        id: 'items-pendentes',
        title: 'Itens Pendentes',
        value: totalPendenteCount.toString(),
        description: generateItemDescription(pendenteItems),
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
      },
      {
        id: 'items-em-transito',
        title: 'Itens Em Trânsito',
        value: totalEmTransitoCount.toString(),
        description: generateItemDescription(emTransitoItems),
        icon_name: 'Package',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
      },
      {
        id: 'items-concluidos',
        title: 'Itens Concluídos',
        value: totalConcluidaCount.toString(),
        description: generateItemDescription(concluidaItems),
        icon_name: 'CheckCircle',
        color: 'text-success-green',
        bg_color: 'bg-success-green/10',
      },
    ];
  };

  const dashboardMetrics = calculateColetasMetrics(coletas, items);

  if (isLoadingColetas || isLoadingItems) {
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