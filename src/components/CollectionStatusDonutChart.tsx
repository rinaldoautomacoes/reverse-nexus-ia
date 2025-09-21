import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { Package, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Coleta = Tables<'coletas'>;

const COLORS = {
  pendente: 'hsl(var(--destructive))', // Alterado para destructive
  agendada: 'hsl(var(--warning-yellow))', // Nova cor para 'Em Trânsito'
  concluida: 'hsl(var(--success-green))',    // Alterado para success-green
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

const CustomLabel: React.FC<CustomLabelProps> = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="hsl(0 0% 0%)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const CollectionStatusDonutChart: React.FC = () => {
  const { user } = useAuth();

  const { data: coletas, isLoading, error } = useQuery<Coleta[], Error>({
    queryKey: ['collectionStatusChart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('coletas')
        .select('status_coleta')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const calculateStatusData = (coletasData: Coleta[] | undefined) => {
    if (!coletasData || coletasData.length === 0) {
      return {
        total: 0,
        pendente: 0,
        agendada: 0, // Adicionado
        concluida: 0,
        chartData: [],
      };
    }

    const pendenteCount = coletasData.filter(c => c.status_coleta === 'pendente').length;
    const agendadaCount = coletasData.filter(c => c.status_coleta === 'agendada').length; // Contagem de 'agendada'
    const concluidaCount = coletasData.filter(c => c.status_coleta === 'concluida').length;
    const total = pendenteCount + agendadaCount + concluidaCount; // Total atualizado

    const chartData = [
      { name: 'Coletas Pendentes', value: pendenteCount, color: COLORS.pendente },
      { name: 'Coletas Em Trânsito', value: agendadaCount, color: COLORS.agendada }, // Nova entrada
      { name: 'Coletas Finalizadas', value: concluidaCount, color: COLORS.concluida },
    ].filter(entry => entry.value > 0); // Filtra entradas com valor 0 para não aparecer no gráfico

    return { total, pendente: pendenteCount, agendada: agendadaCount, concluida: concluidaCount, chartData };
  };

  const { total, pendente, agendada, concluida, chartData } = calculateStatusData(coletas);

  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
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
      <CardContent className="h-80 flex flex-col items-center justify-center">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
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
            <Package className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhuma coleta encontrada.</p>
            <p className="text-sm">Agende sua primeira coleta!</p>
          </div>
        )}
        {total > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total de Coletas: <span className="font-semibold text-foreground">{total}</span></p>
            {/* Removido o bloco que exibia as contagens de pendentes e concluídas separadamente */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};