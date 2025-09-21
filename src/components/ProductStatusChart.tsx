import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, Clock, Truck, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
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
  CartesianGrid,
  Tooltip,
  Area,
  Legend,
  LabelList,
} from 'recharts';

type Coleta = Tables<'coletas'>;

interface ProductStatusChartProps {
  selectedYear: string;
}

export const ProductStatusChart: React.FC<ProductStatusChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: coletas, isLoading, error } = useQuery<Coleta[], Error>({
    queryKey: ['productStatusChart', user?.id, selectedYear],
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
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados das coletas para o gráfico de produtos",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const processColetasData = (coletasData: Coleta[] | undefined) => {
    const monthlyDataMap = new Map<string, { pendente: number; em_transito: number; entregues: number; total_month: number; pendente_plus_em_transito: number }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);
    
    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { pendente: 0, em_transito: 0, entregues: 0, total_month: 0, pendente_plus_em_transito: 0 });
    }

    let totalPendente = 0;
    let totalEmTransito = 0;
    let totalEntregues = 0;

    coletasData?.forEach(coleta => {
      if (!coleta.previsao_coleta) return;

      const coletaDate = parseISO(coleta.previsao_atleta);
      
      const timezoneOffsetMinutes = coletaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(coletaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);

      const coletaMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const quantity = coleta.qtd_aparelhos_solicitado || 0;

      if (monthlyDataMap.has(coletaMonthKey)) {
        const currentMonthData = monthlyDataMap.get(coletaMonthKey)!;
        switch (coleta.status_coleta) {
          case 'pendente':
            currentMonthData.pendente += quantity;
            totalPendente += quantity;
            break;
          case 'agendada':
            currentMonthData.em_transito += quantity;
            totalEmTransito += quantity;
            break;
          case 'concluida':
            currentMonthData.entregues += quantity;
            totalEntregues += quantity;
            break;
        }
        monthlyDataMap.set(coletaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { pendente: 0, em_transito: 0, entregues: 0 };
      const total_month = data.pendente + data.em_transito + data.entregues;
      const pendente_plus_em_transito = data.pendente + data.em_transito;
      return {
        month: monthKey,
        total_month: total_month,
        pendente_plus_em_transito: pendente_plus_em_transito,
      };
    });

    const totalItems = totalPendente + totalEmTransito + totalEntregues;

    return { chartData, totalItems, totalPendente, totalEmTransito, totalEntregues };
  };

  const { chartData, totalItems, totalPendente, totalEmTransito, totalEntregues } = processColetasData(coletas);

  const AREA_COLORS = {
    total_items_overall: 'hsl(var(--neon-cyan))',
    items_in_process: 'hsl(var(--ai-purple))',
  };

  const percentageEntregues = totalItems > 0 ? ((totalEntregues / totalItems) * 100).toFixed(1) : '0.0';
  const changePercentage = '+10%'; 

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
              Status dos Produtos
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              {changePercentage}
            </Badge>
            <Badge variant="secondary" className="bg-neural/20 text-neural">
              {percentageEntregues}% Entregues
            </Badge>
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
                  right: 0, // Ajustado para 0
                  left: 0,  // Ajustado para 0
                  bottom: 0, // Ajustado para 0
                }}
              >
                {/* Removido CartesianGrid */}
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} /> {/* Eixo X sem linha */}
                <YAxis stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} width={0} hide={true} /> {/* Eixo Y oculto */}
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
                        {value === 'total_month' ? 'Total de Itens' : 'Itens em Processo'}
                      </span>
                    </span>
                  )}
                />
                <defs>
                  <linearGradient id="gradientTotalItems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientItemsInProcess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--ai-purple))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--ai-purple))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area dataKey="total_month" stroke={AREA_COLORS.total_items_overall} fill="url(#gradientTotalItems)" strokeWidth={2} name="Total de Itens">
                  <LabelList dataKey="total_month" position="top" fill="#fff" formatter={(value: number) => value > 0 ? value : ''} />
                </Area>
                <Area dataKey="pendente_plus_em_transito" stroke={AREA_COLORS.items_in_process} fill="url(#gradientItemsInProcess)" strokeWidth={2} name="Itens em Processo">
                  <LabelList dataKey="pendente_plus_em_transito" position="top" fill="#fff" formatter={(value: number) => value > 0 ? value : ''} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: AREA_COLORS.items_in_process }} />
              <div>
                <p className="text-sm font-medium">Itens em Processo</p>
                <p className="text-xs text-muted-foreground">{totalPendente + totalEmTransito} itens aguardando/a caminho</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: AREA_COLORS.total_items_overall }} />
              <div>
                <p className="text-sm font-medium">Total Geral</p>
                <p className="text-xs text-muted-foreground">{totalItems} itens no total</p>
              </div>
            </div>
            
            {/* Mantendo os cards de detalhe para Pendentes e Entregues, se ainda forem relevantes */}
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
                <p className="text-sm font-medium">Entregues</p>
                <p className="text-xs text-muted-foreground">{totalEntregues} itens finalizados</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};