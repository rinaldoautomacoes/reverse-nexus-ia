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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Importar componentes de tabela

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
              {/* Substituindo ScrollArea e div por um div com overflow-auto e o componente Table */}
              <div className="h-48 border rounded-md overflow-auto">
                <Table className="min-w-full"> {/* min-w-full para forçar a rolagem horizontal se o conteúdo for muito largo */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Qtd</TableHead>
                      <TableHead className="min-w-[150px]">Item</TableHead>
                      <TableHead className="min-w-[200px]">Descrição</TableHead>
                      <TableHead className="w-[80px] text-right">Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsToDisplay?.map((item, itemIndex) => (
                      <TableRow key={itemIndex}>
                        <TableCell className="font-medium">{item.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.name}</TableCell> {/* Adicionado whitespace-nowrap */}
                        <TableCell className="whitespace-nowrap">{item.description}</TableCell> {/* Adicionado whitespace-nowrap */}
                        <TableCell className="text-right">
                          <Badge variant="secondary" className={cn(
                            "px-1 py-0.5 text-[0.6rem]",
                            item.type === 'coleta' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                          )}>
                            {item.type === 'coleta' ? 'Coleta' : 'Entrega'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};