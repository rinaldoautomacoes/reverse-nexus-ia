import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, CheckCircle, Clock } from 'lucide-react';

export const CollectionReportSummaryCard: React.FC = () => {
  // Dados fictícios para demonstração
  const totalCollections = 150;
  const completedCollections = 120;
  const pendingCollections = 30;
  const completionRate = (completedCollections / totalCollections) * 100;

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-foreground">Coletas Recentes</h4>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {new Date().getFullYear()}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-primary" />
          Total: <span className="font-bold text-foreground">{totalCollections}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-success-green" />
          Concluídas: <span className="font-bold text-foreground">{completedCollections}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-destructive" />
          Pendentes: <span className="font-bold text-foreground">{pendingCollections}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Taxa de Conclusão: {completionRate.toFixed(0)}%</p>
        <Progress value={completionRate} className="h-2 [&>div]:bg-success-green" />
      </div>
    </div>
  );
};