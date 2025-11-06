import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  ListChecks, 
  Box, 
  TrendingUp 
} from "lucide-react";

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Truck,
  Clock,
  CheckCircle,
  ListChecks,
  Box,
  TrendingUp
};

interface MetricItem {
  id: string;
  title: string;
  value: string;
  description?: string;
  icon_name?: string;
  color?: string;
  bg_color?: string;
  coletasCount?: number;
  entregasCount?: number;
  allItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  pendingItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  inTransitItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[]; // Novo campo
  completedItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[]; // Novo campo
}

interface MetricDetailsDialogProps {
  metric: MetricItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MetricDetailsDialog: React.FC<MetricDetailsDialogProps> = ({ metric, isOpen, onClose }) => {
  console.log("MetricDetailsDialog: metric prop", metric); // Debug log
  console.log("MetricDetailsDialog: isOpen prop", isOpen); // Debug log

  if (!metric) return null;

  const Icon = metric.icon_name ? iconMap[metric.icon_name] : null;

  // Determina qual array de itens deve ser exibido no diálogo
  let itemsToDisplay: MetricItem['allItemsDetails'] | undefined;
  let itemsSectionTitle = '';

  if (metric.id === 'total-items-geral') {
    itemsToDisplay = metric.allItemsDetails;
    itemsSectionTitle = 'Todos os Itens:';
  } else if (metric.id === 'operacoes-pendentes') {
    itemsToDisplay = metric.pendingItemsDetails;
    itemsSectionTitle = 'Itens Pendentes:';
  } else if (metric.id === 'operacoes-em-transito') { // Novo
    itemsToDisplay = metric.inTransitItemsDetails;
    itemsSectionTitle = 'Itens Em Trânsito:';
  } else if (metric.id === 'operacoes-concluidas') { // Novo
    itemsToDisplay = metric.completedItemsDetails;
    itemsSectionTitle = 'Itens Concluídos:';
  }

  const showItemsSection = itemsToDisplay && itemsToDisplay.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            {Icon && <Icon className={cn("h-6 w-6", metric.color)} />}
            Detalhes: {metric.title}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a métrica "{metric.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-foreground">Valor Principal:</p>
            <span className="text-2xl font-bold font-orbitron gradient-text">{metric.value}</span>
          </div>

          {metric.description && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Descrição:</p>
              <p className="text-foreground">{metric.description}</p>
            </div>
          )}

          {metric.id === 'total-operacoes' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Distribuição:</p>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-foreground">{metric.coletasCount} Coletas</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-accent" />
                <span className="text-foreground">{metric.entregasCount} Entregas</span>
              </div>
            </div>
          )}

          {(metric.id === 'operacoes-em-transito' || metric.id === 'operacoes-pendentes' || metric.id === 'operacoes-concluidas') && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Distribuição:</p>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-foreground">{metric.coletasCount} Coletas {metric.title.toLowerCase().replace('operações ', '')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-accent" />
                <span className="text-foreground">{metric.entregasCount} Entregas {metric.title.toLowerCase().replace('operações ', '')}</span>
              </div>
            </div>
          )}

          {showItemsSection && (
            <div className="space-y-2 border-t border-border/50 pt-4">
              <p className="text-sm font-semibold text-muted-foreground">
                {itemsSectionTitle}
              </p>
              <div className="grid grid-cols-5 text-xs font-semibold text-muted-foreground mb-2">
                <div className="col-span-1">Qtd</div>
                <div className="col-span-2">Item</div>
                <div className="col-span-1">Descrição</div>
                <div className="col-span-1 text-right">Tipo</div>
              </div>
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-1">
                  {itemsToDisplay?.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-5 text-xs text-foreground">
                      <div className="col-span-1">{item.quantity}</div>
                      <div className="col-span-2 truncate" title={item.name}>{item.name}</div>
                      <div className="col-span-1 truncate" title={item.description}>{item.description}</div>
                      <div className="col-span-1 text-right">
                        <Badge variant="secondary" className={cn(
                          "px-1 py-0.5 text-[0.6rem]",
                          item.type === 'coleta' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        )}>
                          {item.type === 'coleta' ? 'Coleta' : 'Entrega'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};