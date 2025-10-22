import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  Clock, 
  CheckCircle,
  ListChecks, // Ícone para 'Total de Entregas'
  Box // Ícone para 'Total de Produtos'
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types"; // Import Tables type

type Coleta = Tables<'coletas'>;
type Product = Tables<'products'>; // Import Product type

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Truck,
  Clock,
  CheckCircle,
  ListChecks,
  Box
};

interface EntregasMetricsCardsProps {
  selectedYear: string;
}

export const EntregasMetricsCards: React.FC<EntregasMetricsCardsProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all products to get their descriptions (still needed for generateItemDescription in other components)
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

  // Fetch all deliveries for the selected year and type 'entrega'
  const { data: entregas, isLoading: isLoadingEntregas, error: entregasError } = useQuery<Coleta[], Error>({
    queryKey: ['entregasForMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select('id, status_coleta, qtd_aparelhos_solicitado') // Select quantity now
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

  useEffect(() => {
    if (entregasError) {
      toast({
        title: "Erro ao carregar dados das entregas",
        description: entregasError.message,
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
  }, [entregasError, productsError, toast]);

  const calculateEntregasMetrics = (entregasData: Coleta[] | undefined) => {
    const totalEntregas = entregasData?.length || 0;
    const totalAllProducts = entregasData?.reduce((sum, entrega) => sum + (entrega.qtd_aparelhos_solicitado || 0), 0) || 0;
    const pendenteEntregas = entregasData?.filter(e => e.status_coleta === 'pendente').length || 0;
    const emTransitoEntregas = entregasData?.filter(e => e.status_coleta === 'agendada').length || 0; // Adicionado para 'Em Trânsito'
    const concluidaEntregas = entregasData?.filter(e => e.status_coleta === 'concluida').length || 0;

    return [
      {
        id: 'total-entregas-geral',
        title: 'Total Geral de Entregas',
        value: totalEntregas.toString(),
        description: 'Entregas registradas no ano',
        icon_name: 'ListChecks',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
      {
        id: 'total-produtos-geral',
        title: 'Total Geral de Produtos',
        value: totalAllProducts.toString(),
        description: 'Itens entregues e processados',
        icon_name: 'Box',
        color: 'text-neural',
        bg_color: 'bg-neural/10',
      },
      {
        id: 'entregas-pendentes',
        title: 'Entregas Pendentes',
        value: pendenteEntregas.toString(),
        description: 'Aguardando agendamento ou início',
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
      },
      {
        id: 'entregas-em-transito', // Novo card para 'Em Trânsito'
        title: 'Entregas Em Trânsito',
        value: emTransitoEntregas.toString(),
        description: 'Entregas agendadas e em andamento',
        icon_name: 'Truck',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
      },
      {
        id: 'entregas-concluidas',
        title: 'Entregas Concluídas',
        value: concluidaEntregas.toString(),
        description: 'Entregas finalizadas e processadas',
        icon_name: 'CheckCircle',
        color: 'text-success-green',
        bg_color: 'bg-success-green/10',
      },
    ];
  };

  const dashboardMetrics = calculateEntregasMetrics(entregas);

  if (isLoadingEntregas || isLoadingProducts) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"> {/* Ajustado para 5 colunas */}
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