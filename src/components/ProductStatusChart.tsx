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
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
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
    queryKey: ['productStatusChart', user?.id, selectedYear], // Adicionado selectedYear ao queryKey
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
        .gte('previsao_coleta', startDate) // Filtrar por previsao_coleta dentro do ano selecionado
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
    const monthlyDataMap = new Map<string, { pendente: number; em_transito: number; entregues: number }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);
    
    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { pendente: 0, em_transito: 0, entregues: 0 });
    }

    let totalPendente = 0;
    let totalEmTransito = 0;
    let totalEntregues = 0;

    coletasData?.forEach(coleta => {
      if (!coleta.previsao_coleta) return;

      const coletaDate = parseISO(coleta.previsao_coleta);
      
      const timezoneOffsetMinutes = coletaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(coletaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);

      const coletaMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const quantity = coleta.qtd_aparelhos_solicitado || 0;

      let effectiveStatus: 'pendente' | 'agendada' | 'concluida' = 'pendente';

      switch (coleta.status_coleta) {
        case 'pendente':
          effectiveStatus = 'pendente';
          break;
        case 'agendada':
          effectiveStatus = 'agendada'; // Mapeado para 'em_transito' na exibição
          break;
        case 'concluida':
          effectiveStatus = 'concluida'; // Mapeado para 'entregues' na exibição
          break;
        default:
          effectiveStatus = 'pendente';
      }

      if (monthlyDataMap.has(coletaMonthKey)) {
        const currentMonthData = monthlyDataMap.get(coletaMonthKey)!;
        if (effectiveStatus === 'pendente') {
          currentMonthData.pendente += quantity;
          totalPendente += quantity;
        } else if (effectiveStatus === 'agendada') {
          currentMonthData.em_transito += quantity;
          totalEmTransito += quantity;
        } else if (effectiveStatus === 'concluida') {
          currentMonthData.entregues += quantity;
          totalEntregues += quantity;
        }
        monthlyDataMap.set(coletaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { pendente: 0, em_transito: 0, entregues: 0 };
      return {
        month: monthKey,
        pendente: data.pendente,
        em_transito: data.em_transito,
        entregues: data.entregues,
        total_month: data.pendente + data.em_transito + data.entregues,
      };
    });

    const totalItems = totalPendente + totalEmTransito + totalEntregues;

    return { chartData, totalItems, totalPendente, totalEmTransito, totalEntregues };
  };

  const { chartData, totalItems, totalPendente, totalEmTransito, totalEntregues } = processColetasData(coletas);

  const BAR_COLORS = {
    pendente: 'hsl(var(--destructive))',
    em_transito: 'hsl(var(--warning-yellow))',
    entregues: 'hsl(var(--success-green))',
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
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
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
                      <span className="font-semibold text-foreground">
                        {value === 'pendente' ? 'Pendentes' : value === 'em_transito' ? 'Em Trânsito' : 'Entregues'}
                      </span>
                    </span>
                  )}
                />
                <Bar dataKey="pendente" stackId="a" fill={BAR_COLORS.pendente}>
                  <LabelList dataKey="pendente" position="inside" fill="#fff" formatter={(value: number) => value > 0 ? value : ''} />
                </Bar>
                <Bar dataKey="em_transito" stackId="a" fill={BAR_COLORS.em_transito}>
                  <LabelList dataKey="em_transito" position="inside" fill="#fff" formatter={(value: number) => value > 0 ? value : ''} />
                </Bar>
                <Bar dataKey="entregues" stackId="a" fill={BAR_COLORS.entregues}>
                  <LabelList dataKey="entregues" position="inside" fill="#fff" formatter={(value: number) => value > 0 ? value : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: BAR_COLORS.pendente }} />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-xs text-muted-foreground">{totalPendente} itens aguardando</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: BAR_COLORS.em_transito }} />
              <div>
                <p className="text-sm font-medium">Em Trânsito</p>
                <p className="text-xs text-muted-foreground">{totalEmTransito} itens a caminho</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: BAR_COLORS.entregues }} />
              <div>
                <p className="text-sm font-medium">Entregues</p>
                <p className="text-xs text-muted-foreground">{totalEntregues} itens finalizados</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-gradient-primary rounded" />
              <div>
                <p className="text-sm font-medium">Total Geral</p>
                <p className="text-xs text-muted-foreground">{totalItems} itens no total</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};