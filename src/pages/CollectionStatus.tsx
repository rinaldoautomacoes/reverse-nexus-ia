import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Package, Search, Filter, Edit, ListChecks, Truck, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

type Item = Tables<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

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

export const CollectionStatus = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['itemsCollectionStatus', user?.id, statusFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id);
      
      if (statusFilter !== "todos") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
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
      queryClient.invalidateQueries({ queryKey: ['itemsCollectionStatus', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardItemsMetrics', user?.id] }); // Invalida métricas do dashboard
      toast({ title: "Status atualizado!", description: "O status do item foi salvo com sucesso." });
      setIsEditDialogOpen(false);
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

  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingItems) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando situação das coletas...</p>
        </div>
      </div>
    );
  }

  if (itemsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar dados: {itemsError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Situação da Coleta
            </h1>
            <p className="text-muted-foreground">
              Gerencie o status dos itens em cada etapa da logística reversa.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, modelo ou descrição do item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      {itemStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Itens em Processo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                      ) : (
                        <div className={`p-2 rounded-lg ${getStatusBadgeClasses(item.status)}`}>
                          <Package className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity} | Modelo: {item.model || 'N/A'}
                        </p>
                        <Badge className={getStatusBadgeClasses(item.status)}>
                          {getStatusDisplay(item.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen && editingItem?.id === item.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar Status
                          </Button>
                        </DialogTrigger>
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
                                  setIsEditDialogOpen(false);
                                  setEditingItem(null);
                                }}
                                isPending={updateItemStatusMutation.isPending}
                              />
                            )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum item encontrado com os filtros aplicados.</p>
                  <p className="text-sm">Adicione itens para gerenciar seus status.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};