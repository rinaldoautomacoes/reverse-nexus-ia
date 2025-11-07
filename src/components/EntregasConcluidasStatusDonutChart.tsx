import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Truck, Clock, CheckCircle } from "lucide-react";

const COLORS = {
  pendente: 'hsl(var(--destructive))',
  em_transito: 'hsl(var(--warning-yellow))',
  entregue: 'hsl(var(--success-green))',
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
  if (value === 0) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="hsl(0 0% 0%)" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold"> {/* Alterado para text-xs */}
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface EntregasConcluidasStatusDonutChartProps {
  selectedYear: string;
}

export const EntregasConcluidasStatusDonutChart: React.FC<EntregasConcluidasStatusDonutChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();

  const { data: entregas, isLoading, error } = useQuery({
    queryKey: ['entregasConcluidasStatusChart', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select('status_coleta')
        .eq('user_id', user.id)
        .eq('type', 'entrega') // FILTRAR POR TIPO 'entrega'
        .eq('status_coleta', 'concluida') // Apenas coletas concluídas (entregas)
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const calculateStatusData = (entregasData: any[] | undefined) => {
    // Para este gráfico de "Entregas Concluídas", pendente e em trânsito serão sempre 0
    const pendenteCount = 0;
    const emTransitoCount = 0;
    const concluidaCount = entregasData?.length || 0; // Todas as entregas são concluídas pelo filtro
    const total = pendenteCount + emTransitoCount + concluidaCount;

    const chartData = [
      { name: 'Entregas Pendentes', value: pendenteCount, color: COLORS.pendente },
      { name: 'Entregas Em Trânsito', value: emTransitoCount, color: COLORS.em_transito },
      { name: 'Entregas Concluídas', value: concluidaCount, color: COLORS.entregue },
    ];

    return { total, pendente: pendenteCount, emTransito: emTransitoCount, concluida: concluidaCount, chartData };
  };

  const { total, concluida, chartData } = calculateStatusData(entregas);

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
          Erro ao carregar dados das entregas: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
          <Truck className="h-5 w-5 text-primary" />
          Status das Entregas Concluídas
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[450px] flex flex-col items-center justify-center">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80} // Ajustado para fatias mais finas
                outerRadius={110} // Ajustado para fatias mais finas
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
        ) : (
          <div className="text-center text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhuma entrega concluída encontrada para o ano de {selectedYear}.</p>
            <p className="text-sm">Complete suas coletas para ver as entregas!</p>
          </div>
        )}
        {total > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total de Entregas: <span className="font-semibold text-foreground">{total}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};