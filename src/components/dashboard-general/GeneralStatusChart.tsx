import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck } from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from 'recharts';
import type { Tables } from "@/integrations/supabase/types";

type Coleta = Tables<'coletas'>;
type Product = Tables<'products'>;

interface GeneralStatusChartProps {
  allColetas: Coleta[];
  productDescriptionsMap: Map<string, string>;
  selectedYear: string;
}

export const GeneralStatusChart: React.FC<GeneralStatusChartProps> = ({ allColetas, productDescriptionsMap, selectedYear }) => {

  const generateItemDescription = (itemCodeQuantities: Map<string, number>) => {
    const descriptions: string[] = [];
    itemCodeQuantities.forEach((quantity, code) => {
      const description = productDescriptionsMap.get(code);
      if (description) {
        descriptions.push(`${quantity}x ${description}`);
      } else {
        descriptions.push(`${quantity}x Item Desconhecido`);
      }
    });

    if (descriptions.length === 0) return "Nenhum item";
    if (descriptions.length === 1) return descriptions[0];
    if (descriptions.length === 2) return `${descriptions[0]} e ${descriptions[1]}`;
    return `${descriptions[0]}, ${descriptions[1]} e outros`;
  };

  const processDataForChart = (data: Coleta[]) => {
    const monthlyDataMap = new Map<string, { 
      coletas_pendente: Map<string, number>; 
      coletas_em_transito: Map<string, number>; // Mantido para tooltip, mas não para as linhas principais do gráfico
      coletas_concluidas: Map<string, number>; 
      total_items_month: number 
    }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { 
        coletas_pendente: new Map(), 
        coletas_em_transito: new Map(), 
        coletas_concluidas: new Map(), 
        total_items_month: 0 
      });
    }

    let totalColetasPendente = 0;
    let totalColetasEmTransito = 0; // Mantido para o resumo abaixo
    let totalColetasConcluidas = 0;
    let totalAllItems = 0;

    data.filter(item => item.type === 'coleta').forEach(item => { // Filtrar apenas para 'coleta'
      if (!item.previsao_coleta || !item.modelo_aparelho) return;

      const itemDate = parseISO(item.previsao_coleta);
      const timezoneOffsetMinutes = itemDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(itemDate.getTime() - timezoneOffsetMinutes * 60 * 1000);
      const monthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const quantity = item.qtd_aparelhos_solicitado || 0;
      const productCode = item.modelo_aparelho;

      if (monthlyDataMap.has(monthKey)) {
        const currentMonthData = monthlyDataMap.get(monthKey)!;
        switch (item.status_coleta) {
          case 'pendente':
            currentMonthData.coletas_pendente.set(productCode, (currentMonthData.coletas_pendente.get(productCode) || 0) + quantity);
            totalColetasPendente += quantity;
            break;
          case 'agendada':
            currentMonthData.coletas_em_transito.set(productCode, (currentMonthData.coletas_em_transito.get(productCode) || 0) + quantity);
            totalColetasEmTransito += quantity;
            break;
          case 'concluida':
            currentMonthData.coletas_concluidas.set(productCode, (currentMonthData.coletas_concluidas.get(productCode) || 0) + quantity);
            totalColetasConcluidas += quantity;
            break;
        }
        currentMonthData.total_items_month += quantity;
        totalAllItems += quantity;
        monthlyDataMap.set(monthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey)!;
      return {
        month: monthKey,
        coletas_pendente: Array.from(data.coletas_pendente.values()).reduce((sum, q) => sum + q, 0),
        coletas_em_transito: Array.from(data.coletas_em_transito.values()).reduce((sum, q) => sum + q, 0),
        coletas_concluidas: Array.from(data.coletas_concluidas.values()).reduce((sum, q) => sum + q, 0),
        total_items_month: data.total_items_month,
        coletas_pendente_items: data.coletas_pendente,
        coletas_em_transito_items: data.coletas_em_transito,
        coletas_concluidas_items: data.coletas_concluidas,
      };
    });

    return { 
      chartData, 
      totalColetasPendente, 
      totalColetasEmTransito, 
      totalColetasConcluidas,
      totalAllItems
    };
  };

  const { 
    chartData, 
    totalColetasPendente, 
    totalColetasEmTransito, 
    totalColetasConcluidas,
    totalAllItems
  } = processDataForChart(allColetas);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.month === label);
      if (!data) return null;

      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Itens: <span className="font-bold text-foreground">{data.total_items_month}</span></p>
          
          {/* Coletas */}
          {(data.coletas_pendente_items.size > 0 || data.coletas_em_transito_items.size > 0 || data.coletas_concluidas_items.size > 0) && (
            <div className="mt-2 border-t border-border/50 pt-2">
              <p className="font-medium text-primary flex items-center gap-1"><Package className="h-3 w-3" /> Coletas:</p>
              {data.coletas_pendente_items.size > 0 && (
                <p className="text-destructive text-xs ml-2">P: {generateItemDescription(data.coletas_pendente_items)}</p>
              )}
              {data.coletas_em_transito_items.size > 0 && (
                <p className="text-warning-yellow text-xs ml-2">ET: {generateItemDescription(data.coletas_em_transito_items)}</p>
              )}
              {data.coletas_concluidas_items.size > 0 && (
                <p className="text-success-green text-xs ml-2">C: {generateItemDescription(data.coletas_concluidas_items)}</p>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-orbitron gradient-text">
              Evolução de Coletas e Itens
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 20,
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
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="gradientColetas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradientPendentes" x1="0" y1="0" x2="0" y2="1"> {/* Novo ID para gradiente de pendentes */}
                    <stop offset="0%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="coletas_concluidas"
                  stroke="hsl(var(--neon-cyan))"
                  fill="url(#gradientColetas)"
                  strokeWidth={2}
                  name="Itens Coletados"
                  // Removed stackId
                />
                <Area
                  type="monotone"
                  dataKey="coletas_pendente" // Alterado para coletas_pendente
                  stroke="hsl(var(--ai-purple))" // Usando ai-purple para pendente
                  fill="url(#gradientPendentes)" // Usando o novo gradiente para pendente
                  strokeWidth={2}
                  name="Itens Pendentes de Coleta" // Novo nome
                  // Removed stackId
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neon-cyan))' }} />
              <div>
                <p className="text-sm font-medium">Total Itens Coletados</p>
                <p className="text-xs text-muted-foreground">{totalColetasConcluidas} itens</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--ai-purple))' }} />
              <div>
                <p className="text-sm font-medium">Total Itens Pendentes de Coleta</p>
                <p className="text-xs text-muted-foreground">{totalColetasPendente} itens</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};