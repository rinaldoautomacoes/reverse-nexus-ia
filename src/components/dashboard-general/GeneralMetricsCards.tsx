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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { SortableCard } from '@/components/SortableCard';
import { MetricDetailsDialog } from './MetricDetailsDialog';
import { OutstandingItemsSummaryCardContent } from './OutstandingItemsSummaryCardContent'; // New import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog components
import { Button } from '@/components/ui/button'; // Import Button
import { CreateOutstandingCollectionItemDialog } from '@/components/CreateOutstandingCollectionItemDialog'; // Import Create dialog
import { EditOutstandingCollectionItemDialog } from '@/components/EditOutstandingCollectionItemDialog'; // Import Edit dialog
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import for delete mutation
import { supabase } from '@/integrations/supabase/client'; // Import supabase
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, Loader2, XCircle } from 'lucide-react';


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
  Settings, // Add Settings to the map
  Tag // Add Tag to the map
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
  inTransitItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  completedItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  customComponent?: React.ReactNode;
  customHeaderButton?: React.ReactNode; // New field for custom header button
}

interface GeneralMetricsCardsProps {
  allColetas: Coleta[];
  selectedYear: string;
  outstandingItems: OutstandingCollectionItem[];
}

export const GeneralMetricsCards: React.FC<GeneralMetricsCardsProps> = ({ allColetas, selectedYear, outstandingItems }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isManageOutstandingDialogOpen, setIsManageOutstandingDialogOpen] = useState(false); // State for the manage dialog

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutstandingCollectionItem | null>(null);

  const deleteOutstandingCollectionItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('outstanding_collection_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingCollectionItems', user?.id] });
      toast({ title: "Item Excluído!", description: "Item pendente de coleta removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir item", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este item pendente de coleta? Esta ação não pode ser desfeita.")) {
      deleteOutstandingCollectionItemMutation.mutate(id);
    }
  };

  const handleEditItem = (item: OutstandingCollectionItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const filteredOutstandingItems = outstandingItems?.filter(item =>
    item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-destructive/20 text-destructive px-2 py-0.5 text-xs"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'coletado':
        return <Badge variant="outline" className="bg-success-green/20 text-success-green px-2 py-0.5 text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Coletado</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-muted/20 text-muted-foreground px-2 py-0.5 text-xs"><XCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline" className="px-2 py-0.5 text-xs">{status}</Badge>;
    }
  };


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
        customHeaderButton: ( // Pass the DialogTrigger as a custom header button
          <Dialog open={isManageOutstandingDialogOpen} onOpenChange={setIsManageOutstandingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 gradient-text">
                  <Package className="h-5 w-5" />
                  Gerenciar Itens Pendentes
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <CreateOutstandingCollectionItemDialog />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por código, descrição, notas ou status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
                {filteredOutstandingItems && filteredOutstandingItems.length > 0 ? (
                  <div className="space-y-3">
                    {filteredOutstandingItems.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="flex flex-col p-3 rounded-lg border border-primary/10 bg-slate-darker/10"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            {item.product_code}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Descrição: <span className="font-bold text-foreground">{item.product_description || 'N/A'}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Quantidade Pendente: <span className="font-bold text-foreground">{item.quantity_pending}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {getStatusBadge(item.status)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Criado em: {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-sm">Nenhum item pendente de coleta encontrado.</p>
                    <p className="text-xs mt-1">Clique em "Novo Item Pendente" para adicionar um.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ),
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
                    <>
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
                    </>
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

      {editingItem && (
        <EditOutstandingCollectionItemDialog
          item={editingItem}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </>
  );
};