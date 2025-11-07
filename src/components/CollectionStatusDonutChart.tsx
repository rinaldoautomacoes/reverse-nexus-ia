import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Package, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Coleta = Tables<'coletas'>;

const COLORS = {
  pendente: 'hsl(var(--destructive))', // Agora será ai-purple
  agendada: 'hsl(var(--warning-yellow))', // Já é amarelo
  concluida: 'hsl(var(--success-green))',    // Agora será neon-cyan
};

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  value: number;
  name: string;
}

const CustomLabel: React.FC<CustomLabelProps> = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  if (value === 0) return null; // Não renderiza o label para valores zero

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="hsl(0 0% 0%)" textAnchor="middle" dominantBaseline="central" className="text-sm font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface CollectionStatusDonutChartProps {
  selectedYear: string;
}

export const CollectionStatusDonutChart: React.FC<CollectionStatusDonutChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();

  const { data: coletas, isLoading, error } = useQuery({
    queryKey: ['collectionStatusChart', user?.id, selectedYear], // Adicionado selectedYear ao queryKey
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`; // Ajustado para data sem hora para corresponder ao tipo DATE
      const endDate = `${parseInt(selectedYear) + 1}-01-01`; // Ajustado para data sem hora

      const { data, error } = await supabase
        .from('coletas')
        .select('status_coleta')
        .eq('user_id', user.id)
        .eq('type', 'coleta') // FILTRAR POR TIPO 'coleta'
        .gte('previsao_coleta', startDate) // FILTRAR POR previsao_coleta
        .lt('previsao_coleta', endDate); // FILTRAR POR previsao_coleta
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const calculateStatusData = (coletasData: any[] | undefined) => {
    const pendenteCount = coletasData?.filter(c => c.status_coleta === 'pendente').length || 0;
    const agendadaCount = coletasData?.filter(c => c.status_coleta === 'agendada').length || 0;
    const concluidaCount = coletasData?.filter(c => c.status_coleta === 'concluida').length || 0;
    const total = pendenteCount + agendadaCount + concluidaCount;

    const chartData = [
      { name: 'Coletas Pendentes', value: pendenteCount, color: COLORS.pendente },
      { name: 'Coletas Em Trânsito', value: agendadaCount, color: COLORS.agendada },
      { name: 'Coletas Concluídas', value: concluidaCount, color: COLORS.concluida },
    ]; // Removido o filtro para sempre exibir todas as categorias

    return { total, pendente: pendenteCount, agendada: agendadaCount, concluida: concluidaCount, chartData };
  };

  const { total, pendente, agendada, concluida, chartData } = calculateStatusData(coletas);

  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[450px]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-futuristic border-0">
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar dados das coletas: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
          <Package className="h-5 w-5 text-primary" />
          Status das Coletas
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[450px] flex flex-col items-center justify-center">
        {/* O gráfico sempre será renderizado, mesmo que todos os valores sejam zero */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={130}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              cornerRadius={5}
              labelLine={false}
              label={CustomLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
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
          </PieChart>
        </ResponsiveContainer>
        {total === 0 && ( // Exibe a mensagem apenas se o total de coletas for 0
          <div className="text-center text-muted-foreground mt-4">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhuma coleta encontrada para o ano de {selectedYear}.</p>
            <p className="text-sm">Agende sua primeira coleta!</p>
          </div>
        )}
        {total > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total de Coletas: <span className="font-semibold text-foreground">{total}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};