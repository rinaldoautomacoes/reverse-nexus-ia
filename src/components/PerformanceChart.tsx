import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Package, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList, // Mantido para referência, mas não será usado nas barras
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

type Coleta = Tables<'coletas'>;

// Removendo o CustomTooltip e usando o padrão do Recharts
// const CustomTooltip = ({ active, payload, label }: any) => {
//   if (active && payload && payload.length) {
//     const data = payload[0].payload;
//     return (
//       <div className="bg-card p-3 rounded-md border border-border shadow-lg text-sm">
//         <p className="font-semibold text-primary mb-1">{label}</p>
//         <p className="text-muted-foreground">Coletas Totais: <span className="text-foreground">{data.totalCollections}</span></p>
//         <p className="text-muted-foreground">Coletas Processadas: <span className="text-foreground">{data.processedCollections}</span></p>
//         <p className="text-muted-foreground">Total de Produtos: <span className="text-foreground">{data.totalProducts}</span></p>
//         <p className="text-muted-foreground">Clientes Únicos: <span className="text-foreground">{data.uniqueClients}</span></p>
//         {data.efficiency && <p className="text-muted-foreground">Eficiência: <span className="text-foreground">{data.efficiency.toFixed(1)}%</span></p>}
//       </div>
//     );
//   }
//   return null;
// };

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

  // Aggregate data for the chart
  const aggregatedChartData = React.useMemo(() => {
    if (!coletas) return [];

    const monthlyDataMap = new Map<string, {
      month: string;
      totalCollections: number;
      processedCollections: number;
      totalProducts: number;
      uniqueClients: Set<string>;
      efficiency: number;
    }>();

    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i)); // Go back 5, 4, 3, 2, 1, 0 months
      return format(date, 'MMM', { locale: ptBR });
    });

    coletas.forEach(coleta => {
      const createdAtDate = parseISO(coleta.created_at);
      const monthKey = format(createdAtDate, 'MMM', { locale: ptBR });

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
    });

    // Fill in missing months and calculate efficiency
    const finalChartData = months.map(month => {
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
        uniqueClients: data.uniqueClients.size, // Convert Set to size for display
      };
    });

    return finalChartData;
  }, [coletas]);

  // Calculate summary metrics for below the chart
  const summaryMetrics = React.useMemo(() => {
    if (!coletas) return {
      totalProducts: 0,
      pendingProducts: 0,
      inTransitProducts: 0,
      deliveredProducts: 0,
    };

    const totalProducts = coletas.reduce((sum, c) => sum + (c.qtd_aparelhos_solicitado || 0), 0);
    const pendingProducts = coletas.filter(c => c.status_coleta === 'pendente').reduce((sum, c) => sum + (c.qtd_aparelhos_solicitado || 0), 0);
    const inTransitProducts = coletas.filter(c => c.status_coleta === 'agendada').reduce((sum, c) => sum + (c.qtd_aparelhos_solicitado || 0), 0);
    const deliveredProducts = coletas.filter(c => c.status_coleta === 'concluida').reduce((sum, c) => sum + (c.qtd_aparelhos_solicitado || 0), 0);

    return {
      totalProducts,
      pendingProducts,
      inTransitProducts,
      deliveredProducts,
    };
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
              Performance do Sistema
            </CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </div>
          <div className="flex gap-2">
            {/* Placeholder for overall trend, can be calculated from aggregatedChartData */}
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              +24%
            </Badge>
            <Badge variant="secondary" className="bg-neural/20 text-neural">
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
              <BarChart
                data={aggregatedChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.2)" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  // Adiciona um formatador para exibir "0 itens" se não houver produtos
                  tickFormatter={(value, index) => {
                    const dataEntry = aggregatedChartData[index];
                    return dataEntry && dataEntry.totalProducts === 0 ? '0 itens' : value;
                  }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip /> {/* Usando o Tooltip padrão */}
                <Legend />
                <Bar dataKey="totalCollections" name="Coletas Totais" fill="hsl(var(--neon-cyan))" radius={[4, 4, 0, 0]}>
                  {/* Removido LabelList para corresponder à imagem */}
                </Bar>
                <Bar dataKey="processedCollections" name="Coletas Processadas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-gradient-primary rounded" />
              <div>
                <p className="text-sm font-medium">Coletas Totais</p>
                <p className="text-xs text-muted-foreground">Agendadas + Realizadas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-accent rounded" />
              <div>
                <p className="text-sm font-medium">Processadas</p>
                <p className="text-xs text-muted-foreground">Finalizadas com sucesso</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-neural rounded" />
              <div>
                <p className="text-sm font-medium">Eficiência IA</p>
                <p className="text-xs text-muted-foreground">Taxa de otimização</p>
              </div>
            </div>
          </div>

          {/* Summary of Products */}
          <div className="border-t border-border/30 pt-4 mt-6 space-y-2">
            <h3 className="text-lg font-semibold gradient-text flex items-center gap-2">
              <Package className="h-5 w-5" />
              Resumo de Produtos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-secondary/10 rounded-lg flex items-center gap-2">
                <span className="font-medium">Total Geral:</span>
                <span className="text-foreground font-bold">{summaryMetrics.totalProducts} itens</span>
              </div>
              <div className="p-3 bg-neural/10 rounded-lg flex items-center gap-2">
                <span className="font-medium">Pendentes:</span>
                <span className="text-neural font-bold">{summaryMetrics.pendingProducts} itens</span>
              </div>
              <div className="p-3 bg-warning-yellow/10 rounded-lg flex items-center gap-2">
                <span className="font-medium">Em Trânsito:</span>
                <span className="text-warning-yellow font-bold">{summaryMetrics.inTransitProducts} itens</span>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                <span className="font-medium">Entregues:</span>
                <span className="text-primary font-bold">{summaryMetrics.deliveredProducts} itens</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};