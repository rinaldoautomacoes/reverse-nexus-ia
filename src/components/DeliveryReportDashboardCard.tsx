import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, TrendingUp, Package, CheckCircle, Truck } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Legend,
} from 'recharts';
import { format, startOfMonth } from 'date-fns'; // Corrigido aqui
import { ptBR } from 'date-fns/locale';

// Dados fictícios para o gráfico de performance
const dummyPerformanceData = [
  { month: format(startOfMonth(new Date(2025, 0)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 1)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 2)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 3)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 4)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 5)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 6)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 7)), 'MMM', { locale: ptBR }), totalEntregas: 2, totalItems: 3 }, // Agosto
  { month: format(startOfMonth(new Date(2025, 8)), 'MMM', { locale: ptBR }), totalEntregas: 5, totalItems: 8 }, // Setembro
  { month: format(startOfMonth(new Date(2025, 9)), 'MMM', { locale: ptBR }), totalEntregas: 3, totalItems: 4 }, // Outubro
  { month: format(startOfMonth(new Date(2025, 10)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
  { month: format(startOfMonth(new Date(2025, 11)), 'MMM', { locale: ptBR }), totalEntregas: 0, totalItems: 0 },
];

export const DeliveryReportDashboardCard: React.FC = () => {
  const selectedYear = '2025'; // Ano fictício para o dashboard

  // Dados fictícios para as métricas
  const dashboardMetrics = [
    { titulo: "Entregas Finalizadas", valor: "1", unidade: "", variacao: "+12%", icon: CheckCircle, color: 'text-success-green', bgColor: 'bg-success-green/10' },
    { titulo: "Itens Entregues", valor: "1", unidade: "itens", variacao: "+15%", icon: Package, color: 'text-primary', bgColor: 'bg-primary/10' },
    { titulo: "Total Geral Itens", valor: "1", unidade: "itens", variacao: "+10%", icon: Package, color: 'text-neural', bgColor: 'bg-neural/10' },
    { titulo: "Eficiência IA", valor: "94.2%", unidade: "", variacao: "+8%", icon: TrendingUp, color: 'text-accent', bgColor: 'bg-accent/10' },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold font-orbitron gradient-text mb-2">Relatório de Entregas</h3>
        {/* <p className="text-sm text-muted-foreground">Análises inteligentes e insights automatizados para suas entregas</p> */}
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((metrica, index) => {
          const Icon = metrica.icon;
          return (
            <Card key={index} className="card-futuristic border-0">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* <p className="text-sm text-muted-foreground">{metrica.titulo}</p> */} {/* Removido */}
                  <div className="flex items-end justify-between">
                    <div>
                      {/* <p className="text-2xl font-bold">{metrica.valor}</p> */} {/* Removido */}
                      {/* <p className="text-xs text-muted-foreground">{metrica.unidade}</p> */} {/* Removido */}
                    </div>
                    {/* <Badge 
                      variant="secondary" 
                      className={`${metrica.bgColor} ${metrica.color}`}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {metrica.variacao}
                    </Badge> */} {/* Removido */}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico Principal */}
      <Card className="card-futuristic border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-orbitron gradient-text text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Mensal ({selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dummyPerformanceData}
              margin={{
                top: 10,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                domain={[0, 'dataMax']} 
                tickFormatter={(value) => value.toFixed(0)} 
              />
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
                  <span className="text-xs flex items-center gap-1">
                    <span className="font-semibold text-foreground">{value === 'totalEntregas' ? 'Total de Entregas' : 'Total de Itens'}</span>
                  </span>
                )}
              />
              <defs>
                <linearGradient id="gradientEntregas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientItems" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="totalEntregas"
                stroke="hsl(var(--neon-cyan))"
                fill="url(#gradientEntregas)"
                strokeWidth={2}
                name="Total de Entregas"
              />
              <Area
                type="monotone"
                dataKey="totalItems"
                stroke="hsl(var(--ai-purple))"
                fill="url(#gradientItems)"
                strokeWidth={2}
                name="Total de Itens"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};