import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfMonth, parseISO, isValid } from "date-fns";
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
import type { Tables } from "@/integrations/supabase/types";

type PestControlService = Tables<'pest_control_services'>;

interface PestControlStatusChartProps {
  selectedYear: string;
}

export const PestControlStatusChart: React.FC<PestControlStatusChartProps> = ({ selectedYear }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: services, isLoading, error } = useQuery<PestControlService[], Error>({
    queryKey: ['pestControlStatusChart', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('pest_control_services')
        .select(`
          service_date,
          status
        `)
        .eq('user_id', user.id)
        .gte('service_date', startDate)
        .lt('service_date', endDate)
        .order('service_date', { ascending: true });
      if (error) {
        console.error("Supabase query error in PestControlStatusChart:", error.message);
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados dos serviços de pragas",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const processServicesData = (servicesData: PestControlService[] | undefined) => {
    const monthlyDataMap = new Map<string, {
      agendado: number;
      em_andamento: number;
      concluido: number;
      cancelado: number;
      total_month: number;
    }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, {
        agendado: 0,
        em_andamento: 0,
        concluido: 0,
        cancelado: 0,
        total_month: 0,
      });
    }

    let totalAgendadoCount = 0;
    let totalEmAndamentoCount = 0;
    let totalConcluidoCount = 0;
    let totalCanceladoCount = 0;
    let totalAllServicesCount = 0;

    servicesData?.forEach(service => {
      if (!service.service_date) {
        console.warn("Skipping service due to missing service_date:", service);
        return;
      }

      const serviceDate = parseISO(service.service_date);
      const timezoneOffsetMinutes = serviceDate.getTimezoneOffset();
      const adjustedDateForLocalMonth = new Date(serviceDate.getTime() - timezoneOffsetMinutes * 60 * 1000);
      const serviceMonthKey = format(startOfMonth(adjustedDateForLocalMonth), 'MMM', { locale: ptBR });

      if (monthlyDataMap.has(serviceMonthKey)) {
        const currentMonthData = monthlyDataMap.get(serviceMonthKey)!;
        switch (service.status) {
          case 'agendado':
            currentMonthData.agendado += 1;
            totalAgendadoCount += 1;
            break;
          case 'em_andamento':
            currentMonthData.em_andamento += 1;
            totalEmAndamentoCount += 1;
            break;
          case 'concluido':
            currentMonthData.concluido += 1;
            totalConcluidoCount += 1;
            break;
          case 'cancelado':
            currentMonthData.cancelado += 1;
            totalCanceladoCount += 1;
            break;
        }
        currentMonthData.total_month += 1;
        totalAllServicesCount += 1;
        monthlyDataMap.set(serviceMonthKey, currentMonthData);
      }
    });

    const chartData = allMonths.map(monthKey => {
      const data = monthlyDataMap.get(monthKey) || { agendado: 0, em_andamento: 0, concluido: 0, cancelado: 0, total_month: 0 };
      return {
        month: monthKey,
        agendado: data.agendado,
        em_andamento: data.em_andamento,
        concluido: data.concluido,
        cancelado: data.cancelado,
        total_month: data.total_month,
      };
    });

    return {
      chartData,
      totalAgendadoCount,
      totalEmAndamentoCount,
      totalConcluidoCount,
      totalCanceladoCount,
      totalAllServicesCount,
    };
  };

  const {
    chartData = [],
    totalAgendadoCount = 0,
    totalEmAndamentoCount = 0,
    totalConcluidoCount = 0,
    totalCanceladoCount = 0,
    totalAllServicesCount = 0,
  } = processServicesData(services);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.month === label);
      if (!data) return null;

      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg text-sm">
          <p className="font-semibold text-primary mb-2">{label}</p>
          <p className="text-muted-foreground">Total de Serviços: <span className="font-bold text-foreground">{data.total_month}</span></p>
          <p className="text-warning-yellow">Agendados: <span className="font-bold">{data.agendado}</span></p>
          <p className="text-neural">Em Andamento: <span className="font-bold">{data.em_andamento}</span></p>
          <p className="text-success-green">Concluídos: <span className="font-bold">{data.concluido}</span></p>
          <p className="text-destructive">Cancelados: <span className="font-bold">{data.cancelado}</span></p>
        </div>
      );
    }
    return null;
  };

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
              Evolução dos Serviços de Pragas
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ano {selectedYear}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-64 relative">
            {totalAllServicesCount > 0 ? (
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
                    <linearGradient id="gradientAgendado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--warning-yellow))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--warning-yellow))" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="gradientEmAndamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--neural))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--neural))" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="gradientConcluido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success-green))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--success-green))" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="gradientCancelado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="agendado"
                    stroke="hsl(var(--warning-yellow))"
                    fill="url(#gradientAgendado)"
                    strokeWidth={2}
                    name="Agendados"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="em_andamento"
                    stroke="hsl(var(--neural))"
                    fill="url(#gradientEmAndamento)"
                    strokeWidth={2}
                    name="Em Andamento"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="concluido"
                    stroke="hsl(var(--success-green))"
                    fill="url(#gradientConcluido)"
                    strokeWidth={2}
                    name="Concluídos"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelado"
                    stroke="hsl(var(--destructive))"
                    fill="url(#gradientCancelado)"
                    strokeWidth={2}
                    name="Cancelados"
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-dark/80 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Bug className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum serviço de controle de pragas disponível para {selectedYear}.</p>
                  <p className="text-sm">Agende serviços para ver as estatísticas.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--warning-yellow))' }} />
              <div>
                <p className="text-sm font-medium">Agendados</p>
                <p className="text-xs text-muted-foreground">{totalAgendadoCount} serviços</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--neural))' }} />
              <div>
                <p className="text-sm font-medium">Em Andamento</p>
                <p className="text-xs text-muted-foreground">{totalEmAndamentoCount} serviços</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success-green))' }} />
              <div>
                <p className="text-sm font-medium">Concluídos</p>
                <p className="text-xs text-muted-foreground">{totalConcluidoCount} serviços</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
              <div>
                <p className="text-sm font-medium">Cancelados</p>
                <p className="text-xs text-muted-foreground">{totalCanceladoCount} serviços</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};