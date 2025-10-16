import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Truck, Edit } from "lucide-react";
import { EntregaForm } from "./EntregaForm"; // Importar o EntregaForm

type Entrega = Tables<'coletas'>; // Reutilizando o tipo 'coletas' para entregas
type EntregaUpdate = TablesUpdate<'coletas'>;

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
      const { data, error } = await supabase
        .from('coletas')
        .update(updatedEntrega)
        .eq('id', updatedEntrega.id as string)
        .eq('user_id', user.id) // RLS check
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
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