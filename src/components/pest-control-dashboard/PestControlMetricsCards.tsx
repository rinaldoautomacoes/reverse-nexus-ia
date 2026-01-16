import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bug,
  Clock,
  CheckCircle,
  ListChecks,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";

type PestControlService = Tables<'pest_control_services'>;

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Bug,
  Clock,
  CheckCircle,
  ListChecks,
  XCircle,
};

interface PestControlMetricsCardsProps {
  selectedYear: string;
}

export const PestControlMetricsCards: React.FC<PestControlMetricsCardsProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: services, isLoading, error } = useQuery<PestControlService[], Error>({
    queryKey: ['pestControlServicesMetrics', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      const { data, error } = await supabase
        .from('pest_control_services')
        .select('*')
        .eq('user_id', user.id)
        .gte('service_date', startDate)
        .lt('service_date', endDate);

      if (error) {
        console.error("Supabase query error in PestControlMetricsCards:", error.message);
        throw new Error(error.message);
      }
      return data;
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

  const calculateMetrics = (servicesData: PestControlService[] | undefined) => {
    const totalServices = servicesData?.length || 0;
    const agendadoCount = servicesData?.filter(s => s.status === 'agendado').length || 0;
    const emAndamentoCount = servicesData?.filter(s => s.status === 'em_andamento').length || 0;
    const concluidoCount = servicesData?.filter(s => s.status === 'concluido').length || 0;
    const canceladoCount = servicesData?.filter(s => s.status === 'cancelado').length || 0;

    return [
      {
        id: 'total-services',
        title: 'Total de Serviços',
        value: totalServices.toString(),
        description: 'Serviços registrados no ano',
        icon_name: 'ListChecks',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
      {
        id: 'services-agendados',
        title: 'Serviços Agendados',
        value: agendadoCount.toString(),
        description: 'Aguardando início',
        icon_name: 'Clock',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
      },
      {
        id: 'services-em-andamento',
        title: 'Em Andamento',
        value: emAndamentoCount.toString(),
        description: 'Serviços sendo executados',
        icon_name: 'Bug',
        color: 'text-neural',
        bg_color: 'bg-neural/10',
      },
      {
        id: 'services-concluidos',
        title: 'Serviços Concluídos',
        value: concluidoCount.toString(),
        description: 'Serviços finalizados',
        icon_name: 'CheckCircle',
        color: 'text-success-green',
        bg_color: 'bg-success-green/10',
      },
      {
        id: 'services-cancelados',
        title: 'Serviços Cancelados',
        value: canceladoCount.toString(),
        description: 'Serviços que não ocorreram',
        icon_name: 'XCircle',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
      },
    ];
  };

  const dashboardMetrics = calculateMetrics(services);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="card-futuristic border-0 animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded mb-1" />
              <div className="h-4 w-48 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {dashboardMetrics.map((metric, index) => {
        const Icon = iconMap[metric.icon_name || ''];
        if (!Icon) {
          console.warn(`Ícone não encontrado para: ${metric.icon_name}`);
          return null;
        }
        return (
          <Card
            key={metric.id}
            className="card-futuristic border-0 animate-slide-up transition-all duration-300 ease-in-out"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bg_color}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-orbitron gradient-text mb-1">
                {metric.value}
              </div>
              {metric.description && (
                <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};