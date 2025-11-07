import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck } from "lucide-react";
import { format, parseISO, startOfMonth, isValid } from "date-fns"; // Importar isValid
import { ptBR } from "date-fns/locale";
import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from 'recharts';
import type { Tables } from "@/integrations/supabase/types";
import { getTotalQuantityOfItems } from "@/lib/utils"; // Import new util
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type
type Product = Tables<'products'>;

interface GeneralDeliveriesStatusChartProps {
  allColetas: Coleta[];
  productDescriptionsMap: Map<string, string>;
  selectedYear: string;
}

export const GeneralDeliveriesStatusChart: React.FC<GeneralDeliveriesStatusChartProps> = ({ allColetas, productDescriptionsMap, selectedYear }) => {
  const { user } = useAuth(); // Use useAuth to ensure user is loaded

  if (!user) {
    // Optionally, render a loading state or redirect if user is not available
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

  const generateItemDescription = (items: Array<Tables<'items'>> | null) => {
    if (!items || items.length === 0) return "Nenhum item";
    const descriptions: string[] = [];
    items.forEach(item => {
      descriptions.push(`${item.quantity}x ${item.name} (${item.description || 'Sem descrição'})`);
    });
    if (descriptions.length === 1) return descriptions[0];
    if (descriptions.length === 2) return `${descriptions[0]} e ${descriptions[1]}`;
    return `${descriptions[0]}, ${descriptions[1]} e outros`;
  };

  const processDataForChart = (data: Coleta[] | undefined) => {
    console.log("Processing general deliveries data for chart:", data); // Added log
    const monthlyDataMap = new Map<string, { 
      entregas_pendente: Tables<'items'>[]; 
      entregas_em_transito: Tables<'items'>[]; 
      entregas_concluidas: Tables<'items'>[]; 
      total_items_month: number 
    }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { 
        entregas_pendente: [], 
        entregas_em_transito: [], 
        entregas_concluidas: [], 
        total_items_month: 0 
      });
    }

    let totalEntregasPendente = 0;
    let totalEntregasEmTransito = 0;
    let totalEntregasConcluidas = 0;
    let totalAllItems = 0;

    data?.filter(item => item.type === 'entrega').forEach(item => {
      if (!item.previsao_coleta) {
        console.warn("Skipping general delivery due to missing previsao_coleta:", item); // Added log
        return;
      }

      // Explicitly parse year, month, day to avoid timezone issues
      const [year, month, day] = item.previsao_coleta.split('-').map(Number);
      const itemDate = new Date(year, month - 1, day); // month is 0-indexed
      const monthKey = format(startOfMonth(itemDate), 'MMM', { locale: ptBR });
      const itemsInEntrega = item.items || []; // Ensure it's an array
      const totalItemsInEntrega = getTotalQuantityOfItems(itemsInEntrega);

      if (monthlyDataMap.has(monthKey)) {
        const currentMonthData = monthlyDataMap.get(monthKey)!;
        switch (item.status_coleta) {
          case 'pendente':
            currentMonthData.entregas_pendente.push(...itemsInEntrega);
            totalEntregasPendente += totalItemsInEntrega;
            break;
          case 'agendada':
            currentMonthData.entregas_em_transito.push(...itemsInEntrega);
            totalEntregasEmTransito += totalItemsInEntrega;
            break;
          case 'concluida':
            currentMonthData.entregas_concluidas.push(...itemsInEntrega);
            totalEntregasConcluidas += totalItemsInEntrega;
            break;
        }
        currentMonthData.total_items_month += totalItemsInEntrega;
        totalAllItems += totalItemsInEntrega;
        monthlyDataMap.set(monthKey, currentMonthData);
      }
    });
    console.log("Generated chart data for general deliveries:", allMonths.map(monthKey => monthlyDataMap.get(monthKey))); // Added log
    return { 
      chartData: allMonths.map(monthKey => { // Ensure chartData is always an array
        const data = monthlyDataMap.get(monthKey) || { entregas_pendente: [], entregas_em_transito: [], entregas_concluidas: [], total_items_month: 0 };
        return {
          month: monthKey,
          entregas_pendente: getTotalQuantityOfItems(data.entregas_pendente),
          entregas_em_transito: getTotalQuantityOfItems(data.entregas_em_transito),
          entregas_concluidas: getTotalQuantityOfItems(data.entregas_concluidas),
          total_items_month: data.total_items_month,
          entregas_pendente_items: data.entregas_pendente,
          entregas_em_transito_items: data.entregas_em_transito,
          entregas_concluidas_items: data.entregas_concluidas,
        };
      }),
      totalEntregasPendente, 
      totalEntregasEmTransito, 
      totalEntregasConcluidas,
      totalAllItems
    };
  };

  const { 
    chartData = [], // Default to empty array
    totalEntregasPendente = 0, 
    totalEntregasEmTransito = 0, 
    totalEntregasConcluidas = 0,
    totalAllItems = 0
  } = processDataForChart(allColetas);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.month === label);
      if (!data) return null;

      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Itens: <span className="font-bold text-foreground">{data.total_items_month}</span></p>
          
          {(data.entregas_pendente_items.length > 0 || data.entregas_em_transito_items.length > 0 || data.entregas_concluidas_items.length > 0) && (
            <div className="mt-2 border-t border-border/50 pt-2">
              <p className="font-medium text-primary flex items-center gap-1"><Truck className="h-3 w-3" /> Entregas:</p>
              {data.entregas_pendente_items.length > 0 && (
                <p className="text-destructive text-xs ml-2">P: {generateItemDescription(data.entregas_pendente_items)}</p>
              )}
              {data.entregas_em_transito_items.length > 0 && (
                <p className="text-warning-yellow text-xs ml-2">ET: {generateItemDescription(data.entregas_em_transito_items)}</p>
              )}
              {data.entregas_concluidas_items.length > 0 && (
                <p className="text-success-green text-xs ml-2">C: {generateItemDescription(data.entregas_concluidas_items)}</p>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-orbitron gradient-text">
              Evolução de Entregas e Itens
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-64 relative">
            {totalAllItems > 0 ? (
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
                    <linearGradient id="gradientEntregues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="gradientPendentesEntregas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="entregas_concluidas"
                    stroke="hsl(var(--neon-cyan))"
                    fill="url(#gradientEntregues)"
                    strokeWidth={2}
                    name="Itens Entregues"
                  />
                  <Area
                    type="monotone"
                    dataKey="entregas_pendente"
                    stroke="hsl(var(--ai-purple))"
                    fill="url(#gradientPendentesEntregas)"
                    strokeWidth={2}
                    name="Itens Pendentes de Entrega"
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

          {totalAllItems > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neon-cyan))' }} />
                <div>
                  <p className="text-sm font-medium">Total Itens Entregues</p>
                  <p className="text-xs text-muted-foreground">{totalEntregasConcluidas} itens</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--ai-purple))' }} />
                <div>
                  <p className="text-sm font-medium">Total Itens Pendentes de Entrega</p>
                  <p className="text-xs text-muted-foreground">{totalEntregasPendente} itens</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};