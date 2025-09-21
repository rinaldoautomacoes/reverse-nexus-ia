import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Package } from "lucide-react";
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
  Tooltip, // Mantido para o caso de querer reativar, mas não será usado
  ResponsiveContainer,
  LabelList,
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
      date.setMonth(date.getMonth() - (5 - i));
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
              Performance do Sistema
            </CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
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
              <BarChart
                layout="vertical" // Alterado para layout vertical
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
                  type="number" // Eixo X agora é numérico
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <YAxis
                  dataKey="month" // Eixo Y agora é categórico (meses)
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                />
                {/* Tooltip removido para corresponder à imagem */}
                <Bar dataKey="efficiency" name="Eficiência IA" fill="hsl(var(--neon-cyan))" radius={[0, 4, 4, 0]}> {/* Raio ajustado para barras horizontais */}
                  <LabelList
                    dataKey="efficiency"
                    position="right" // Posição do rótulo ajustada para barras horizontais
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    className="text-sm fill-foreground"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend (matching the image) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neon-cyan))' }} />
              <div>
                <p className="text-sm font-medium">Coletas Totais</p>
                <p className="text-xs text-muted-foreground">Agendadas + Realizadas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neon-cyan))' }} />
              <div>
                <p className="text-sm font-medium">Processadas</p>
                <p className="text-xs text-muted-foreground">Finalizadas com sucesso</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neon-cyan))' }} />
              <div>
                <p className="text-sm font-medium">Eficiência IA</p>
                <p className="text-xs text-muted-foreground">Taxa de otimização</p>
              </div>
            </div>
          </div>
          {/* Resumo de Produtos removido para corresponder à imagem */}
        </div>
      </CardContent>
    </Card>
  );
};