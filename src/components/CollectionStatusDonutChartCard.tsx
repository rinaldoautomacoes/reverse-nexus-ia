import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Package } from "lucide-react";
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = {
  pendente: 'hsl(var(--destructive))', // ai-purple
  agendada: 'hsl(var(--neural-blue))', // neural-blue
  concluida: 'hsl(var(--neon-cyan))',    // neon-cyan
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
    <text x={x} y={y} fill="hsl(0 0% 0%)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const CollectionStatusDonutChartCard: React.FC = () => {
  const selectedYear = '2025'; // Ano fictício para o dashboard

  // Dados fictícios para o gráfico de rosca
  const dummyChartData = [
    { name: 'Coletas Pendentes', value: 1, color: COLORS.pendente },
    { name: 'Coletas Em Trânsito', value: 1, color: COLORS.agendada },
    { name: 'Coletas Concluídas', value: 1, color: COLORS.concluida },
  ];
  const totalCollections = dummyChartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="p-4 space-y-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
          <Package className="h-5 w-5 text-primary" />
          Status das Coletas
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[450px] p-0 flex flex-col items-center justify-center">
        {totalCollections > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dummyChartData}
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
                {dummyChartData.map((entry, index) => (
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
            <p>Nenhuma coleta encontrada para o ano de {selectedYear}.</p>
            <p className="text-sm">Agende novas coletas para ver as estatísticas!</p>
          </div>
        )}
        {totalCollections > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total de Coletas: <span className="font-semibold text-foreground">{totalCollections}</span></p>
          </div>
        )}
      </CardContent>
    </div>
  );
};