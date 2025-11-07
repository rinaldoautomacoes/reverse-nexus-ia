import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Edit } from "lucide-react";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type ColetaUpdate = TablesUpdate<'coletas'>;
type Profile = Tables<'profiles'>;

interface EditResponsibleDialogProps {
  collectionId: string;
  currentResponsibleUserId: string | null;
  collectionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EditResponsibleDialog: React.FC<EditResponsibleDialogProps> = ({
  collectionId,
  currentResponsibleUserId,
  collectionName,
  isOpen,
  onClose,
}) => {
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string | null>(currentResponsibleUserId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setSelectedResponsibleId(currentResponsibleUserId);
  }, [currentResponsibleUserId]);

  const updateResponsibleMutation = useMutation({
    mutationFn: async (newResponsibleId: string | null) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar o responsável.");
      }
      const { data, error } = await supabase
        .from('coletas')
        .update({ responsible_user_id: newResponsibleId })
        .eq('id', collectionId)
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
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      toast({ title: "Responsável Atualizado!", description: `O responsável pela coleta "${collectionName}" foi salvo com sucesso.` });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar responsável", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateResponsibleMutation.mutate(selectedResponsibleId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Responsável da Coleta: {collectionName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Selecione o novo responsável por esta coleta.
          </p>
          <ResponsibleUserCombobox
            value={selectedResponsibleId}
            onValueChange={setSelectedResponsibleId}
            onUserSelect={() => {}} // Não precisamos do objeto completo aqui
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateResponsibleMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-gradient-primary hover:bg-gradient-primary/80"
              onClick={handleSave}
              disabled={updateResponsibleMutation.isPending}
            >
              {updateResponsibleMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <User className="mr-2 h-4 w-4" />
              )}
              Salvar Responsável
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};