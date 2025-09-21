import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, Clock, Truck, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Item = Tables<'items'>;
type Coleta = Tables<'coletas'>; // Importar o tipo Coleta

// Definir um tipo para o item com o status da coleta aninhado
type ItemWithColetaStatus = Item & {
  coletas: Pick<Coleta, 'status_coleta'> | null;
};

export const ProductStatusChart = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: items, isLoading, error } = useQuery<ItemWithColetaStatus[], Error>({
    queryKey: ['productStatusChart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('items')
        .select(`
          created_at,
          quantity,
          status,
          collection_id,
          coletas (status_coleta)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data as ItemWithColetaStatus[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados dos produtos",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const processItemsData = (itemsData: ItemWithColetaStatus[] | undefined) => {
    if (!itemsData || itemsData.length === 0) {
      return { chartData: [], totalItems: 0, totalPendente: 0, totalEmTransito: 0, totalEntregues: 0 };
    }

    const monthlyDataMap = new Map<string, { pendente: number; em_transito: number; entregues: number }>();
    const allMonths: string[] = [];

    // Get the last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = startOfMonth(new Date(today.getFullYear(), today.getMonth() - i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { pendente: 0, em_transito: 0, entregues: 0 });
    }

    let totalPendente = 0;
    let totalEmTransito = 0;
    let totalEntregues = 0;

    itemsData.forEach(item => {
      const itemDate = parseISO(item.created_at);
      const itemMonthKey = format(startOfMonth(itemDate), 'MMM', { locale: ptBR });

      let effectiveStatus: 'pendente' | 'em_transito' | 'entregues' = 'pendente'; // Default

      // Prioriza o status da coleta se o item estiver associado a uma coleta
      if (item.collection_id && item.coletas?.status_coleta) {
        switch (item.coletas.status_coleta) {
          case 'pendente':
            effectiveStatus = 'pendente';
            break;
          case 'agendada': // Coleta 'agendada' significa produto 'em_transito'
            effectiveStatus = 'em_transito';
            break;
          case 'concluida': // Coleta 'concluida' significa produto 'entregues'
            effectiveStatus = 'entregues';
            break;
          default:
            effectiveStatus = 'pendente'; // Fallback
        }
      } else {
        // Se não houver coleta associada ou status da coleta, usa o status do próprio item
        switch (item.status) {
          case 'pendente':
            effectiveStatus = 'pendente';
            break;
          case 'agendada': // Status 'agendada' do item também significa 'em_transito'
            effectiveStatus = 'em_transito';
            break;
          case 'processado': // Status 'processado' do item significa 'entregues'
            effectiveStatus = 'entregues';
            break;
          default:
            effectiveStatus = 'pendente'; // Fallback
        }
      }

      if (monthlyDataMap.has(itemMonthKey)) {
        const currentMonthData = monthlyDataMap.get(itemMonthKey)!;
        if (effectiveStatus === 'pendente') {
          currentMonthData.pendente += item.quantity;
          totalPendente += item.quantity;
        } else if (effectiveStatus === 'em_transito') {
          currentMonthData.em_transito += item.quantity;
          totalEmTransito += item.quantity;
        } else if (effectiveStatus === 'entregues') {
          currentMonthData.entregues += item.quantity;
          totalEntregues += item.quantity;
        }
        monthlyDataMap.set(itemMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { pendente: 0, em_transito: 0, entregues: 0 };
      return {
        month: monthKey,
        pendente: data.pendente,
        em_transito: data.em_transito,
        entregues: data.entregues,
        total_month: data.pendente + data.em_transito + data.entregues,
      };
    });

    const totalItems = totalPendente + totalEmTransito + totalEntregues;

    return { chartData, totalItems, totalPendente, totalEmTransito, totalEntregues };
  };

  const { chartData, totalItems, totalPendente, totalEmTransito, totalEntregues } = processItemsData(items);

  const maxTotalItemsPerMonth = Math.max(...chartData.map(d => d.total_month));

  // Cores para os status dos produtos
  const BAR_COLORS = {
    pendente: 'hsl(var(--neural-blue))',
    em_transito: 'hsl(var(--warning-yellow))',
    entregues: 'hsl(var(--primary))',
  };

  // Calcular a porcentagem de entregues em relação ao total
  const percentageEntregues = totalItems > 0 ? ((totalEntregues / totalItems) * 100).toFixed(1) : '0.0';
  // Placeholder para variação, pode ser calculado com dados históricos se disponível
  const changePercentage = '+10%'; 

  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-orbitron gradient-text">
              Status dos Produtos
            </CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              {changePercentage}
            </Badge>
            <Badge variant="secondary" className="bg-neural/20 text-neural">
              {percentageEntregues}% Entregues
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart Visualization */}
          <div className="h-64 relative">
            <div className="absolute inset-0 bg-gradient-dark rounded-lg border border-border/50 p-4">
              {/* Chart Grid */}
              <div className="h-full relative">
                {/* Grid Lines */}
                <div className="absolute inset-0">
                  {[0, 25, 50, 75, 100].map((percentage) => (
                    <div 
                      key={percentage}
                      className="absolute w-full border-t border-border/20"
                      style={{ top: `${100 - percentage}%` }}
                    />
                  ))}
                </div>
                
                {/* Chart Bars */}
                <div className="h-full flex items-end justify-between gap-2 relative z-10">
                  {chartData.map((data, index) => {
                    const totalMonthHeight = maxTotalItemsPerMonth > 0 ? (data.total_month / maxTotalItemsPerMonth) * 100 : 0;
                    
                    // Calculate heights for stacked segments
                    const entreguesHeight = data.total_month > 0 ? (data.entregues / data.total_month) * totalMonthHeight : 0;
                    const emTransitoHeight = data.total_month > 0 ? (data.em_transito / data.total_month) * totalMonthHeight : 0;
                    const pendenteHeight = data.total_month > 0 ? (data.pendente / data.total_month) * totalMonthHeight : 0;
                    
                    return (
                      <div key={data.month} className="flex-1 flex flex-col items-center">
                        {/* Bar Container */}
                        <div className="relative w-full mb-2" style={{ height: '180px' }}>
                          {/* Entregues Bar (top) */}
                          {data.entregues > 0 && (
                            <div 
                              className="absolute bottom-0 w-full rounded-t-md animate-slide-up"
                              style={{ 
                                height: `${entreguesHeight}%`,
                                backgroundColor: BAR_COLORS.entregues,
                                animationDelay: `${index * 200 + 200}ms`
                              }}
                            />
                          )}
                          {/* Em Trânsito Bar (middle) */}
                          {data.em_transito > 0 && (
                            <div 
                              className="absolute w-full rounded-t-md animate-slide-up"
                              style={{ 
                                height: `${emTransitoHeight}%`,
                                bottom: `${entreguesHeight}%`, // Stack on top of entregues
                                backgroundColor: BAR_COLORS.em_transito,
                                animationDelay: `${index * 200 + 100}ms`
                              }}
                            />
                          )}
                          {/* Pendente Bar (bottom) */}
                          {data.pendente > 0 && (
                            <div 
                              className="absolute w-full rounded-t-md animate-slide-up"
                              style={{ 
                                height: `${pendenteHeight}%`,
                                bottom: `${entreguesHeight + emTransitoHeight}%`, // Stack on top of em_transito
                                backgroundColor: BAR_COLORS.pendente,
                                animationDelay: `${index * 200}ms`
                              }}
                            />
                          )}
                          
                          {/* Total Items Indicator */}
                          {data.total_month > 0 && (
                            <div 
                              className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs"
                              style={{ animationDelay: `${index * 200 + 300}ms` }}
                            >
                              <span className="text-foreground font-medium">
                                {data.total_month}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Month Label */}
                        <span className="text-xs text-muted-foreground font-medium">
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Legend and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: BAR_COLORS.pendente }} />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-xs text-muted-foreground">{totalPendente} itens aguardando</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: BAR_COLORS.em_transito }} />
              <div>
                <p className="text-sm font-medium">Em Trânsito</p>
                <p className="text-xs text-muted-foreground">{totalEmTransito} itens a caminho</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: BAR_COLORS.entregues }} />
              <div>
                <p className="text-sm font-medium">Entregues</p>
                <p className="text-xs text-muted-foreground">{totalEntregues} itens finalizados</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-gradient-primary rounded" />
              <div>
                <p className="text-sm font-medium">Total Geral</p>
                <p className="text-xs text-muted-foreground">{totalItems} itens no total</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};