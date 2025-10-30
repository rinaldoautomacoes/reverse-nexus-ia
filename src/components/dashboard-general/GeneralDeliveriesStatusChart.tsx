import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck } from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";
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

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type
type Product = Tables<'products'>;

interface GeneralDeliveriesStatusChartProps {
  allColetas: Coleta[];
  productDescriptionsMap: Map<string, string>;
  selectedYear: string;
}

export const GeneralDeliveriesStatusChart: React.FC<GeneralDeliveriesStatusChartProps> = ({ allColetas, productDescriptionsMap, selectedYear }) => {

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

  const processDataForChart = (data: Coleta[]) => {
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

    data.filter(item => item.type === 'entrega').forEach(item => {
      if (!item.previsao_coleta || !item.items) return;

      // Simplified month key generation to avoid timezone issues with DATE type
      const itemDate = new Date(item.previsao_coleta + 'T00:00:00'); // Treat as local midnight
      const monthKey = format(startOfMonth(itemDate), 'MMM', { locale: ptBR });
      const totalItemsInEntrega = getTotalQuantityOfItems(item.items);

      if (monthlyDataMap.has(monthKey)) {
        const currentMonthData = monthlyDataMap.get(monthKey)!;
        switch (item.status_coleta) {
          case 'pendente':
            currentMonthData.entregas_pendente.push(...item.items);
            totalEntregasPendente += totalItemsInEntrega;
            break;
          case 'agendada':
            currentMonthData.entregas_em_transito.push(...item.items);
            totalEntregasEmTransito += totalItemsInEntrega;
            break;
          case 'concluida':
            currentMonthData.entregas_concluidas.push(...item.items);
            totalEntregasConcluidas += totalItemsInEntrega;
            break;
        }
        currentMonthData.total_items_month += totalItemsInEntrega;
        totalAllItems += totalItemsInEntrega;
        monthlyDataMap.set(monthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey)!;
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
    });

    return { 
      chartData, 
      totalEntregasPendente, 
      totalEntregasEmTransito, 
      totalEntregasConcluidas,
      totalAllItems
    };
  };

  const { 
    chartData, 
    totalEntregasPendente, 
    totalEntregasEmTransito, 
    totalEntregasConcluidas,
    totalAllItems
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
          </div>

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
        </div>
      </CardContent>
    </Card>
  );
};