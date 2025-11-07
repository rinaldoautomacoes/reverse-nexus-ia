import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, Edit, Trash2, Loader2, FileText, Tag, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { EditOutstandingCollectionItemDialog } from './EditOutstandingCollectionItemDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      <CardHeader className="pb-3"> {/* Reduced padding */}
        <CardTitle className="flex items-center gap-2 text-lg"> {/* Reduced font size */}
          <Package className="h-5 w-5 text-primary" />
          Itens Pendentes de Coleta
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3"> {/* Reduced padding and spacing */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por código, descrição, notas ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm" // Reduced height and font size
          />
        </div>

        {filteredItems && filteredItems.length > 0 ? (
          <div className="space-y-3"> {/* Reduced spacing */}
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up" // Reduced padding
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-1 min-w-0 mb-2 lg:mb-0"> {/* Reduced margin */}
                  <h3 className="font-semibold text-base flex items-center gap-2"> {/* Reduced font size */}
                    <Tag className="h-4 w-4 text-primary" /> {/* Reduced icon size */}
                    {item.product_code}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5"> {/* Reduced font size */}
                    Descrição: <span className="font-bold text-foreground">{item.product_description || 'N/A'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground"> {/* Reduced font size */}
                    Quantidade Pendente: <span className="font-bold text-foreground">{item.quantity_pending}</span>
                  </p>
                  <p className="text-xs text-muted-foreground"> {/* Reduced font size */}
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
                    className="border-accent text-accent hover:bg-accent/10 h-8 px-3 text-xs" // Reduced height, padding, font size
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive/10 h-8 px-3 text-xs" // Reduced height, padding, font size
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
          <div className="p-8 text-center text-muted-foreground"> {/* Reduced padding */}
            <Package className="h-10 w-10 mx-auto mb-3" /> {/* Reduced icon size and margin */}
            <p className="text-sm">Nenhum item pendente de coleta encontrado.</p> {/* Reduced font size */}
            <p className="text-xs mt-1">Clique em "Novo Item Pendente" para adicionar um.</p> {/* Reduced font size */}
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