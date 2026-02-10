import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';
import { getTotalQuantityOfItems } from '@/lib/utils'; // Import new util

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type

interface DeliveryReportSummaryCardProps {
  selectedYear: string;
}

export const DeliveryReportSummaryCard: React.FC<DeliveryReportSummaryCardProps> = ({ selectedYear }) => {
  const { user } = useAuth();

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['delivery-summary', user?.id, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coletas')
        .select(`*, items(quantity)`)
        .eq('user_id', user?.id)
        .eq('type', 'entrega')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const totalDeliveries = entregas?.length || 0;
  const completedDeliveries = entregas?.filter(e => e.status_coleta === 'concluida').length || 0;
  const inTransitDeliveries = entregas?.filter(e => e.status_coleta === 'agendada').length || 0;
  const completionRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-foreground">Entregas Recentes</h4>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {new Date().getFullYear()}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Truck className="h-4 w-4 text-primary" />
          Total: <span className="font-bold text-foreground">{totalDeliveries}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-success-green" />
          Concluídas: <span className="font-bold text-foreground">{completedDeliveries}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-warning-yellow" />
          Em Trânsito: <span className="font-bold text-foreground">{inTransitDeliveries}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Taxa de Conclusão: {completionRate.toFixed(0)}%</p>
        <Progress value={completionRate} className="h-2 [&>div]:bg-success-green" />
      </div>
    </div>
  );
};