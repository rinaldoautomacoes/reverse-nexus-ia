import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Package, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type Item = Tables<'items'>;
type ItemInsert = TablesInsert<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

const itemStatusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'coletado', label: 'Coletado' },
  { value: 'processado', label: 'Processado' },
  { value: 'descartado', label: 'Descartado' },
];

const ItemForm = ({ initialData, onSave, onCancel }: { initialData?: Item, onSave: (data: ItemInsert | ItemUpdate) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<ItemInsert | ItemUpdate>(initialData || {
    name: '',
    quantity: 1,
    status: 'pendente',
    description: '',
    user_id: '' // Will be set by the mutation
  });

  const handleInputChange = (field: keyof (ItemInsert | ItemUpdate), value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Item</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange("quantity", parseInt(e.target.value))}
            required
            min={1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {itemStatusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/80">
          {initialData ? "Salvar Alterações" : "Adicionar Item"}
        </Button>
      </div>
    </form>
  );
};

export const ItemsManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['items', user?.id, statusFilter],
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

  const addItemMutation = useMutation({
    mutationFn: async (newItem: ItemInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar itens.");
      }
      const payload: ItemInsert = {
        ...newItem,
        user_id: user.id, // Use user.id diretamente após a verificação
        collection_id: newItem.collection_id === undefined ? null : newItem.collection_id 
      };
      
      const { data, error } = await supabase
        .from('items')
        .insert(payload)
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      } else {
        throw new Error("Falha ao recuperar os dados do item inserido após a criação.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardItemsMetrics', user?.id] });
      toast({ title: "Item adicionado!", description: "Novo item criado com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar item", description: err.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (updatedItem: ItemUpdate) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar itens.");
      }
      const payload: ItemUpdate = {
        ...updatedItem,
        user_id: user.id, // Use user.id diretamente após a verificação
        collection_id: updatedItem.collection_id === undefined ? null : updatedItem.collection_id
      };
      
      const { data, error } = await supabase
        .from('items')
        .update(payload)
        .eq('id', updatedItem.id as string)
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      } else {
        throw new Error("Falha ao recuperar os dados do item atualizado após a modificação.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardItemsMetrics', user?.id] });
      toast({ title: "Item atualizado!", description: "Item salvo com sucesso." });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar item", description: err.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardItemsMetrics', user?.id] });
      toast({ title: "Item excluído!", description: "Item removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir item", description: err.message, variant: "destructive" });
    },
  });

  const handleAddItem = (data: ItemInsert) => {
    addItemMutation.mutate(data);
  };

  const handleUpdateItem = (data: ItemUpdate) => {
    updateItemMutation.mutate(data);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'coletado': return 'bg-primary/20 text-primary';
      case 'processado': return 'bg-accent/20 text-accent';
      case 'descartado': return 'bg-destructive/20 text-destructive';
      case 'pendente': return 'bg-neural/20 text-neural';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingItems) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando itens...</p>
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
              Gerenciar Itens
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os itens associados às suas coletas.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou descrição do item..."
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Meus Itens
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <Package className="h-5 w-5" />
                      Adicionar Novo Item
                    </DialogTitle>
                  </DialogHeader>
                  <ItemForm onSave={handleAddItem} onCancel={() => setIsAddDialogOpen(false)} />
                </DialogContent>
              </Dialog>
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
                      <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity} | Status: {item.status}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {item.description}
                          </p>
                        )}
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
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 gradient-text">
                                <Package className="h-5 w-5" />
                                Editar Item
                              </DialogTitle>
                            </DialogHeader>
                            {editingItem && editingItem.id === item.id && (
                              <ItemForm
                                initialData={editingItem}
                                onSave={handleUpdateItem}
                                onCancel={() => {
                                  setIsEditDialogOpen(false);
                                  setEditingItem(null);
                                }}
                              />
                            )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum item cadastrado. Clique em "Novo Item" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};