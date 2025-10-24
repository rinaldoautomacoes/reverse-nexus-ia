import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Truck } from 'lucide-react';
import { format, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from "@/integrations/supabase/types";

type Coleta = Tables<'coletas'>;

interface GeneralEntregasPerformanceChartProps {
  allColetas: Coleta[];
  selectedYear: string;
}

export const GeneralEntregasPerformanceChart: React.FC<GeneralEntregasPerformanceChartProps> = ({ allColetas, selectedYear }) => {

  const processData = (data: Coleta[]) => {
    const monthlyDataMap = new Map<string, { totalEntregas: number; totalItems: number }>();
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      monthlyDataMap.set(monthKey, { totalEntregas: 0, totalItems: 0 });
    }

    data.filter(item => item.type === 'entrega').forEach(entrega => {
      if (!entrega.previsao_coleta) return;

      const entregaDate = parseISO(entrega.previsao_coleta);
      const timezoneOffsetMinutes = entregaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(entregaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);
      const monthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });

      if (monthlyDataMap.has(monthKey)) {
        const currentMonthData = monthlyDataMap.get(monthKey)!;
        currentMonthData.totalEntregas += 1; // Count each entrega
        currentMonthData.totalItems += (entrega.qtd_aparelhos_solicitado || 0); // Sum items
        monthlyDataMap.set(monthKey, currentMonthData);
      }
    });

    return Array.from(monthlyDataMap.entries()).map(([month, values]) => ({
      month,
      ...values,
    }));
  };

  const chartData = processData(allColetas);
  const hasData = chartData.some(d => d.totalEntregas > 0 || d.totalItems > 0);

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
          <Truck className="h-5 w-5 text-primary" />
          Evolução de Entregas e Itens ({selectedYear})
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span className="text-sm flex items-center gap-2">
                  <span className="font-semibold text-foreground">{value === 'totalEntregas' ? 'Total de Entregas' : 'Total de Itens'}</span>
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="totalEntregas"
              stroke="hsl(var(--neon-cyan))"
              fill="url(#gradientEntregas)"
              strokeWidth={2}
              name="Total de Entregas"
            />
            <Area
              type="monotone"
              dataKey="totalItems"
              stroke="hsl(var(--ai-purple))"
              fill="url(#gradientItems)"
              strokeWidth={2}
              name="Total de Itens"
            />
            <defs>
              <linearGradient id="gradientEntregas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientItems" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-dark/80 rounded-lg">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum dado de entregas disponível para {selectedYear}.</p>
              <p className="text-sm">Agende entregas para ver as estatísticas.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};