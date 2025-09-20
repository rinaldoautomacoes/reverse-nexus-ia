import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

type Coleta = Tables<'coletas'>;

export const PerformanceChart = () => {
  const { user } = useAuth();

  const { data: coletas, isLoading, error } = useQuery<Coleta[], Error>({
    queryKey: ['performanceColetas', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('coletas')
        .select('created_at, status_coleta, qtd_aparelhos_solicitado, parceiro')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const aggregatedChartData = React.useMemo(() => {
    if (!coletas) return [];

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth(); // 0-11 (Jan=0, Sep=8)

    const septemberMonthIndex = 8; // September (0-indexed)

    const monthsToDisplay: string[] = [];
    for (let i = septemberMonthIndex; i <= currentMonthIndex; i++) {
      const date = new Date(currentYear, i, 1);
      monthsToDisplay.push(format(date, 'MMM', { locale: ptBR }));
    }

    const monthlyDataMap = new Map<string, {
      month: string;
      totalCollections: number;
      processedCollections: number;
      totalProducts: number;
      uniqueClients: Set<string>;
      efficiency: number;
    }>();

    coletas.forEach(coleta => {
      const createdAtDate = parseISO(coleta.created_at);
      const monthKey = format(createdAtDate, 'MMM', { locale: ptBR });

      // Only consider data for months that are in our display range (September onwards of current year)
      if (monthsToDisplay.includes(monthKey)) {
        if (!monthlyDataMap.has(monthKey)) {
          monthlyDataMap.set(monthKey, {
            month: monthKey,
            totalCollections: 0,
            processedCollections: 0,
            totalProducts: 0,
            uniqueClients: new Set<string>(),
            efficiency: 0,
          });
        }

        const entry = monthlyDataMap.get(monthKey)!;
        entry.totalCollections += 1;
        entry.totalProducts += (coleta.qtd_aparelhos_solicitado || 0);
        if (coleta.parceiro) {
          entry.uniqueClients.add(coleta.parceiro);
        }
        if (coleta.status_coleta === 'concluida') {
          entry.processedCollections += 1;
        }
      }
    });

    const finalChartData = monthsToDisplay.map(month => {
      const data = monthlyDataMap.get(month) || {
        month,
        totalCollections: 0,
        processedCollections: 0,
        totalProducts: 0,
        uniqueClients: new Set<string>(),
        efficiency: 0,
      };
      data.efficiency = data.totalCollections > 0 ? (data.processedCollections / data.totalCollections) * 100 : 0;
      return {
        ...data,
        uniqueClients: data.uniqueClients.size,
      };
    });

    return finalChartData;
  }, [coletas]);

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

  if (error) {
    return (
      <Card className="card-futuristic border-0">
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar dados de performance: {error.message}
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
              Performance de Recolhimentos
            </CardTitle>
            <p className="text-sm text-muted-foreground">A partir de Setembro</p> {/* Texto atualizado */}
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              +24%
            </Badge>
            <Badge variant="secondary" className="bg-neon-cyan/20 text-neon-cyan">
              {aggregatedChartData.length > 0 ? aggregatedChartData[aggregatedChartData.length - 1].efficiency.toFixed(1) : '0.0'}% Eficiência
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart Visualization */}
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={aggregatedChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="colorTotalCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorTotalProducts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.2)" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value: number) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelFormatter={(label: string) => `Mês: ${label}`}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value, entry) => (
                    <span className="text-sm flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="font-semibold text-foreground">{value}</span>
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="totalCollections"
                  name="Totais de Coletas"
                  stroke="hsl(var(--neon-cyan))"
                  fill="url(#colorTotalCollections)"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: 'hsl(var(--neon-cyan))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="totalProducts"
                  name="Totais de Produtos"
                  stroke="hsl(var(--ai-purple))"
                  fill="url(#colorTotalProducts)"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: 'hsl(var(--ai-purple))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};