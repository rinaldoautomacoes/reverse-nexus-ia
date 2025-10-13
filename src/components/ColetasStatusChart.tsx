import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  // Legend, // Removido
} from 'recharts';
import type { Tables } from "@/integrations/supabase/types"; // Import Tables type
type Product = Tables<'products'>; // Import Product type

interface ColetasStatusChartProps {
  selectedYear: string;
}

export const ColetasStatusChart: React.FC<ColetasStatusChartProps> = ({ selectedYear }) => {
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
    queryKey: ['coletasStatusChart', user?.id, selectedYear],
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
          modelo_aparelho
        `)
        .eq('user_id', user.id)
        .eq('type', 'coleta') // FILTER FOR 'coleta' type
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
        title: "Erro ao carregar dados das coletas",
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
        descriptions.push(`${quantity}x ${description}`);
      } else {
        descriptions.push(`${quantity}x Item Desconhecido`);
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
      concluidas: Map<string, number>; 
      total_all: number 
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
        concluidas: new Map(), 
        total_all: 0 
      });
    }

    const totalPendenteItems: Map<string, number> = new Map();
    const totalEmTransitoItems: Map<string, number> = new Map();
    const totalConcluidasItems: Map<string, number> = new Map();
    let totalAll = 0;

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
          case 'agendada': // 'agendada' is 'em trânsito' for coletas
            currentMonthData.em_transito.set(productCode, (currentMonthData.em_transito.get(productCode) || 0) + quantity);
            totalEmTransitoItems.set(productCode, (totalEmTransitoItems.get(productCode) || 0) + quantity);
            break;
          case 'concluida':
            currentMonthData.concluidas.set(productCode, (currentMonthData.concluidas.get(productCode) || 0) + quantity);
            totalConcluidasItems.set(productCode, (totalConcluidasItems.get(productCode) || 0) + quantity);
            break;
        }
        currentMonthData.total_all += quantity;
        totalAll += quantity;
        monthlyDataMap.set(coletaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { pendente: new Map(), em_transito: new Map(), concluidas: new Map(), total_all: 0 };
      return {
        month: monthKey,
        pendente: Array.from(data.pendente.values()).reduce((sum, q) => sum + q, 0),
        em_transito: Array.from(data.em_transito.values()).reduce((sum, q) => sum + q, 0),
        concluidas: Array.from(data.concluidas.values()).reduce((sum, q) => sum + q, 0),
        total_all: data.total_all,
        pendenteItems: data.pendente,
        emTransitoItems: data.em_transito,
        concluidasItems: data.concluidas,
      };
    });

    const totalPendenteCount = Array.from(totalPendenteItems.values()).reduce((sum, q) => sum + q, 0);
    const totalEmTransitoCount = Array.from(totalEmTransitoItems.values()).reduce((sum, q) => sum + q, 0);
    const totalConcluidasCount = Array.from(totalConcluidasItems.values()).reduce((sum, q) => sum + q, 0);

    return { 
      chartData, 
      totalPendenteCount, 
      totalEmTransitoCount, 
      totalConcluidasCount, 
      totalAll,
      totalPendenteItems,
      totalEmTransitoItems,
      totalConcluidasItems
    };
  };

  const { chartData, totalPendenteCount, totalEmTransitoCount, totalConcluidasCount, totalAll, totalPendenteItems, totalEmTransitoItems, totalConcluidasItems } = processColetasData(coletas);

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.month === label); // Find the full data for the month
      if (!data) return null;

      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Itens: <span className="font-bold text-foreground">{data.total_all}</span></p>
          {data.pendenteItems.size > 0 && (
            <div className="mt-2">
              <p className="font-medium text-destructive">Pendentes:</p>
              <ul className="list-disc list-inside ml-2">
                {Array.from(data.pendenteItems.entries()).map(([code, quantity]) => (
                  <li key={code} className="text-muted-foreground text-xs">
                    {quantity}x {productDescriptionsMap.get(code) || 'N/A'}
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
                    {quantity}x {productDescriptionsMap.get(code) || 'N/A'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.concluidasItems.size > 0 && (
            <div className="mt-2">
              <p className="font-medium text-success-green">Concluídas:</p>
              <ul className="list-disc list-inside ml-2">
                {Array.from(data.concluidasItems.entries()).map(([code, quantity]) => (
                  <li key={code} className="text-muted-foreground text-xs">
                    {quantity}x {productDescriptionsMap.get(code) || 'N/A'}
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
              Status das Coletas
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
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
                {/* <Legend // Removido
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => (
                    <span className="text-sm flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {value === 'pendente' ? 'Coletas Pendentes' : value === 'em_transito' ? 'Coletas Em Trânsito' : 'Coletas Concluídas'}
                      </span>
                    </span>
                  )}
                /> */}
                <defs>
                  <linearGradient id="gradientEmTransito" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warning-yellow))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--warning-yellow))" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradientPendente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradientConcluidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success-green))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--success-green))" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="em_transito"
                  stroke="hsl(var(--warning-yellow))"
                  fill="url(#gradientEmTransito)"
                  strokeWidth={2}
                  name="Coletas Em Trânsito"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="pendente"
                  stroke="hsl(var(--destructive))"
                  fill="url(#gradientPendente)"
                  strokeWidth={2}
                  name="Coletas Pendentes"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="concluidas"
                  stroke="hsl(var(--success-green))"
                  fill="url(#gradientConcluidas)"
                  strokeWidth={2}
                  name="Coletas Concluídas"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--warning-yellow))' }} />
              <div>
                <p className="text-sm font-medium">Coletas Em Trânsito</p>
                <p className="text-xs text-muted-foreground">{totalEmTransitoCount} itens a caminho</p>
                {totalEmTransitoItems.size > 0 && (
                  <p className="text-xs text-muted-foreground italic">({generateItemDescription(totalEmTransitoItems)})</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
              <div>
                <p className="text-sm font-medium">Coletas Pendentes</p>
                <p className="text-xs text-muted-foreground">{totalPendenteCount} itens aguardando</p>
                {totalPendenteItems.size > 0 && (
                  <p className="text-xs text-muted-foreground italic">({generateItemDescription(totalPendenteItems)})</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success-green))' }} />
              <div>
                <p className="text-sm font-medium">Coletas Concluídas</p>
                <p className="text-xs text-muted-foreground">{totalConcluidasCount} itens coletados</p>
                {totalConcluidasItems.size > 0 && (
                  <p className="text-xs text-muted-foreground italic">({generateItemDescription(totalConcluidasItems)})</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};