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
        .gte('created_at', `${selectedYear}-01-01T00:00:00:000Z`) // Adjusted to ISO string for comparison
        .lte('created_at', `${parseInt(selectedYear) + 1}-01-01T00:00:00:000Z`) // Adjusted to ISO string for comparison
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
    <> {/* Removed the Card wrapper here */}
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