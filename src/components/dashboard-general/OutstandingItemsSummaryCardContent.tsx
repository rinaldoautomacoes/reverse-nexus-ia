import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, Clock, CheckCircle, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';
import { getTotalQuantityOfItems } from '@/lib/utils';

type OutstandingCollectionItem = Tables<'outstanding_collection_items'>;

interface OutstandingItemsSummaryCardContentProps {
  outstandingItems: OutstandingCollectionItem[];
  isLoading: boolean;
  selectedYear: string;
}

export const OutstandingItemsSummaryCardContent: React.FC<OutstandingItemsSummaryCardContentProps> = ({
  outstandingItems,
  isLoading,
  selectedYear,
}) => {
  const totalOutstanding = outstandingItems.length;
  const pendingItemsCount = outstandingItems.filter(item => item.status === 'pendente').length;
  const collectedItemsCount = outstandingItems.filter(item => item.status === 'coletado').length;
  // const completionRate = totalOutstanding > 0 ? (collectedItemsCount / totalOutstanding) * 100 : 0; // Removido

  const totalQuantityPending = outstandingItems.reduce((sum, item) => sum + (item.quantity_pending || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-destructive/20 text-destructive px-2 py-0.5 text-xs"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'coletado':
        return <Badge variant="outline" className="bg-success-green/20 text-success-green px-2 py-0.5 text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Coletado</Badge>;
      default:
        return <Badge variant="outline" className="px-2 py-0.5 text-xs">{status}</Badge>;
    }
  };

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
    <div className="space-y-3"> {/* Removido p-4 aqui */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Itens Pendentes</h4> {/* Alterado para text-lg */}
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {selectedYear}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground"> {/* Ajustado gaps */}
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-primary" />
          Total: <span className="font-bold text-foreground">{totalOutstanding}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-destructive" />
          Pendentes: <span className="font-bold text-foreground">{pendingItemsCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-success-green" />
          Coletados: <span className="font-bold text-foreground">{collectedItemsCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <Tag className="h-4 w-4 text-neural" />
          Qtd. Total: <span className="font-bold text-foreground">{totalQuantityPending}</span>
        </div>
      </div>
      {/* Removido: Barra de progresso */}
      {/* <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Progresso: {completionRate.toFixed(0)}%</p>
        <Progress value={completionRate} className="h-2 [&>div]:bg-success-green" />
      </div> */}
      {outstandingItems.length > 0 && (
        <div className="mt-2 space-y-1 max-h-24 overflow-auto"> {/* Adicionado max-h e overflow-auto */}
          <p className="text-xs font-semibold text-muted-foreground">Próximos itens:</p>
          {outstandingItems.slice(0, 2).map((item, index) => (
            <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-foreground"> {/* Removido truncate e max-w */}
                <span className="font-bold">{item.product_code}</span>
                {item.product_description ? ` - ${item.product_description}` : ''} ({item.quantity_pending})
              </span>
              {getStatusBadge(item.status)}
            </div>
          ))}
          {outstandingItems.length > 2 && (
            <p className="text-xs text-muted-foreground text-center">
              E mais {outstandingItems.length - 2} itens...
            </p>
          )}
        </div>
      )}
    </div>
  );
};