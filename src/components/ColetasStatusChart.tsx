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
import type { Tables } from "@/integrations/supabase/types";
import { getTotalQuantityOfItems } from "@/lib/utils"; // Import new util

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type
type Product = Tables<'products'>;

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

  const { data: coletas, isLoading: isLoadingColetas, error: coletasError } = useQuery<Coleta[], Error>({
    queryKey: ['coletasStatusChart', user?.id, selectedYear],
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
        .eq('type', 'coleta')
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

  const processColetasData = (coletasData: Coleta[] | undefined) => {
    const monthlyDataMap = new Map<string, { 
      pendente: Tables<'items'>[]; 
      em_transito: Tables<'items'>[]; 
      concluidas: Tables<'items'>[]; 
      total_all: number 
    }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { 
        pendente: [], 
        em_transito: [], 
        concluidas: [], 
        total_all: 0 
      });
    }

    let totalPendenteCount = 0;
    let totalEmTransitoCount = 0;
    let totalConcluidasCount = 0;
    let totalAll = 0;

    coletasData?.forEach(coleta => {
      if (!coleta.previsao_coleta || !coleta.items) return;

      const coletaDate = parseISO(coleta.previsao_coleta);

      const timezoneOffsetMinutes = coletaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(coletaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);

      const coletaMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const totalItemsInColeta = getTotalQuantityOfItems(coleta.items);

      if (monthlyDataMap.has(coletaMonthKey)) {
        const currentMonthData = monthlyDataMap.get(coletaMonthKey)!;
        switch (coleta.status_coleta) {
          case 'pendente':
            currentMonthData.pendente.push(...coleta.items);
            totalPendenteCount += totalItemsInColeta;
            break;
          case 'agendada':
            currentMonthData.em_transito.push(...coleta.items);
            totalEmTransitoCount += totalItemsInColeta;
            break;
          case 'concluida':
            currentMonthData.concluidas.push(...coleta.items);
            totalConcluidasCount += totalItemsInColeta;
            break;
        }
        currentMonthData.total_all += totalItemsInColeta;
        totalAll += totalItemsInColeta;
        monthlyDataMap.set(coletaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { pendente: [], em_transito: [], concluidas: [], total_all: 0 };
      return {
        month: monthKey,
        pendente: getTotalQuantityOfItems(data.pendente),
        em_transito: getTotalQuantityOfItems(data.em_transito),
        concluidas: getTotalQuantityOfItems(data.concluidas),
        total_all: data.total_all,
        pendenteItems: data.pendente,
        emTransitoItems: data.em_transito,
        concluidasItems: data.concluidas,
      };
    });

    return { 
      chartData, 
      totalPendenteCount, 
      totalEmTransitoCount, 
      totalConcluidasCount, 
      totalAll
    };
  };

  const { chartData, totalPendenteCount, totalEmTransitoCount, totalConcluidasCount, totalAll } = processColetasData(coletas);

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.month === label);
      if (!data) return null;

      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Itens: <span className="font-bold text-foreground">{data.total_all}</span></p>
          {data.pendenteItems.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-destructive">Pendentes:</p>
              <ul className="list-disc list-inside ml-2">
                {data.pendenteItems.map((item, idx) => (
                  <li key={idx} className="text-muted-foreground text-xs">
                    {item.quantity}x {item.name} ({item.description || 'N/A'})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.emTransitoItems.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-warning-yellow">Em Trânsito:</p>
              <ul className="list-disc list-inside ml-2">
                {data.emTransitoItems.map((item, idx) => (
                  <li key={idx} className="text-muted-foreground text-xs">
                    {item.quantity}x {item.name} ({item.description || 'N/A'})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.concluidasItems.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-success-green">Concluídas:</p>
              <ul className="list-disc list-inside ml-2">
                {data.concluidasItems.map((item, idx) => (
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
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
              <div>
                <p className="text-sm font-medium">Coletas Pendentes</p>
                <p className="text-xs text-muted-foreground">{totalPendenteCount} itens aguardando</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success-green))' }} />
              <div>
                <p className="text-sm font-medium">Coletas Concluídas</p>
                <p className="text-xs text-muted-foreground">{totalConcluidasCount} itens coletados</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};