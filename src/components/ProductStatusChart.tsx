import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, startOfMonth } from "date-fns";
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
  // Legend, // Removido para replicar a imagem
  // LabelList, // Removido para replicar a imagem
} from 'recharts';

type Coleta = Tables<'coletas'>;
type Product = Tables<'products'>; // Import Product type

interface ProductStatusChartProps {
  selectedYear: string;
}

export const ProductStatusChart: React.FC<ProductStatusChartProps> = ({ selectedYear }) => {
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

  const { data: coletas, isLoading: isLoadingColetas, error: coletasError } = useQuery({
    queryKey: ['productStatusChart', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select(`
          created_at,
          qtd_aparelhos_solicitado,
          status_coleta,
          previsao_coleta,
          modelo_aparelho // Add this
        `)
        .eq('user_id', user.id)
        .eq('type', 'coleta') // FILTRAR POR TIPO 'coleta'
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (coletasError) {
      toast({
        title: "Erro ao carregar dados das coletas para o gráfico de produtos",
        description: coletasError.message,
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
  }, [coletasError, productsError, toast]);

  // Helper function to generate item descriptions for tooltips/cards
  const generateItemDescription = (itemCodeQuantities: Map<string, number>) => {
    const descriptions: string[] = [];
    itemCodeQuantities.forEach((quantity, code) => {
      const description = productDescriptionsMap.get(code);
      if (description) {
        descriptions.push(`${quantity}x ${code} (${description})`);
      } else {
        descriptions.push(`${quantity}x ${code}`);
      }
    });

    if (descriptions.length === 0) return "Nenhum item";
    if (descriptions.length === 1) return descriptions[0];
    if (descriptions.length === 2) return `${descriptions[0]} e ${descriptions[1]}`;
    return `${descriptions[0]}, ${descriptions[1]} e outros`; // For more than 2 types
  };

  const processColetasData = (coletasData: any[] | undefined) => {
    const monthlyDataMap = new Map<string, { 
      pendente: Map<string, number>; 
      em_transito: Map<string, number>; 
      entregues: Map<string, number>; 
      total_month: number 
    }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);
    
    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { 
        pendente: new Map(), 
        em_transito: new Map(), 
        entregues: new Map(), 
        total_month: 0 
      });
    }

    const totalPendenteItems: Map<string, number> = new Map();
    const totalEmTransitoItems: Map<string, number> = new Map();
    const totalEntreguesItems: Map<string, number> = new Map();
    let totalAllItemsCount = 0;

    coletasData?.forEach(coleta => {
      if (!coleta.previsao_coleta || !coleta.modelo_aparelho) return;

      const coletaDate = parseISO(coleta.previsao_coleta);
      const timezoneOffsetMinutes = coletaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(coletaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);
      const coletaMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const quantity = coleta.qtd_aparelhos_solicitado || 0;
      const productCode = coleta.modelo_aparelho;

      if (monthlyDataMap.has(coletaMonthKey)) {
        const currentMonthData = monthlyDataMap.get(coletaMonthKey)!;
        switch (coleta.status_coleta) {
          case 'pendente':
            currentMonthData.pendente.set(productCode, (currentMonthData.pendente.get(productCode) || 0) + quantity);
            totalPendenteItems.set(productCode, (totalPendenteItems.get(productCode) || 0) + quantity);
            break;
          case 'agendada':
            currentMonthData.em_transito.set(productCode, (currentMonthData.em_transito.get(productCode) || 0) + quantity);
            totalEmTransitoItems.set(productCode, (totalEmTransitoItems.get(productCode) || 0) + quantity);
            break;
          case 'concluida':
            currentMonthData.entregues.set(productCode, (currentMonthData.entregues.get(productCode) || 0) + quantity);
            totalEntreguesItems.set(productCode, (totalEntreguesItems.get(productCode) || 0) + quantity);
            break;
        }
        currentMonthData.total_month += quantity;
        totalAllItemsCount += quantity;
        monthlyDataMap.set(coletaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { pendente: new Map(), em_transito: new Map(), entregues: new Map(), total_month: 0 };
      return {
        month: monthKey,
        total_month: data.total_month,
        pendenteItems: data.pendente,
        emTransitoItems: data.em_transito,
        entreguesItems: data.entregues,
      };
    });

    const totalPendenteCount = Array.from(totalPendenteItems.values()).reduce((sum, q) => sum + q, 0);
    const totalEmTransitoCount = Array.from(totalEmTransitoItems.values()).reduce((sum, q) => sum + q, 0);
    const totalEntreguesCount = Array.from(totalEntreguesItems.values()).reduce((sum, q) => sum + q, 0);

    return { 
      chartData, 
      totalAllItemsCount, 
      totalPendenteItems, 
      totalEmTransitoItems, 
      totalEntreguesItems,
      totalPendenteCount,
      totalEmTransitoCount,
      totalEntreguesCount
    };
  };

  const { 
    chartData, 
    totalAllItemsCount, 
    totalPendenteItems, 
    totalEmTransitoItems, 
    totalEntreguesItems,
    totalPendenteCount,
    totalEmTransitoCount,
    totalEntreguesCount
  } = processColetasData(coletas);

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Get the data for the current month
      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Itens: <span className="font-bold text-foreground">{data.total_month}</span></p>
          {data.pendenteItems.size > 0 && (
            <div className="mt-2">
              <p className="font-medium text-destructive">Pendentes:</p>
              <ul className="list-disc list-inside ml-2">
                {Array.from(data.pendenteItems.entries()).map(([code, quantity]) => (
                  <li key={code} className="text-muted-foreground text-xs">
                    {quantity}x {code} ({productDescriptionsMap.get(code) || 'N/A'})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.emTransitoItems.size > 0 && (
            <div className="mt-2">
              <p className="font-medium text-warning-yellow">Em Trânsito:</p>
              <ul className="list-disc list-inside ml-2">
                {Array.from(data.emTransitoItems.entries()).map(([code, quantity]) => (
                  <li key={code} className="text-muted-foreground text-xs">
                    {quantity}x {code} ({productDescriptionsMap.get(code) || 'N/A'})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.entreguesItems.size > 0 && (
            <div className="mt-2">
              <p className="font-medium text-success-green">Entregues:</p>
              <ul className="list-disc list-inside ml-2">
                {Array.from(data.entreguesItems.entries()).map(([code, quantity]) => (
                  <li key={code} className="text-muted-foreground text-xs">
                    {quantity}x {code} ({productDescriptionsMap.get(code) || 'N/A'})
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

  if (isLoadingColetas || isLoadingProducts) {
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
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
          {/* Removido o bloco de Badges */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-64 relative">
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
                {/* CartesianGrid é removido para um visual mais limpo */}
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
                {/* Legend e LabelList são removidos para replicar a imagem */}
                <defs>
                  <linearGradient id="gradientTotalItems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.4} /> {/* Topo do degradê, ciano mais claro */}
                    <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.15} /> {/* Base do degradê, ciano mais escuro/transparente */}
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="total_month" 
                  stroke="hsl(var(--neon-cyan))" // Ciano neon brilhante para a linha
                  fill="url(#gradientTotalItems)" 
                  strokeWidth={2} 
                  name="Total de Itens"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--ai-purple))' }} /> 
              <div>
                <p className="text-sm font-medium">Itens em Processo</p>
                <p className="text-xs text-muted-foreground">{totalPendenteCount + totalEmTransitoCount} itens aguardando/a caminho</p>
                {(totalPendenteItems.size > 0 || totalEmTransitoItems.size > 0) && (
                  <p className="text-xs text-muted-foreground italic">({generateItemDescription(new Map([...totalPendenteItems, ...totalEmTransitoItems]))})</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neon-cyan))' }} /> 
              <div>
                <p className="text-sm font-medium">Total Geral</p>
                <p className="text-xs text-muted-foreground">{totalAllItemsCount} itens no total</p>
                {totalAllItemsCount > 0 && (
                  <p className="text-xs text-muted-foreground italic">({generateItemDescription(new Map([...totalPendenteItems, ...totalEmTransitoItems, ...totalEntreguesItems]))})</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-xs text-muted-foreground">{totalPendenteCount} itens aguardando</p>
                {totalPendenteItems.size > 0 && (
                  <p className="text-xs text-muted-foreground italic">({generateItemDescription(totalPendenteItems)})</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success-green))' }} />
              <div>
                <p className="text-sm font-medium">Entregues</p>
                <p className="text-xs text-muted-foreground">{totalEntreguesCount} itens finalizados</p>
                {totalEntreguesItems.size > 0 && (
                  <p className="text-xs text-muted-foreground italic">({generateItemDescription(totalEntreguesItems)})</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};