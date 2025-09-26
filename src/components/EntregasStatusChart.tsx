import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Truck, CheckCircle } from "lucide-react";
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
} from 'recharts';

interface EntregasStatusChartProps {
  selectedYear: string;
}

export const EntregasStatusChart: React.FC<EntregasStatusChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: entregas, isLoading, error } = useQuery({
    queryKey: ['entregasStatusChart', user?.id, selectedYear],
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
        .eq('status_coleta', 'concluida') // Apenas entregas concluídas
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
        title: "Erro ao carregar dados das entregas",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const processEntregasData = (entregasData: any[] | undefined) => {
    const monthlyDataMap = new Map<string, { entregues: number }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);
    
    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { entregues: 0 });
    }

    let totalEntregues = 0;

    entregasData?.forEach(entrega => {
      if (!entrega.previsao_coleta) return;

      const entregaDate = parseISO(entrega.previsao_coleta);
      
      const timezoneOffsetMinutes = entregaDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(entregaDate.getTime() - timezoneOffsetMinutes * 60 * 1000);

      const entregaMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });
      const quantity = entrega.qtd_aparelhos_solicitado || 0;

      if (monthlyDataMap.has(entregaMonthKey)) {
        const currentMonthData = monthlyDataMap.get(entregaMonthKey)!;
        currentMonthData.entregues += quantity;
        totalEntregues += quantity;
        monthlyDataMap.set(entregaMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { entregues: 0 };
      return {
        month: monthKey,
        entregues: data.entregues,
      };
    });

    return { chartData, totalEntregues };
  };

  const { chartData, totalEntregues } = processEntregasData(entregas);

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
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              100% Entregues
            </Badge>
            <Badge variant="secondary" className="bg-neural/20 text-neural">
              {totalEntregues} Total
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
                <defs>
                  <linearGradient id="gradientEntregas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success-green))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--success-green))" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="entregues" 
                  stroke="hsl(var(--success-green))"
                  fill="url(#gradientEntregas)" 
                  strokeWidth={2} 
                  name="Entregas Concluídas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success-green))' }} />
              <div>
                <p className="text-sm font-medium">Total de Entregas</p>
                <p className="text-xs text-muted-foreground">{totalEntregues} itens entregues</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <CheckCircle className="w-4 h-4 text-success-green" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">100% Concluídas</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};