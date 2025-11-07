import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  ListChecks, // Icon for 'Total de Coletas'
  Box, // Icon for 'Total de Produtos'
  TrendingUp, // General trend icon
  Settings // Icon for managing outstanding items
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Add items to Coleta type
type OutstandingCollectionItem = Tables<'outstanding_collection_items'>; // Import type

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Truck,
  Clock,
  CheckCircle,
  ListChecks,
  Box,
  TrendingUp,
  Settings
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
  outstandingItems?: OutstandingCollectionItem[]; // New field for outstanding items
}

interface GeneralMetricsCardsProps {
  allColetas: Coleta[];
  selectedYear: string;
}

export const GeneralMetricsCards: React.FC<GeneralMetricsCardsProps> = ({ allColetas, selectedYear }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { user } = useAuth();

  // Fetch outstanding collection items
  const { data: outstandingItems, isLoading: isLoadingOutstandingItems, error: outstandingItemsError } = useQuery<OutstandingCollectionItem[], Error>({
    queryKey: ['outstandingCollectionItems', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('outstanding_collection_items')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${selectedYear}-01-01T00:00:00.000Z`)
        .lte('created_at', `${parseInt(selectedYear) + 1}-01-01T00:00:00.000Z`)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const calculateMetrics = (data: Coleta[], outstanding: OutstandingCollectionItem[] | undefined) => {
    console.log("Calculating general metrics with allColetas data:", data); // Added log
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
          } else if (c.status_coleta === 'agendada') {
            inTransitItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: 'coleta',
            });
          } else if (c.status_coleta === 'concluida') {
            completedItemsDetails.push({
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
          } else if (e.status_coleta === 'agendada') {
            inTransitItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: 'entrega',
            });
          } else if (e.status_coleta === 'concluida') {
            completedItemsDetails.push({
              quantity: item.quantity,
              name: item.name,
              description: item.description || 'N/A',
              type: 'entrega',
            });
          }
        }
      });
    });

    const totalOutstandingItems = outstanding?.reduce((sum, item) => sum + (item.quantity_pending || 0), 0) || 0;

    return [
      {
        id: 'outstanding-collection-items',
        title: 'Itens Pendentes de Coleta',
        value: totalOutstandingItems.toString(),
        description: `${outstanding?.length || 0} registros pendentes`,
        icon_name: 'Package',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
        outstandingItems: outstanding,
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
        inTransitItemsDetails: inTransitItemsDetails, // Adicionado aqui
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
        completedItemsDetails: completedItemsDetails, // Adicionado aqui
      },
    ];
  };

  const initialMetrics = calculateMetrics(allColetas, outstandingItems);
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
  </codeblock>