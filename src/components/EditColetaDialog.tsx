import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Package, Edit } from "lucide-react";
import { ColetaForm } from "./ColetaForm";

type Coleta = Tables<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Item = Tables<'items'>;
type ItemInsert = TablesInsert<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

interface EditColetaDialogProps {
  coleta: Coleta | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditColetaDialog: React.FC<EditColetaDialogProps> = ({ coleta, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const updateColetaMutation = useMutation({
    mutationFn: async (updatedColeta: ColetaUpdate) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar coletas.");
      }
      
      // 1. Update the coleta
      const { data: updatedColetaResult, error: coletaError } = await supabase
        .from('coletas')
        .update(updatedColeta)
        .eq('id', updatedColeta.id as string)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (coletaError) throw new Error(coletaError.message);

      // 2. Check if an item exists for this collection
      const { data: existingItem, error: fetchItemError } = await supabase
        .from('items')
        .select('*')
        .eq('collection_id', updatedColetaResult.id)
        .eq('user_id', user.id)
        .single();

      if (fetchItemError && fetchItemError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("Erro ao buscar item existente:", fetchItemError.message);
        // Decide whether to throw this error or just log it.
      }

      // 3. Update or Insert item based on existing data and form data
      if (updatedColetaResult.modelo_aparelho && updatedColetaResult.qtd_aparelhos_solicitado && updatedColetaResult.qtd_aparelhos_solicitado > 0) {
        const itemData: ItemInsert | ItemUpdate = {
          user_id: user.id,
          collection_id: updatedColetaResult.id,
          name: updatedColetaResult.modelo_aparelho,
          quantity: updatedColetaResult.qtd_aparelhos_solicitado,
          status: updatedColetaResult.status_coleta || 'pendente',
        };

        if (existingItem) {
          // Update existing item
          const { error: updateItemError } = await supabase
            .from('items')
            .update(itemData)
            .eq('id', existingItem.id);
          if (updateItemError) {
            console.error("Erro ao atualizar item:", updateItemError.message);
          }
        } else {
          // Insert new item
          const { error: insertItemError } = await supabase
            .from('items')
            .insert(itemData);
          if (insertItemError) {
            console.error("Erro ao inserir novo item:", insertItemError.message);
          }
        }
      } else if (existingItem) {
        // If product model or quantity are removed, delete the associated item
        const { error: deleteItemError } = await supabase
          .from('items')
          .delete()
          .eq('id', existingItem.id);
        if (deleteItemError) {
          console.error("Erro ao deletar item:", deleteItemError.message);
        }
      }

      return updatedColetaResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['itemsForColetasMetrics', user?.id] }); // Invalidate items query
      toast({ title: "Coleta Atualizada!", description: `A coleta foi salva com sucesso.` });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar coleta", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: ColetaUpdate) => {
    updateColetaMutation.mutate(data);
  };

  if (!coleta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Coleta: {coleta.parceiro}
          </DialogTitle>
        </DialogHeader>
        <ColetaForm
          initialData={coleta}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateColetaMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};