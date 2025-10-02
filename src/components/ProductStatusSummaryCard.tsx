import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Box, Warehouse, Truck } from 'lucide-react';

export const ProductStatusSummaryCard: React.FC = () => {
  // Dados fictícios para demonstração
  const totalProducts = 500;
  const inStock = 450;
  const inCollection = 50;
  const stockPercentage = (inStock / totalProducts) * 100;

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-foreground">Status de Produtos</h4>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          Atualizado
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Box className="h-4 w-4 text-primary" />
          Total: <span className="font-bold text-foreground">{totalProducts}</span>
        </div>
        <div className="flex items-center gap-1">
          <Warehouse className="h-4 w-4 text-success-green" />
          Em Estoque: <span className="font-bold text-foreground">{inStock}</span>
        </div>
        <div className="flex items-center gap-1">
          <Truck className="h-4 w-4 text-warning-yellow" />
          Em Coleta: <span className="font-bold text-foreground">{inCollection}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Disponibilidade: {stockPercentage.toFixed(0)}%</p>
        <Progress value={stockPercentage} className="h-2 [&>div]:bg-success-green" />
      </div>
    </div>
  );
};