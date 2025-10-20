import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Clock, 
  CheckCircle,
  ListChecks, // Icon for 'Total de Coletas'
  Box // Icon for 'Total de Produtos'
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";

type Coleta = Tables<'coletas'>;
type Item = Tables<'items'>;
type Product = Tables<'products'>; // Import Product type

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Clock,
  CheckCircle,
  ListChecks,
  Box
};

interface ColetasMetricsCardsProps {
  selectedYear: string;
}

export const ColetasMetricsCards: React.FC<ColetasMetricsCardsProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all products to get their descriptions (still needed for generateItemDescription)
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery<Product[], Error>({
    queryKey: ['allProducts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('code, description')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const productDescriptionsMap = new Map<string, string>();
  products?.forEach(p => {
    if (p.code && p.description) {
      productDescriptionsMap.set(p.code, p.description);
    }
  });

  // Fetch all coletas for the selected year and type 'coleta'
  const { data: coletas, isLoading: isLoadingColetas, error: coletasError } = useQuery<Coleta[], Error>({
    queryKey: ['coletasForMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select('id, status_coleta') // Only need id and status_coleta for counts
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

  // Fetch items associated with the fetched coletas (kept for potential future use or other metrics)
  const collectionIds = coletas?.map(c => c.id) || [];
  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['itemsForColetasMetrics', user?.id, collectionIds],
    queryFn: async () => {
      if (!user?.id || collectionIds.length === 0) return [];
      const { data, error } = await supabase
        .from('items')
        .select('quantity, collection_id, name') // Added name (product code)
        .eq('user_id', user.id)
        .in('collection_id', collectionIds);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id && collectionIds.length > 0,
  });

  // NEW: Fetch all items for the selected year, regardless of collection type
  const { data: allUserItems, isLoading: isLoadingAllItems, error: allItemsError } = useQuery<Item[], Error>({
    queryKey: ['allItemsForColetasMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01T00:00:00Z`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01T00:00:00Z`;

      const { data, error } = await supabase
        .from('items')
        .select('quantity, name') // Select quantity and name (product code)
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lt('created_at', endDate);
      
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user?.id,
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
    if (productsError) {
      toast({
        title: "Erro ao carregar descrições de produtos",
        description: productsError.message,
        variant: "destructive",
      });
    }
    if (allItemsError) {
      toast({
        title: "Erro ao carregar dados de todos os itens",
        description: allItemsError.message,
        variant: "destructive",
      });
    }
  }, [coletasError, itemsError, productsError, allItemsError, toast]);

  // Helper function to generate item descriptions for tooltips/cards
  const generateItemDescription = (itemCodeQuantities: Map<string, number>) => {
    const descriptions: string[] = [];
    itemCodeQuantities.forEach((quantity, code) => {
      const description = productDescriptionsMap.get(code);
      if (description) {
        descriptions.push(`${quantity}x ${description}`);
      } else {
        descriptions.push(`${quantity}x Item Desconhecido`);
      }
    });

    if (descriptions.length === 0) return "Nenhum item";
    if (descriptions.length === 1) return descriptions[0];
    if (descriptions.length === 2) return `${descriptions[0]} e ${descriptions[1]}`;
    return `${descriptions[0]}, ${descriptions[1]} e outros`;
  };

  const calculateColetasMetrics = (coletasData: Coleta[] | undefined, itemsData: Item[] | undefined, allItemsData: Item[] | undefined) => {
    const totalColetas = coletasData?.length || 0;
    
    // Calculate total quantity of all items associated with 'coleta' type
    const totalProductQuantity = allItemsData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    const pendenteColetas = coletasData?.filter(c => c.status_coleta === 'pendente').length || 0;
    const concluidaColetas = coletasData?.filter(c => c.status_coleta === 'concluida').length || 0;

    return [
      {
        id: 'total-coletas',
        title: 'Total Geral de Coletas',
        value: totalColetas.toString(),
        description: 'Coletas registradas no ano',
        icon_name: 'ListChecks',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
      {
        id: 'total-produtos',
        title: 'Total Geral de Produtos',
        value: totalProductQuantity.toString(), // Use the sum of quantities
        description: 'Itens cadastrados na base', // Updated description
        icon_name: 'Box',
        color: 'text-neural',
        bg_color: 'bg-neural/10',
      },
      {
        id: 'coletas-pendentes',
        title: 'Coletas Pendentes',
        value: pendenteColetas.toString(),
        description: 'Aguardando agendamento ou início',
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
      },
      {
        id: 'coletas-concluidas',
        title: 'Coletas Concluídas',
        value: concluidaColetas.toString(),
        description: 'Coletas finalizadas e processadas',
        icon_name: 'CheckCircle',
        color: 'text-success-green',
        bg_color: 'bg-success-green/10',
      },
    ];
  };

  const dashboardMetrics = calculateColetasMetrics(coletas, items, allUserItems); // Pass allUserItems to the calculation function

  if (isLoadingColetas || isLoadingItems || isLoadingProducts || isLoadingAllItems) {
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