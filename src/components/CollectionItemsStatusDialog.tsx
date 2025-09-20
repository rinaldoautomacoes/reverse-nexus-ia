import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Edit, ListChecks, Truck, CheckCircle, Clock, Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

type Item = Tables<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

interface CollectionItemsStatusDialogProps {
  collectionId: string;
  collectionName: string;
  isOpen: boolean;
  onClose: () => void;
}

const itemStatusOptions = [
  { value: 'pendente', label: 'Pendente', icon: Clock, color: 'text-neural', bgColor: 'bg-neural/10' },
  { value: 'coletado', label: 'Em Trânsito', icon: Truck, color: 'text-warning-yellow', bgColor: 'bg-warning-yellow/10' },
  { value: 'processado', label: 'Entregue em nossa unidade', icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
];

const EditItemStatusForm = ({ item, onUpdate, onCancel, isPending }: { item: Item, onUpdate: (data: ItemUpdate) => void, onCancel: () => void, isPending: boolean }) => {
  const [newStatus, setNewStatus] = useState(item.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ id: item.id, status: newStatus });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status do Item</Label>
        <Select value={newStatus} onValueChange={setNewStatus} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            {itemStatusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className={`h-4 w-4 ${option.color}`} /> {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/80" disabled={isPending}>
          {isPending ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Edit className="mr-2 h-4 w-4" />
          )}
          Salvar Status
        </Button>
      </div>
    </form>
  );
};

export const CollectionItemsStatusDialog: React.FC<CollectionItemsStatusDialogProps> = ({ collectionId, collectionName, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isEditItemStatusDialogOpen, setIsEditItemStatusDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['collectionItemsStatus', collectionId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .eq('collection_id', collectionId)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isOpen && !!user?.id && !!collectionId,
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async (updatedItem: ItemUpdate) => {
      const { data, error } = await supabase
        .from('items')
        .update(updatedItem)
        .eq('id', updatedItem.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionItemsStatus', collectionId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardItemsMetrics', user?.id] }); // Invalida métricas do dashboard
      toast({ title: "Status atualizado!", description: "O status do item foi salvo com sucesso." });
      setIsEditItemStatusDialogOpen(false);
      setEditingItem(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar status", description: err.message, variant: "destructive" });
    },
  });

  const handleUpdateItemStatus = (data: ItemUpdate) => {
    updateItemStatusMutation.mutate(data);
  };

  const getStatusDisplay = (status: string) => {
    const option = itemStatusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getStatusBadgeClasses = (status: string) => {
    const option = itemStatusOptions.find(opt => opt.value === status);
    return option ? `${option.bgColor} ${option.color}` : 'bg-muted/20 text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <ListChecks className="h-5 w-5" />
            Situação dos Itens da Coleta: {collectionName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {isLoadingItems ? (
            <div className="flex items-center justify-center p-6">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando itens...</p>
            </div>
          ) : itemsError ? (
            <div className="p-6 text-center text-destructive">
              <p>Erro ao carregar itens: {itemsError.message}</p>
            </div>
          ) : items && items.length > 0 ? (
            items.map((item, index) => (
              <Card
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                  ) : (
                    <div className={`p-2 rounded-lg ${getStatusBadgeClasses(item.status)}`}>
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Qtd: {item.quantity} | Modelo: {item.model || 'N/A'}
                    </p>
                    <Badge className={getStatusBadgeClasses(item.status)}>
                      {getStatusDisplay(item.status)}
                    </Badge>
                  </div>
                </div>
                <Dialog open={isEditItemStatusDialogOpen && editingItem?.id === item.id} onOpenChange={setIsEditItemStatusDialogOpen}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-accent text-accent hover:bg-accent/10"
                    onClick={() => {
                      setEditingItem(item);
                      setIsEditItemStatusDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar Status
                  </Button>
                  <DialogContent className="sm:max-w-[400px] bg-card border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 gradient-text">
                        <ListChecks className="h-5 w-5" />
                        Editar Status do Item
                      </DialogTitle>
                    </DialogHeader>
                    {editingItem && editingItem.id === item.id && (
                      <EditItemStatusForm
                        item={editingItem}
                        onUpdate={handleUpdateItemStatus}
                        onCancel={() => {
                          setIsEditItemStatusDialogOpen(false);
                          setEditingItem(null);
                        }}
                        isPending={updateItemStatusMutation.isPending}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </Card>
            ))
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum item encontrado para esta coleta.</p>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};