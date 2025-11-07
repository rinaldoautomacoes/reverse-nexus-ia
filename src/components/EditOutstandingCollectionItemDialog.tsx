import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/useAuth";
import { OutstandingCollectionItemForm } from "./OutstandingCollectionItemForm";

type OutstandingCollectionItem = Tables<'outstanding_collection_items'>;
type OutstandingCollectionItemUpdate = TablesUpdate<'outstanding_collection_items'>;

interface EditOutstandingCollectionItemDialogProps {
  item: OutstandingCollectionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditOutstandingCollectionItemDialog: React.FC<EditOutstandingCollectionItemDialogProps> = ({ item, isOpen, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateOutstandingCollectionItemMutation = useMutation({
    mutationFn: async (updatedItem: OutstandingCollectionItemUpdate) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar itens pendentes.");
      }
      const { data, error } = await supabase
        .from('outstanding_collection_items')
        .update(updatedItem)
        .eq('id', updatedItem.id as string)
        .eq('user_id', user.id) // RLS check
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingCollectionItems', user?.id] });
      toast({ title: "Item Pendente Atualizado!", description: "Registro de item pendente salvo com sucesso." });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar item pendente", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: OutstandingCollectionItemUpdate) => {
    updateOutstandingCollectionItemMutation.mutate(data);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Item Pendente: {item.product_code}
          </DialogTitle>
        </DialogHeader>
        <OutstandingCollectionItemForm
          initialData={item}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateOutstandingCollectionItemMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};