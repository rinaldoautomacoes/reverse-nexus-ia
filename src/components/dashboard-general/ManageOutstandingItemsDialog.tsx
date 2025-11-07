import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Settings, Search, Loader2, Trash2 } from 'lucide-react';
import { CreateOutstandingCollectionItemDialog } from '@/components/CreateOutstandingCollectionItemDialog';
import { OutstandingItemListItem } from './OutstandingItemListItem';
import { EditOutstandingCollectionItemDialog } from '../EditOutstandingCollectionItemDialog';
import type { Tables } from '@/integrations/supabase/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

type OutstandingCollectionItem = Tables<'outstanding_collection_items'>;

interface ManageOutstandingItemsDialogProps {
  outstandingItems: OutstandingCollectionItem[];
}

export const ManageOutstandingItemsDialog: React.FC<ManageOutstandingItemsDialogProps> = ({ outstandingItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutstandingCollectionItem | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              {filteredOutstandingItems.map((item) => (
                <OutstandingItemListItem
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  isDeleting={deleteOutstandingCollectionItemMutation.isPending}
                />
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
    </Dialog>
  );
};