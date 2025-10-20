import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Truck, Edit } from "lucide-react";
import { EntregaForm } from "./EntregaForm";

type Entrega = Tables<'coletas'>;
type EntregaUpdate = TablesUpdate<'coletas'>;
type Item = Tables<'items'>;
type ItemInsert = TablesInsert<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

interface EditEntregaDialogProps {
  entrega: Entrega | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditEntregaDialog: React.FC<EditEntregaDialogProps> = ({ entrega, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const updateEntregaMutation = useMutation({
    mutationFn: async (updatedEntrega: EntregaUpdate) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar entregas.");
      }
      
      // 1. Update the entrega
      const { data: updatedEntregaResult, error: entregaError } = await supabase
        .from('coletas')
        .update(updatedEntrega)
        .eq('id', updatedEntrega.id as string)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (entregaError) throw new Error(entregaError.message);

      // 2. Check if an item exists for this collection
      const { data: existingItem, error: fetchItemError } = await supabase
        .from('items')
        .select('*')
        .eq('collection_id', updatedEntregaResult.id)
        .eq('user_id', user.id)
        .single();

      if (fetchItemError && fetchItemError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("Erro ao buscar item existente:", fetchItemError.message);
        // Decide whether to throw this error or just log it.
      }

      // 3. Update or Insert item based on existing data and form data
      if (updatedEntregaResult.modelo_aparelho && updatedEntregaResult.qtd_aparelhos_solicitado && updatedEntregaResult.qtd_aparelhos_solicitado > 0) {
        const itemData: ItemInsert | ItemUpdate = {
          user_id: user.id,
          collection_id: updatedEntregaResult.id,
          name: updatedEntregaResult.modelo_aparelho,
          quantity: updatedEntregaResult.qtd_aparelhos_solicitado,
          status: updatedEntregaResult.status_coleta || 'agendada', // Inherit status from entrega
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

      return updatedEntregaResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['itemsForEntregasMetrics', user?.id] }); // Invalidate items query
      toast({ title: "Entrega Atualizada!", description: `A entrega foi salva com sucesso.` });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar entrega", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: EntregaUpdate) => {
    updateEntregaMutation.mutate(data);
  };

  if (!entrega) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Entrega: {entrega.parceiro}
          </DialogTitle>
        </DialogHeader>
        <EntregaForm
          initialData={entrega}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateEntregaMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};