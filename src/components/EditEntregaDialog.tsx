import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, MinusCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { EntregaForm } from "./EntregaForm"; // Importa o EntregaForm refatorado
import { ItemData } from "./coleta-form-sections/ColetaItemRow"; // Importa a interface ItemData
import { formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

type Entrega = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null;
};
type EntregaUpdate = TablesUpdate<'coletas'>;
type ItemInsert = TablesInsert<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

interface EditEntregaDialogProps {
  entrega: Entrega;
  isOpen: boolean;
  onClose: () => void;
}

export const EditEntregaDialog: React.FC<EditEntregaDialogProps> = ({ entrega, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const updateEntregaMutation = useMutation({
    mutationFn: async (data: { entrega: EntregaUpdate; items: ItemData[] }) => {
      if (!user?.id) throw new Error("User not authenticated.");

      const { entrega: updatedEntrega, items: updatedItems } = data;

      // 1. Update the entrega record, deriving modelo_aparelho and qtd_aparelhos_solicitado from the items list
      const entregaToUpdate: EntregaUpdate = {
        ...updatedEntrega,
        modelo_aparelho: formatItemsForColetaModeloAparelho(updatedItems),
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(updatedItems),
      };

      const { error: updateError } = await supabase
        .from('coletas')
        .update(entregaToUpdate)
        .eq('id', entregaToUpdate.id as string)
        .eq('user_id', user.id);

      if (updateError) throw new Error(updateError.message);

      // 2. Handle items: delete, update, insert
      const existingItemIds = entrega?.items?.map(item => item.id) || [];
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
            collection_id: updatedEntrega.id,
            name: item.modelo_aparelho,
            description: item.descricaoMaterial, // Use descricaoMaterial for description
            quantity: item.qtd_aparelhos_solicitado,
            status: updatedEntrega.status_coleta || 'pendente',
          };

          if (item.id && existingItemIds.includes(item.id)) {
            // Update existing item
            const { error: updateItemError } = await supabase
              .from('items')
              .update(itemData)
              .eq('id', item.id);
            if (updateItemError) throw new Error(updateItemError.message);
          } else {
            // Insert new item
            const { error: insertItemError } = await supabase
              .from('items')
              .insert(itemData);
            if (insertItemError) throw new Error(insertItemError.message);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Entrega Atualizada!", description: "Os detalhes da entrega foram salvos com sucesso." });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar entrega", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: EntregaUpdate, items: ItemData[]) => {
    updateEntregaMutation.mutate({ entrega: data, items });
  };

  // Mapeia os itens do banco de dados para o formato ItemData para o formulário
  const initialItemsForForm: ItemData[] = entrega.items?.map(item => ({
    id: item.id,
    modelo_aparelho: item.name,
    qtd_aparelhos_solicitado: item.quantity,
    descricaoMaterial: item.description || "",
  })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Entrega: {entrega.parceiro}</DialogTitle>
        </DialogHeader>
        <EntregaForm
          initialData={{ ...entrega, items: initialItemsForForm }}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateEntregaMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};