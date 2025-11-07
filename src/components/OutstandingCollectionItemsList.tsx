import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, Edit, Trash2, Loader2, FileText, Tag, Clock, CheckCircle, XCircle, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { EditOutstandingCollectionItemDialog } from './EditOutstandingCollectionItemDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateOutstandingCollectionItemDialog } from './CreateOutstandingCollectionItemDialog';

type OutstandingCollectionItem = Tables<'outstanding_collection_items'>;

interface OutstandingCollectionItemsListProps {
  selectedYear: string; // Assuming we might filter by year later
}

export const OutstandingCollectionItemsList: React.FC<OutstandingCollectionItemsListProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutstandingCollectionItem | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false); // New state for manage dialog

  const { data: items, isLoading, error } = useQuery<OutstandingCollectionItem[], Error>({
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

  const filteredItems = items?.filter(item =>
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

  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-futuristic border-0">
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar itens pendentes: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Itens Pendentes de Coleta
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
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
                {filteredItems && filteredItems.length > 0 ? (
                  <div className="space-y-3">
                    {filteredItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 rounded-lg border border-primary/10 bg-slate-darker/10"
                      >
                        <div className="flex-1 min-w-0 mb-2 lg:mb-0">
                          <h3 className="font-semibold text-base flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            {item.product_code}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Descrição: <span className="font-bold text-foreground">{item.product_description || 'N/A'}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Quantidade Pendente: <span className="font-bold text-foreground">{item.quantity_pending}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status: {getStatusBadge(item.status)}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">Notas: {item.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Criado em: {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10 h-8 px-3 text-xs"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive/10 h-8 px-3 text-xs"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deleteOutstandingCollectionItemMutation.isPending}
                          >
                            {deleteOutstandingCollectionItemMutation.isPending ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1 h-3 w-3" />
                            )}
                            Excluir
                          </Button>
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
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {filteredItems && filteredItems.length > 0 ? (
          <div className="space-y-2">
            {filteredItems.slice(0, 2).map((item, index) => ( // Show only first 2 items
              <div key={item.id} className="flex flex-col space-y-0.5">
                <h4 className="font-semibold text-sm flex items-center gap-1">
                  <Tag className="h-3 w-3 text-primary" />
                  {item.product_code}
                </h4>
                <p className="text-xs text-muted-foreground ml-4">
                  Descrição: <span className="font-bold text-foreground">{item.product_description || 'N/A'}</span>
                </p>
                <p className="text-xs text-muted-foreground ml-4">
                  Qtd. Pendente: <span className="font-bold text-foreground">{item.quantity_pending}</span>
                </p>
                <p className="text-xs text-muted-foreground ml-4 flex items-center gap-1">
                  Status: {getStatusBadge(item.status)}
                </p>
              </div>
            ))}
            {filteredItems.length > 2 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                E mais {filteredItems.length - 2} itens...
              </p>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <Package className="h-8 w-8 mx-auto mb-2" />
            <p className="text-xs">Nenhum item pendente.</p>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
};