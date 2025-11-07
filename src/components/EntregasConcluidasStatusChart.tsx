import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Truck, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, startOfMonth, isValid } from "date-fns"; // Importar isValid
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  // Legend, // Removido
} from 'recharts';
import type { Tables } from "@/integrations/supabase/types";
import { getTotalQuantityOfItems } from "@/lib/utils"; // Import new util

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type
type Product = Tables<'products'>;

interface EntregasConcluidasStatusChartProps {
  selectedYear: string;
}

export const EntregasConcluidasStatusChart: React.FC<EntregasConcluidasStatusChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // NEW: Fetch all products to get their descriptions
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

  const { data: entregas, isLoading: isLoadingEntregas, error: entregasError } = useQuery<Coleta[], Error>({
    queryKey: ['entregasConcluidasStatusChart', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select(`
          created_at,
          status_coleta,
          previsao_coleta,
          items(name, quantity, description)
        `) // Select items directly
        .eq('user_id', user.id)
        .eq('type', 'entrega')
        .eq('status_coleta', 'concluida')
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
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

  // Helper function to generate item descriptions for tooltips/cards
  const generateItemDescription = (items: Array<Tables<'items'>> | null) => {
    if (!items || items.length === 0) return "Nenhum item";
    const descriptions: string[] = [];
    items.forEach(item => {
      descriptions.push(`${item.quantity}x ${item.name}`);
    });
    if (descriptions.length === 1) return descriptions[0];
    if (descriptions.length === 2) return `${descriptions[0]} e ${descriptions[1]}`;
    return `${descriptions[0]}, ${descriptions[1]} e outros`;
  };

  const processEntregasData = (entregasData: Coleta[] | undefined) => {
    const monthlyDataMap = new Map<string, { 
      entregues: Tables<'items'>[]; 
      total_all: number 
    }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { entregues: [], total_all: 0 });
    }

    let totalEntreguesCount = 0;
    let totalAll = 0;

    entregasData?.forEach(entrega => {
      if (!entrega.previsao_coleta || !entrega.items) return;

      const entregaDate = parseISO(entrega.previsao_coleta);

      const timezoneOffsetMinutes = entregaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(entregaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);

      const entregaMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const totalItemsInEntrega = getTotalQuantityOfItems(entrega.items);

      if (monthlyDataMap.has(entregaMonthKey)) {
        const currentMonthData = monthlyDataMap.get(entregaMonthKey)!;
        currentMonthData.entregues.push(...entrega.items);
        totalEntreguesCount += totalItemsInEntrega;
        
        currentMonthData.total_all += totalItemsInEntrega;
        totalAll += totalItemsInEntrega;
        monthlyDataMap.set(entregaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { entregues: [], total_all: 0 };
      return {
        month: monthKey,
        entregues: getTotalQuantityOfItems(data.entregues),
        total_all: data.total_all,
        entreguesItems: data.entregues,
      };
    });

    return { 
      chartData, 
      totalEntreguesCount, 
      totalAll
    };
  };

  const { 
    chartData = [], // Default to empty array
    totalEntreguesCount = 0, 
    totalAll = 0 
  } = processEntregasData(entregas);

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.month === label);
      if (!data) return null;

      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Itens: <span className="font-bold text-foreground">{data.total_all}</span></p>
          {data.entreguesItems.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-success-green">Concluídas:</p>
              <ul className="list-disc list-inside ml-2">
                {data.entreguesItems.map((item, idx) => (
                  <li key={idx} className="text-muted-foreground text-xs">
                    {item.quantity}x {item.name} ({item.description || 'N/A'})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoadingEntregas || isLoadingProducts) {
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
              Status das Entregas Concluídas
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              100% Entregues
            </Badge>
            <Badge variant="secondary" className="bg-neural/20 text-neural">
              {totalEntreguesCount} Entregas Concluídas
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-64 relative">
            {totalAll > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 0,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    domain={[0, 'dataMax']}
                    tickFormatter={(value) => value.toFixed(0)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="gradientEntregas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success-green))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--success-green))" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="entregues"
                    stroke="hsl(var(--success-green))"
                    fill="url(#gradientEntregas)"
                    strokeWidth={2}
                    name="Entregas Concluídas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-dark/80 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum dado de entrega disponível para {selectedYear}.</p>
                  <p className="text-sm">Agende entregas para ver as estatísticas.</p>
                </div>
              </div>
            )}
          </div>

          {totalAll > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success-green))' }} />
                <div>
                  <p className="text-sm font-medium">Total de Itens Entregues</p>
                  <p className="text-xs text-muted-foreground">{totalEntreguesCount} itens entregues</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-success-green" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">100% Concluídas</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};