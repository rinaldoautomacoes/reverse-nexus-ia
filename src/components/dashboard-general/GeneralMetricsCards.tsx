import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  ListChecks, // Icon for 'Total de Coletas'
  Box, // Icon for 'Total de Produtos'
  TrendingUp // General trend icon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { getTotalQuantityOfItems, cn } from "@/lib/utils"; // Import new util
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { Badge } from "@/components/ui/badge"; // Import Badge
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { SortableCard } from '@/components/SortableCard'; // Import the new SortableCard
import { MetricDetailsDialog } from './MetricDetailsDialog'; // Import the new dialog component

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type

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
  pendingItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[]; // Novo campo para itens pendentes
}

interface GeneralMetricsCardsProps {
  allColetas: Coleta[];
  selectedYear: string;
}

export const GeneralMetricsCards: React.FC<GeneralMetricsCardsProps> = ({ allColetas, selectedYear }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const calculateMetrics = (data: Coleta[]) => {
    console.log("Calculating general metrics with allColetas data:", data); // Added log
    const coletas = data.filter(item => item.type === 'coleta');
    const entregas = data.filter(item => item.type === 'entrega');

    const totalColetas = coletas.length;
    const totalEntregas = entregas.length;
    const totalOperacoes = totalColetas + totalEntregas;

    const totalColetaItems = coletas.reduce((sum, c) => sum + getTotalQuantityOfItems(c.items), 0);
    const totalEntregaItems = entregas.reduce((sum, e) => sum + getTotalQuantityOfItems(e.items), 0); // Corrected typo here
    const totalItemsGeral = totalColetaItems + totalEntregaItems; // Corrected typo here

    const coletasConcluidas = coletas.filter(c => c.status_coleta === 'concluida').length;
    const entregasConcluidas = entregas.filter(e => e.status_coleta === 'concluida').length;
    const operacoesConcluidas = coletasConcluidas + entregasConcluidas;

    const coletasEmTransito = coletas.filter(c => c.status_coleta === 'agendada').length;
    const entregasEmTransito = entregas.filter(e => e.status_coleta === 'agendada').length;
    const operacoesEmTransito = coletasEmTransito + entregasEmTransito;

    const coletasPendente = coletas.filter(c => c.status_coleta === 'pendente').length;
    const entregasPendente = entregas.filter(e => e.status_coleta === 'pendente').length;
    const operacoesPendente = coletasPendente + entregasPendente;

    let itemsDescription = '';
    if (totalColetaItems > 0 && totalEntregaItems > 0) {
      itemsDescription = `${totalColetaItems} itens de coleta e ${totalEntregaItems} itens de entrega em ${selectedYear}`;
    } else if (totalColetaItems > 0) {
      itemsDescription = `${totalColetaItems} itens de coleta em ${selectedYear}`;
    } else if (totalEntregaItems > 0) {
      itemsDescription = `${totalEntregaItems} itens de entrega em ${selectedYear}`;
    } else {
      itemsDescription = `Nenhum item em ${selectedYear}`;
    }

    const allItemsDetails: {
      quantity: number;
      name: string;
      description: string;
      type: 'coleta' | 'entrega';
    }[] = [];

    const pendingItemsDetails: {
      quantity: number;
      name: string;
      description: string;
      type: 'coleta' | 'entrega';
    }[] = [];

    coletas.forEach(c => {
      c.items?.forEach(item => {
        if (item.quantity && item.name) {
          allItemsDetails.push({
            quantity: item.quantity,
            name: item.name,
            description: item.description || 'N/A',
            type: 'coleta',
          });
          if (c.status_coleta === 'pendente') {
            pendingItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: 'coleta',
            });
          }
        }
      });
    });

    entregas.forEach(e => {
      e.items?.forEach(item => {
        if (item.quantity && item.name) {
          allItemsDetails.push({
            quantity: item.quantity,
            name: item.name,
            description: item.description || 'N/A',
            type: 'entrega',
          });
          if (e.status_coleta === 'pendente') {
            pendingItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: 'entrega',
            });
          }
        }
      });
    });

    return [
      {
        id: 'total-operacoes',
        title: 'Total de Operações',
        value: totalOperacoes.toString(),
        coletasCount: totalColetas,
        entregasCount: totalEntregas,
        icon_name: 'ListChecks',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
      {
        id: 'total-items-geral',
        title: 'Total de Itens (Geral)',
        value: totalItemsGeral.toString(),
        description: itemsDescription,
        icon_name: 'Box',
        color: 'text-neural',
        bg_color: 'bg-neural/10',
        allItemsDetails: allItemsDetails,
      },
      {
        id: 'operacoes-em-transito',
        title: 'Operações Em Trânsito',
        value: operacoesEmTransito.toString(),
        coletasCount: coletasEmTransito,
        entregasCount: entregasEmTransito,
        icon_name: 'Truck',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
      },
      {
        id: 'operacoes-pendentes',
        title: 'Operações Pendentes',
        value: operacoesPendente.toString(),
        coletasCount: coletasPendente,
        entregasCount: entregasPendente,
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
        pendingItemsDetails: pendingItemsDetails, // Adicionado aqui
      },
      {
        id: 'operacoes-concluidas',
        title: 'Operações Concluídas',
        value: operacoesConcluidas.toString(),
        coletasCount: coletasConcluidas,
        entregasCount: entregasConcluidas,
        icon_name: 'CheckCircle',
        color: 'text-success-green',
        bg_color: 'bg-success-green/10',
      },
    ];
  };

  const initialMetrics = calculateMetrics(allColetas);
  const [metrics, setMetrics] = useState<MetricItem[]>(initialMetrics);

  // Load order from local storage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('general_dashboard_card_order');
    if (savedOrder) {
      const orderedIds = JSON.parse(savedOrder);
      const reorderedMetrics = orderedIds
        .map((id: string) => initialMetrics.find(metric => metric.id === id))
        .filter(Boolean) as MetricItem[];
      
      // Add any new metrics that weren't in the saved order
      const newMetrics = initialMetrics.filter(metric => !orderedIds.includes(metric.id));
      setMetrics([...reorderedMetrics, ...newMetrics]);
    } else {
      setMetrics(initialMetrics);
    }
  }, [allColetas, selectedYear]); // Recalculate if data or year changes

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setMetrics((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('general_dashboard_card_order', JSON.stringify(newOrder.map(item => item.id)));
        return newOrder;
      });
    }
  };

  const handleCardClick = (metric: MetricItem) => {
    console.log("Card clicked:", metric.id); // Log para verificar se o clique está funcionando
    setSelectedMetric(metric);
    setIsDetailsDialogOpen(true);
  };

  return (
    <>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={metrics.map(m => m.id)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {metrics.map((metric, index) => {
              const Icon = iconMap[metric.icon_name || ''];
              if (!Icon) {
                console.warn(`Ícone não encontrado para: ${metric.icon_name}`);
                return null;
              }
              return (
                <SortableCard
                  key={metric.id}
                  id={metric.id}
                  title={metric.title}
                  icon={Icon}
                  iconColorClass={metric.color}
                  iconBgColorClass={metric.bg_color}
                  delay={index * 100}
                  onDetailsClick={() => handleCardClick(metric)} // Usando a nova prop
                >
                  <div className="text-3xl font-bold font-orbitron gradient-text mb-1">
                    {metric.value}
                  </div>
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
                        <span>{metric.coletasCount} Coletas em andamento</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3 text-accent" />
                        <span>{metric.entregasCount} Entregas em andamento</span>
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
                      {/* REMOVIDO: Detalhes de itens pendentes diretamente no card */}
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
                  {metric.description && metric.id !== 'total-operacoes' && metric.id !== 'operacoes-em-transito' && metric.id !== 'operacoes-concluidas' && metric.id !== 'operacoes-pendentes' && (
                    <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
                  )}

                  {/* REMOVIDO: Detalhes de todos os itens diretamente no card */}
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <MetricDetailsDialog
        metric={selectedMetric}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
      />
    </>
  );
};