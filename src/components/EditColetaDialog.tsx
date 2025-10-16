import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Package, Edit } from "lucide-react";
import { ColetaForm } from "./ColetaForm"; // Importar o ColetaForm

type Coleta = Tables<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;

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
      const { data, error } = await supabase
        .from('coletas')
        .update(updatedColeta)
        .eq('id', updatedColeta.id as string)
        .eq('user_id', user.id) // RLS check
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
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