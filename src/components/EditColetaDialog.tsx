import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Package, Edit } from "lucide-react";
import { ColetaForm } from "./ColetaForm";
import { ItemData } from "./coleta-form-sections/ColetaItemRow"; // Importa a interface ItemData
import { formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type Coleta = Tables<'coletas'> & { items?: Tables<'items'>[] }; // Adicionado items ao tipo Coleta
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
    mutationFn: async (data: { coleta: ColetaUpdate; items: ItemData[]; attachments: FileAttachment[] }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar coletas.");
      }
      
      const { coleta: updatedColeta, items: updatedItems, attachments: updatedAttachments } = data;

      // Destructure to omit 'driver' and 'transportadora' properties from the object
      // as they are relations and not direct columns on the 'coletas' table.
      const { driver, transportadora, ...restOfColeta } = updatedColeta;

      // 1. Update the coleta record, deriving modelo_aparelho and qtd_aparelhos_solicitado from the items list
      const coletaToUpdate: ColetaUpdate = {
        ...restOfColeta, // Use the rest of the object without 'driver' and 'transportadora'
        modelo_aparelho: formatItemsForColetaModeloAparelho(updatedItems),
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(updatedItems),
        attachments: updatedAttachments, // Salvar os anexos atualizados
      };

      console.log("EditColetaDialog: Sending to Supabase update:", coletaToUpdate);

      const { data: updatedColetaResult, error: coletaError } = await supabase
        .from('coletas')
        .update(coletaToUpdate)
        .eq('id', coletaToUpdate.id as string) // Use coletaToUpdate.id as it's guaranteed to be present
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (coletaError) throw new Error(coletaError.message);

      // 2. Handle items: delete, update, insert
      const existingItemIds = coleta?.items?.map(item => item.id) || [];
      const currentItemIds = updatedItems.filter(item => item.id).map(item => item.id);

      // Items to delete (exist in DB but not in current form)
      const itemsToDelete = existingItemIds.filter(id => !currentItemIds.includes(id));
      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('items')
          .delete()
          .in('id', itemsToDelete);
        if (deleteError) console.error("Erro ao deletar itens:", deleteError.message);
      }

      // Items to insert or update
      for (const item of updatedItems) {
        if (item.modelo_aparelho && item.qtd_aparelhos_solicitado && item.qtd_aparelhos_solicitado > 0) {
          const itemData: ItemInsert | ItemUpdate = {
            user_id: user.id,
            collection_id: updatedColetaResult.id,
            name: item.modelo_aparelho,
            description: item.descricaoMaterial, // Use descricaoMaterial for description
            quantity: item.qtd_aparelhos_solicitado,
            status: updatedColetaResult.status_coleta || 'pendente',
          };

          if (item.id && existingItemIds.includes(item.id)) {
            // Update existing item
            const { error: updateItemError } = await supabase
              .from('items')
              .update(itemData)
              .eq('id', item.id);
            if (updateItemError) console.error("Erro ao atualizar item:", updateItemError.message);
          } else {
            // Insert new item
            const { error: insertItemError } = await supabase
              .from('items')
              .insert(itemData);
            if (insertItemError) console.error("Erro ao inserir novo item:", insertItemError.message);
          }
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
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Coleta Atualizada!", description: `A coleta foi salva com sucesso.` });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar coleta", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = useCallback((data: ColetaUpdate, items: ItemData[], attachments: FileAttachment[]) => {
    updateColetaMutation.mutate({ coleta: data, items, attachments });
  }, [updateColetaMutation]);

  if (!coleta) return null;

  // Mapeia os itens do banco de dados para o formato ItemData para o formulário
  const initialItemsForForm: ItemData[] = coleta.items?.map(item => ({
    id: item.id,
    modelo_aparelho: item.name,
    qtd_aparelhos_solicitado: item.quantity,
    descricaoMaterial: item.description || "",
  })) || [];

  // Ensure attachments is an array, even if null or undefined
  const initialAttachmentsForForm: FileAttachment[] = (coleta.attachments as FileAttachment[] || []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-card border-primary/20 max-h-[calc(100vh-150px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Coleta: {coleta.parceiro ?? 'N/A'}
          </DialogTitle>
        </DialogHeader>
        <ColetaForm
          initialData={{ ...coleta, items: initialItemsForForm, attachments: initialAttachmentsForForm }} // Passa os itens e anexos para o formulário
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateColetaMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};