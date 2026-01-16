import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Bug, Clock, CheckCircle, XCircle } from "lucide-react";

const COLORS = {
  agendado: 'hsl(var(--warning-yellow))',
  em_andamento: 'hsl(var(--neural))',
  concluido: 'hsl(var(--success-green))',
  cancelado: 'hsl(var(--destructive))',
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

const CustomLabel: React.FC<CustomLabelProps> = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (value === 0) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="hsl(0 0% 0%)" textAnchor="middle" dominantBaseline="central" className="text-sm font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface PestControlStatusDonutChartProps {
  selectedYear: string;
}

export const PestControlStatusDonutChart: React.FC<PestControlStatusDonutChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['pestControlStatusDonutChart', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('pest_control_services')
        .select('status')
        .eq('user_id', user.id)
        .gte('service_date', startDate)
        .lt('service_date', endDate);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const calculateStatusData = (servicesData: any[] | undefined) => {
    const agendadoCount = servicesData?.filter(s => s.status === 'agendado').length || 0;
    const emAndamentoCount = servicesData?.filter(s => s.status === 'em_andamento').length || 0;
    const concluidoCount = servicesData?.filter(s => s.status === 'concluido').length || 0;
    const canceladoCount = servicesData?.filter(s => s.status === 'cancelado').length || 0;
    const total = agendadoCount + emAndamentoCount + concluidoCount + canceladoCount;

    const chartData = [
      { name: 'Agendados', value: agendadoCount, color: COLORS.agendado },
      { name: 'Em Andamento', value: emAndamentoCount, color: COLORS.em_andamento },
      { name: 'Concluídos', value: concluidoCount, color: COLORS.concluido },
      { name: 'Cancelados', value: canceladoCount, color: COLORS.cancelado },
    ];

    return { total, agendado: agendadoCount, emAndamento: emAndamentoCount, concluido: concluidoCount, cancelado: canceladoCount, chartData };
  };

  const { total, chartData } = calculateStatusData(services);

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
          Erro ao carregar dados dos serviços de pragas: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
          <Bug className="h-5 w-5 text-primary" />
          Status dos Serviços
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
        ) : (
          <div className="text-center text-muted-foreground">
            <Bug className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhum serviço de controle de pragas encontrado para o ano de {selectedYear}.</p>
            <p className="text-sm">Agende novos serviços para ver as estatísticas!</p>
          </div>
        )}
        {total > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total de Serviços: <span className="font-semibold text-foreground">{total}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};