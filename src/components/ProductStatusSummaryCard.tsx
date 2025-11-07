import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Box, Warehouse, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';
import { getTotalQuantityOfItems } from '@/lib/utils'; // Import new util

type Item = Tables<'items'>;

interface ProductStatusSummaryCardProps {
  selectedYear: string;
}

export const ProductStatusSummaryCard: React.FC<ProductStatusSummaryCardProps> = ({ selectedYear }) => {
  const { user } = useAuth();

  const { data: items, isLoading } = useQuery<Item[], Error>({
    queryKey: ['product-summary', user?.id, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalProducts = getTotalQuantityOfItems(items);
  const inStock = getTotalQuantityOfItems(items?.filter(i => i.status === 'concluida'));
  const inCollection = getTotalQuantityOfItems(items?.filter(i => i.status === 'pendente' || i.status === 'agendada')); // 'em_transito' is 'agendada' for coletas
  const stockPercentage = totalProducts > 0 ? (inStock / totalProducts) * 100 : 0;

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