import React from 'react';
import { Package, Truck } from 'lucide-react';
import type { MetricItem } from './GeneralMetricsCards'; // Importando o tipo MetricItem
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Import Table components
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface GeneralMetricCardContentProps {
  metric: MetricItem;
}

export const GeneralMetricCardContent: React.FC<GeneralMetricCardContentProps> = ({ metric }) => {
  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="text-4xl font-bold font-orbitron gradient-text mb-1">
        {metric.value}
      </div>

      {/* Conditional rendering for specific metric types */}
      {metric.id === 'total-operacoes' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-em-transito' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas em trânsito</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas em trânsito</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-pendentes' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas pendentes</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas pendentes</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-concluidas' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas finalizadas</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas finalizadas</span>
          </div>
        </div>
      )}

      {/* NEW: Display item details table for 'total-items-geral' metric */}
      {metric.id === 'total-items-geral' && metric.allItemsDetails && metric.allItemsDetails.length > 0 ? (
        <>
          {metric.description && ( // Keep the description above the table
            <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
          )}
          <div className="mt-2 max-h-[100px] overflow-y-auto overflow-x-auto"> {/* Added overflow-x-auto */}
            <Table className="min-w-full text-xs"> {/* Changed w-full to min-w-full */}
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="h-6 p-1 text-muted-foreground">Qtd</TableHead>
                  <TableHead className="h-6 p-1 text-muted-foreground">Item</TableHead>
                  <TableHead className="h-6 p-1 text-muted-foreground">Descrição</TableHead>
                  <TableHead className="h-6 p-1 text-muted-foreground text-right">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metric.allItemsDetails.slice(0, 5).map((item, index) => ( // Limit to 5 items for brevity
                  <TableRow key={index} className="border-b border-border/20 last:border-b-0">
                    <TableCell className="p-1 font-medium text-foreground">{item.quantity}</TableCell>
                    <TableCell className="p-1 text-foreground">{truncateText(item.name, 8)}</TableCell> {/* Truncate item name */}
                    <TableCell className="p-1 text-foreground">{truncateText(item.description, 15)}</TableCell> {/* Truncate description */}
                    <TableCell className="p-1 text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "px-1 py-0.5 text-[0.6rem]",
                          item.type === 'coleta' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        )}
                      >
                        {item.type === 'coleta' ? 'Coleta' : 'Entrega'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        // Default description for other metrics if no specific content is defined
        metric.description && metric.id !== 'total-operacoes' && metric.id !== 'operacoes-em-transito' && metric.id !== 'operacoes-concluidas' && metric.id !== 'operacoes-pendentes' && (
          <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
        )
      )}
    </>
  );
};