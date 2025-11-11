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
  // Removido truncateText, pois as colunas terão espaço suficiente para o texto completo

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
          <div className="mt-2 max-h-[80px] overflow-y-auto overflow-x-auto"> {/* Ajustado max-h para 80px */}
            <Table className="min-w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="h-6 p-1 text-muted-foreground w-[50px]">Qtd</TableHead>
                  <TableHead className="h-6 p-1 text-muted-foreground min-w-[100px]">Item</TableHead> {/* Ajustado min-w */}
                  <TableHead className="h-6 p-1 text-muted-foreground min-w-[180px]">Descrição</TableHead> {/* Ajustado min-w */}
                  <TableHead className="h-6 p-1 text-muted-foreground text-right w-[80px]">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metric.allItemsDetails.map((item, index) => ( // Removido o slice para mostrar todos os itens
                  <TableRow key={index} className="border-b border-border/20 last:border-b-0">
                    <TableCell className="p-1 font-medium text-foreground">{item.quantity}</TableCell>
                    <TableCell className="p-1 text-foreground whitespace-normal">{item.name}</TableCell> {/* Removido truncateText e adicionado whitespace-normal */}
                    <TableCell className="p-1 text-foreground whitespace-normal">{item.description}</TableCell> {/* Removido truncateText e adicionado whitespace-normal */}
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