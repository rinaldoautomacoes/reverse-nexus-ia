import React from 'react';
import { Package, Truck, ChevronDown } from 'lucide-react'; // Adicionado ChevronDown para o ícone do acordeão
import type { MetricItem } from './GeneralMetricsCards';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Importado Accordion

interface GeneralMetricCardContentProps {
  metric: MetricItem;
}

export const GeneralMetricCardContent: React.FC<GeneralMetricCardContentProps> = ({ metric }) => {
  // Função auxiliar para renderizar a seção de itens
  const renderItemsSection = (
    items: MetricItem['allItemsDetails'],
    title: string,
    accordionValue: string
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <Accordion type="single" collapsible className="w-full mt-2">
        <AccordionItem value={accordionValue} className="border-b-0">
          <AccordionTrigger className="py-2 text-xs font-semibold text-muted-foreground hover:no-underline hover:text-foreground transition-colors justify-center">
            {title}
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="max-h-[80px] overflow-y-auto overflow-x-auto border rounded-md">
              <Table className="min-w-full text-xs">
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-b border-border/50">
                    <TableHead className="h-6 p-1 text-muted-foreground w-[30px]">Qtd</TableHead>
                    <TableHead className="h-6 p-1 text-muted-foreground w-[100px]">Item</TableHead>
                    <TableHead className="h-6 p-1 text-muted-foreground w-auto">Descrição</TableHead>
                    <TableHead className="h-6 p-1 text-muted-foreground text-right w-[50px]">Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="border-b border-border/20 last:border-b-0">
                      <TableCell className="p-1 font-medium text-muted-foreground">{item.quantity}</TableCell>
                      <TableCell className="p-1 text-muted-foreground text-wrap overflow-hidden text-ellipsis" title={item.name}>{item.name}</TableCell>
                      <TableCell className="p-1 text-muted-foreground text-wrap overflow-hidden text-ellipsis" title={item.description}>{item.description}</TableCell>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  return (
    <>
      <div className="text-4xl font-bold font-orbitron gradient-text mb-1">
        {metric.value}
      </div>

      {/* Exibir o somatório de itens se disponível e não for o card de 'Total de Itens (Geral)' */}
      {metric.totalItemsSum !== undefined && metric.id !== 'total-items-geral' && (
        <p className="text-sm text-muted-foreground mt-1">
          Total de Itens: <span className="font-bold text-foreground">{metric.totalItemsSum}</span>
        </p>
      )}

      {/* Conditional rendering for specific metric types */}
      {metric.id === 'total-operacoes' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1 justify-center">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-em-transito' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1 justify-center">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas em trânsito</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas em trânsito</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-pendentes' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1 justify-center">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas pendentes</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas pendentes</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-concluidas' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1 justify-center">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas finalizadas</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas finalizadas</span>
          </div>
        </div>
      )}

      {/* Seção de itens para 'Total de Itens (Geral)' */}
      {renderItemsSection(
        metric.allItemsDetails,
        metric.description || "Ver Detalhes dos Itens",
        "total-items-details"
      )}

      {/* Seção de itens para 'Operações Pendentes' */}
      {renderItemsSection(
        metric.pendingItemsDetails,
        "Ver Detalhes dos Itens Pendentes",
        "pending-items-details"
      )}

      {/* Seção de itens para 'Operações Em Trânsito' */}
      {renderItemsSection(
        metric.inTransitItemsDetails,
        "Ver Detalhes dos Itens Em Trânsito",
        "in-transit-items-details"
      )}

      {/* Seção de itens para 'Operações Concluídas' */}
      {renderItemsSection(
        metric.completedItemsDetails,
        "Ver Detalhes dos Itens Concluídos",
        "completed-items-details"
      )}
    </>
  );
};