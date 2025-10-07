import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Truck, Clock, AlertTriangle, CheckCircle } from "lucide-react"; // Adicionado CheckCircle
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Legend, // Adicionado Legend para mostrar todos os itens
} from 'recharts';

interface EntregasAtivasStatusChartProps {
  selectedYear: string;
}

export const EntregasAtivasStatusChart: React.FC<EntregasAtivasStatusChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: entregas, isLoading, error } = useQuery({
    queryKey: ['entregasAtivasStatusChart', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('coletas')
        .select(`
          created_at,
          qtd_aparelhos_solicitado,
          status_coleta,
          previsao_coleta
        `)
        .eq('user_id', user.id)
        .eq('type', 'entrega') // FILTRAR POR TIPO 'entrega'
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados das entregas ativas",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const processEntregasData = (entregasData: any[] | undefined) => {
    const monthlyDataMap = new Map<string, { pendente: number; em_transito: number; entregues: number; total_all: number }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { pendente: 0, em_transito: 0, entregues: 0, total_all: 0 });
    }

    let totalPendente = 0;
    let totalEmTransito = 0;
    let totalEntregues = 0;
    let totalAll = 0;

    entregasData?.forEach(entrega => {
      if (!entrega.previsao_coleta) return;

      const entregaDate = parseISO(entrega.previsao_coleta);

      const timezoneOffsetMinutes = entregaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(entregaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);

      const entregaMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const quantity = entrega.qtd_aparelhos_solicitado || 0;

      if (monthlyDataMap.has(entregaMonthKey)) {
        const currentMonthData = monthlyDataMap.get(entregaMonthKey)!;
        switch (entrega.status_coleta) {
          case 'pendente':
            currentMonthData.pendente += quantity;
            totalPendente += quantity;
            break;
          case 'agendada':
            currentMonthData.em_transito += quantity;
            totalEmTransito += quantity;
            break;
          case 'concluida': // Incluído status concluída
            currentMonthData.entregues += quantity;
            totalEntregues += quantity;
            break;
        }
        currentMonthData.total_all += quantity;
        totalAll += quantity;
        monthlyDataMap.set(entregaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { pendente: 0, em_transito: 0, entregues: 0, total_all: 0 };
      return {
        month: monthKey,
        pendente: data.pendente,
        em_transito: data.em_transito,
        entregues: data.entregues, // Adicionado entregues
        total_all: data.total_all,
      };
    });

    return { chartData, totalPendente, totalEmTransito, totalEntregues, totalAll };
  };

  const { chartData, totalPendente, totalEmTransito, totalEntregues, totalAll } = processEntregasData(entregas);

  const percentageEmTransito = totalAll > 0 ? ((totalEmTransito / totalAll) * 100).toFixed(1) : '0.0';
  const percentagePendente = totalAll > 0 ? ((totalPendente / totalAll) * 100).toFixed(1) : '0.0';
  const percentageEntregues = totalAll > 0 ? ((totalEntregues / totalAll) * 100).toFixed(1) : '0.0';


  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-orbitron gradient-text">
              Status das Entregas
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
          {/* Removido o bloco de Badges */}
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
                      <span className="font-semibold text-foreground">
                        {value === 'pendente' ? 'Pendentes' : value === 'em_transito' ? 'Em Trânsito' : 'Concluídas'}
                      </span>
                    </span>
                  )}
                />
                <defs>
                  <linearGradient id="gradientEmTransito" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warning-yellow))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--warning-yellow))" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradientPendente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradientEntregues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success-green))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--success-green))" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="em_transito"
                  stroke="hsl(var(--warning-yellow))"
                  fill="url(#gradientEmTransito)"
                  strokeWidth={2}
                  name="Em Trânsito"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="pendente"
                  stroke="hsl(var(--destructive))"
                  fill="url(#gradientPendente)"
                  strokeWidth={2}
                  name="Pendentes"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="entregues"
                  stroke="hsl(var(--success-green))"
                  fill="url(#gradientEntregues)"
                  strokeWidth={2}
                  name="Concluídas"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--warning-yellow))' }} />
              <div>
                <p className="text-sm font-medium">Em Trânsito</p>
                <p className="text-xs text-muted-foreground">{totalEmTransito} itens a caminho</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-xs text-muted-foreground">{totalPendente} itens aguardando</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success-green))' }} />
              <div>
                <p className="text-sm font-medium">Concluídas</p>
                <p className="text-xs text-muted-foreground">{totalEntregues} itens entregues</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};