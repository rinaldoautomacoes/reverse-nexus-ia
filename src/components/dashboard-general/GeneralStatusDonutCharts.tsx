import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Package, Truck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Coleta = Tables<'coletas'>;

const COLORS_COLETAS = {
  pendente: 'hsl(var(--destructive))', // ai-purple
  agendada: 'hsl(var(--warning-yellow))', // neural-blue
  concluida: 'hsl(var(--success-green))',    // neon-cyan
};

const COLORS_ENTREGAS = {
  pendente: 'hsl(var(--destructive))', // ai-purple
  agendada: 'hsl(var(--warning-yellow))', // neural-blue
  concluida: 'hsl(var(--success-green))',    // neon-cyan
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
    <text x={x} y={y} fill="hsl(0 0% 0%)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface GeneralStatusDonutChartsProps {
  allColetas: Coleta[];
  selectedYear: string;
}

export const GeneralStatusDonutCharts: React.FC<GeneralStatusDonutChartsProps> = ({ allColetas, selectedYear }) => {

  const calculateStatusData = (data: Coleta[], type: 'coleta' | 'entrega') => {
    const filteredData = data.filter(item => item.type === type);
    const pendenteCount = filteredData.filter(c => c.status_coleta === 'pendente').length;
    const agendadaCount = filteredData.filter(c => c.status_coleta === 'agendada').length;
    const concluidaCount = filteredData.filter(c => c.status_coleta === 'concluida').length;
    const total = pendenteCount + agendadaCount + concluidaCount;

    const colors = type === 'coleta' ? COLORS_COLETAS : COLORS_ENTREGAS;

    const chartData = [
      { name: `${type === 'coleta' ? 'Coletas' : 'Entregas'} Pendentes`, value: pendenteCount, color: colors.pendente },
      { name: `${type === 'coleta' ? 'Coletas' : 'Entregas'} Em Trânsito`, value: agendadaCount, color: colors.agendada },
      { name: `${type === 'coleta' ? 'Coletas' : 'Entregas'} Concluídas`, value: concluidaCount, color: colors.concluida },
    ];

    return { total, chartData };
  };

  const { total: totalColetas, chartData: coletasChartData } = calculateStatusData(allColetas, 'coleta');
  const { total: totalEntregas, chartData: entregasChartData } = calculateStatusData(allColetas, 'entrega');

  const renderChart = (data: any[], total: number, title: string, Icon: React.ElementType) => (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[220px] flex flex-col items-center justify-center">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                cornerRadius={5}
                labelLine={false}
                label={CustomLabel}
              >
                {data.map((entry, index) => (
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
            <Icon className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhuma {title.toLowerCase().includes('coletas') ? 'coleta' : 'entrega'} encontrada para {selectedYear}.</p>
            <p className="text-sm">Agende novas operações!</p>
          </div>
        )}
        {total > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total de {title.toLowerCase().includes('coletas') ? 'Coletas' : 'Entregas'}: <span className="font-semibold text-foreground">{total}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {renderChart(coletasChartData, totalColetas, 'Status das Coletas', Package)}
      {renderChart(entregasChartData, totalEntregas, 'Status das Entregas', Truck)}
    </div>
  );
};