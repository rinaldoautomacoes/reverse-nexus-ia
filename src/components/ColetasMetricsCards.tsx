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
type Product = Tables<'products'>;

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

  // Fetch all products for the selected user
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery<Product[], Error>({
    queryKey: ['productsForMetrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id') // Only need id for count
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
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
    if (productsError) {
      toast({
        title: "Erro ao carregar dados dos produtos",
        description: productsError.message,
        variant: "destructive",
      });
    }
  }, [coletasError, productsError, toast]);

  const calculateColetasMetrics = (coletasData: Coleta[] | undefined, productsData: Product[] | undefined) => {
    const totalColetas = coletasData?.length || 0;
    const totalProdutos = productsData?.length || 0;
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
        value: totalProdutos.toString(),
        description: 'Produtos cadastrados na base',
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

  const dashboardMetrics = calculateColetasMetrics(coletas, products);

  if (isLoadingColetas || isLoadingProducts) {
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