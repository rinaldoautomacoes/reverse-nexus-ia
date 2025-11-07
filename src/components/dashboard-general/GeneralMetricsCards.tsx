import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  ListChecks, // Icon for 'Total de Coletas'
  Box, // Icon for 'Total de Produtos'
  TrendingUp, // General trend icon
  Settings, // Import Settings icon
  Tag // Import Tag icon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { getTotalQuantityOfItems, cn } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { SortableCard } from '@/components/SortableCard';
import { MetricDetailsDialog } from './MetricDetailsDialog';
import { OutstandingItemsSummaryCardContent } from './OutstandingItemsSummaryCardContent';
import { GeneralMetricCardContent } from './GeneralMetricCardContent'; // New import
import { ManageOutstandingItemsDialog } from './ManageOutstandingItemsDialog'; // New import

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; };
type OutstandingCollectionItem = Tables<'outstanding_collection_items'>;

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Truck,
  Clock,
  CheckCircle,
  ListChecks,
  Box,
  TrendingUp,
  Settings,
  Tag
};

export interface MetricItem { // Exportado para ser usado por GeneralMetricCardContent
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
  inTransitItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  completedItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  customComponent?: React.ReactNode;
  customHeaderButton?: React.ReactNode;
}

interface GeneralMetricsCardsProps {
  allColetas: Coleta[];
  selectedYear: string;
  outstandingItems: OutstandingCollectionItem[];
}

export const GeneralMetricsCards: React.FC<GeneralMetricsCardsProps> = ({ allColetas, selectedYear, outstandingItems }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const calculateMetrics = (data: Coleta[], outstanding: OutstandingCollectionItem[]) => {
    const coletas = data.filter(item => item.type === 'coleta');
    const entregas = data.filter(item => item.type === 'entrega');

    const totalColetas = coletas.length;
    const totalEntregas = entregas.length;
    const totalOperacoes = totalColetas + totalEntregas;

    const totalColetaItems = coletas.reduce((sum, c) => sum + getTotalQuantityOfItems(c.items), 0);
    const totalEntregaItems = entregas.reduce((sum, e) => sum + getTotalQuantityOfItems(e.items), 0);
    const totalItemsGeral = totalColetaItems + totalEntregaItems;

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

    const inTransitItemsDetails: {
      quantity: number;
      name: string;
      description: string;
      type: 'coleta' | 'entrega';
    }[] = [];

    const completedItemsDetails: {
      quantity: number;
      name: string;
      description: string;
      type: 'coleta' | 'entrega';
    }[] = [];

    data.forEach(c => {
      c.items?.forEach(item => {
        if (item.quantity && item.name) {
          allItemsDetails.push({
            quantity: item.quantity,
            name: item.name,
            description: item.description || 'N/A',
            type: c.type,
          });
          if (c.status_coleta === 'pendente') {
            pendingItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: c.type,
            });
          } else if (c.status_coleta === 'agendada') {
            inTransitItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: c.type,
            });
          } else if (c.status_coleta === 'concluida') {
            completedItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: c.type,
            });
          }
        }
      });
    });

    return [
      {
        id: 'outstanding-collection-items',
        title: 'Itens Pendentes de Coleta',
        value: outstanding.length.toString(),
        description: 'Itens aguardando coleta',
        icon_name: 'Package',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
        customComponent: (
          <OutstandingItemsSummaryCardContent
            outstandingItems={outstanding}
            isLoading={false}
            selectedYear={selectedYear}
          />
        ),
        customHeaderButton: <ManageOutstandingItemsDialog outstandingItems={outstanding} />,
      },
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
        inTransitItemsDetails: inTransitItemsDetails,
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
        pendingItemsDetails: pendingItemsDetails,
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
        completedItemsDetails: completedItemsDetails,
      },
    ];
  };

  const initialMetrics = calculateMetrics(allColetas, outstandingItems);
  const [metrics, setMetrics] = useState<MetricItem[]>(initialMetrics);

  useEffect(() => {
    const savedOrder = localStorage.getItem('general_dashboard_card_order');
    if (savedOrder) {
      const orderedIds = JSON.parse(savedOrder);
      const reorderedMetrics = orderedIds
        .map((id: string) => initialMetrics.find(metric => metric.id === id))
        .filter(Boolean) as MetricItem[];
      
      const newMetrics = initialMetrics.filter(metric => !orderedIds.includes(metric.id));
      setMetrics([...reorderedMetrics, ...newMetrics]);
    } else {
      setMetrics(initialMetrics);
    }
  }, [allColetas, selectedYear, outstandingItems]);

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

  const handleCardClick = (metricId: string) => {
    const metric = metrics.find(m => m.id === metricId);
    if (metric) {
      setSelectedMetric(metric);
      setIsDetailsDialogOpen(true);
    }
  };

  return (
    <>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={metrics.map(m => m.id)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon_name ? iconMap[metric.icon_name] : null;
              return (
                <SortableCard
                  key={metric.id}
                  id={metric.id}
                  title={metric.title}
                  icon={Icon}
                  iconColorClass={metric.color}
                  iconBgColorClass={metric.bg_color}
                  delay={index * 100}
                  onDetailsClick={metric.id === 'outstanding-collection-items' ? undefined : handleCardClick}
                  customHeaderButton={metric.customHeaderButton}
                >
                  {metric.customComponent ? (
                    metric.customComponent
                  ) : (
                    <GeneralMetricCardContent metric={metric} />
                  )}
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