import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';

interface MonthlyData {
  month: string;
  totalColetas: number;
  totalItems: number;
}

interface PerformanceChartProps {
  data: MonthlyData[];
  selectedYear: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, selectedYear }) => {
  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance Mensal ({selectedYear})
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span className="text-sm flex items-center gap-2">
                  <span className="font-semibold text-foreground">{value === 'totalColetas' ? 'Total de Coletas' : 'Total de Itens'}</span>
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="totalColetas"
              stroke="hsl(var(--neon-cyan))"
              fill="url(#gradientColetas)"
              strokeWidth={2}
              name="Total de Coletas"
            />
            <Area
              type="monotone"
              dataKey="totalItems"
              stroke="hsl(var(--ai-purple))"
              fill="url(#gradientItems)"
              strokeWidth={2}
              name="Total de Itens"
            />
            <defs>
              <linearGradient id="gradientColetas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientItems" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-dark/80 rounded-lg">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum dado de performance disponível para {selectedYear}.</p>
              <p className="text-sm">Agende coletas para ver as estatísticas.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};