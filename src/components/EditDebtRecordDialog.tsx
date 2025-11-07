import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/useAuth";
import { DebtRecordForm } from "./DebtRecordForm";

type DebtRecord = Tables<'debt_records'>;
type DebtRecordUpdate = TablesUpdate<'debt_records'>;

interface EditDebtRecordDialogProps {
  debtRecord: DebtRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditDebtRecordDialog: React.FC<EditDebtRecordDialogProps> = ({ debtRecord, isOpen, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateDebtRecordMutation = useMutation({
    mutationFn: async (updatedRecord: DebtRecordUpdate) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar saldos devedores.");
      }
      const { data, error } = await supabase
        .from('debt_records')
        .update(updatedRecord)
        .eq('id', updatedRecord.id as string)
        .eq('user_id', user.id) // RLS check
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtRecords', user?.id] });
      toast({ title: "Saldo Devedor Atualizado!", description: "Registro de saldo devedor salvo com sucesso." });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar saldo devedor", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: DebtRecordUpdate) => {
    updateDebtRecordMutation.mutate(data);
  };

  if (!debtRecord) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Saldo Devedor: {debtRecord.title}
          </DialogTitle>
        </DialogHeader>
        <DebtRecordForm
          initialData={debtRecord}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateDebtRecordMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};