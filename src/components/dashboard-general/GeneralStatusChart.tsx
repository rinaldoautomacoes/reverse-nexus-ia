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
  Legend, // Reativado para a legenda do gráfico
} from 'recharts';
import type { Tables } from "@/integrations/supabase/types";

type Coleta = Tables<'coletas'>;
type Product = Tables<'products'>;

interface GeneralStatusChartProps {
  allColetas: Coleta[];
  productDescriptionsMap: Map<string, string>;
  selectedYear: string;
}

export const GeneralStatusChart: React.FC<GeneralStatusChartProps> = ({ allColetas, productDescriptionsMap, selectedYear }) => {

  // A função generateItemDescription não é mais usada diretamente no tooltip simplificado,
  // mas pode ser útil para depuração ou futuras expansões.
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

  const processDataForChart = (data: Coleta[]) => {
    const monthlyDataMap = new Map<string, { 
      totalColetasItems: number; 
      totalEntregasItems: number; 
      total_items_month: number 
    }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { 
        totalColetasItems: 0, 
        totalEntregasItems: 0, 
        total_items_month: 0 
      });
    }

    let totalAllColetasItems = 0;
    let totalAllEntregasItems = 0;

    data.forEach(item => {
      if (!item.previsao_coleta || !item.modelo_aparelho) return;

      const itemDate = parseISO(item.previsao_coleta);
      const timezoneOffsetMinutes = itemDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(itemDate.getTime() - timezoneOffsetMinutes * 60 * 1000);
      const monthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const quantity = item.qtd_aparelhos_solicitado || 0;

      if (monthlyDataMap.has(monthKey)) {
        const currentMonthData = monthlyDataMap.get(monthKey)!;
        if (item.type === 'coleta' && item.status_coleta === 'concluida') {
          currentMonthData.totalColetasItems += quantity;
          totalAllColetasItems += quantity;
        } else if (item.type === 'entrega' && item.status_coleta === 'concluida') {
          currentMonthData.totalEntregasItems += quantity;
          totalAllEntregasItems += quantity;
        }
        currentMonthData.total_items_month = currentMonthData.totalColetasItems + currentMonthData.totalEntregasItems;
        monthlyDataMap.set(monthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey)!;
      return {
        month: monthKey,
        totalColetasItems: data.totalColetasItems,
        totalEntregasItems: data.totalEntregasItems,
        total_items_month: data.total_items_month,
      };
    });

    return { 
      chartData, 
      totalAllColetasItems,
      totalAllEntregasItems,
    };
  };

  const { 
    chartData, 
    totalAllColetasItems,
    totalAllEntregasItems,
  } = processDataForChart(allColetas);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.month === label);
      if (!data) return null;

      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Itens: <span className="font-bold text-foreground">{data.total_items_month}</span></p>
          <p className="text-neon-cyan text-xs ml-2">Itens Coletados: <span className="font-bold">{data.totalColetasItems}</span></p>
          <p className="text-ai-purple text-xs ml-2">Itens Entregues: <span className="font-bold">{data.totalEntregasItems}</span></p>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.some(d => d.totalColetasItems > 0 || d.totalEntregasItems > 0);

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-orbitron gradient-text">
              Evolução Mensal de Itens
            </CardTitle>
            <p className="text-sm text-muted-foreground">Coletas e Entregas - Ano {selectedYear}</p>
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
                <Legend // Reativado para a legenda
                  wrapperStyle={{ paddingTop: '10px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}
                  formatter={(value) => (
                    <span className="text-sm flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {value === 'totalColetasItems' ? 'Total Itens Coletados' : 'Total Itens Entregues'}
                      </span>
                    </span>
                  )}
                />
                <defs>
                  <linearGradient id="gradientColetas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradientEntregas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="totalColetasItems"
                  stroke="hsl(var(--neon-cyan))"
                  fill="url(#gradientColetas)"
                  strokeWidth={2}
                  name="Total Itens Coletados"
                  stackId="1" // Usar stackId para empilhar as áreas
                />
                <Area
                  type="monotone"
                  dataKey="totalEntregasItems"
                  stroke="hsl(var(--ai-purple))"
                  fill="url(#gradientEntregas)"
                  strokeWidth={2}
                  name="Total Itens Entregues"
                  stackId="1" // Usar stackId para empilhar as áreas
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neon-cyan))' }} />
              <div>
                <p className="text-sm font-medium">Total Itens Coletados</p>
                <p className="text-xs text-muted-foreground">{totalAllColetasItems} itens</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--ai-purple))' }} />
              <div>
                <p className="text-sm font-medium">Total Itens Entregues</p>
                <p className="text-xs text-muted-foreground">{totalAllEntregasItems} itens</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};