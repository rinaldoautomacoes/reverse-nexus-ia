import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, CheckCircle, Clock } from 'lucide-react';

export const DeliveryReportSummaryCard: React.FC = () => {
  // Dados fictícios para demonstração
  const totalDeliveries = 180;
  const completedDeliveries = 160;
  const inTransitDeliveries = 20;
  const completionRate = (completedDeliveries / totalDeliveries) * 100;

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