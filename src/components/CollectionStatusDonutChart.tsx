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
  pendente: 'hsl(var(--neural-blue))', // Cor neon para pendente
  concluida: 'hsl(var(--primary))',    // Cor primária para concluída
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
    <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-bold">
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
        concluida: 0,
        chartData: [],
      };
    }

    const pendenteCount = coletasData.filter(c => c.status_coleta === 'pendente').length;
    const concluidaCount = coletasData.filter(c => c.status_coleta === 'concluida').length;
    const total = pendenteCount + concluidaCount;

    const chartData = [
      { name: 'Pendentes', value: pendenteCount, color: COLORS.pendente },
      { name: 'Concluídas', value: concluidaCount, color: COLORS.concluida },
    ];

    return { total, pendente: pendenteCount, concluida: concluidaCount, chartData };
  };

  const { total, pendente, concluida, chartData } = calculateStatusData(coletas);

  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80"> {/* Aumentado para h-80 */}
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
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text">
          <Package className="h-5 w-5 text-primary" />
          Status das Coletas
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 flex flex-col items-center justify-center"> {/* Aumentado para h-80 */}
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
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    {value}: <span className="font-semibold text-foreground">{entry.payload.value}</span>
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
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-neural" />
                <span className="text-muted-foreground">Pendentes: <span className="font-semibold text-foreground">{pendente}</span></span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Concluídas: <span className="font-semibold text-foreground">{concluida}</span></span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};