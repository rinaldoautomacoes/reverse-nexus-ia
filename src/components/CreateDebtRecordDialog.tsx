import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DollarSign, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/useAuth";
import { DebtRecordForm } from "./DebtRecordForm";

type DebtRecordInsert = TablesInsert<'debt_records'>;

export const CreateDebtRecordDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addDebtRecordMutation = useMutation({
    mutationFn: async (newRecord: DebtRecordInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar saldos devedores.");
      }
      const { data, error } = await supabase
        .from('debt_records')
        .insert({ ...newRecord, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtRecords', user?.id] });
      toast({ title: "Saldo Devedor Adicionado!", description: "Novo registro de saldo devedor criado com sucesso." });
      setOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar saldo devedor", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: DebtRecordInsert) => {
    addDebtRecordMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Saldo Devedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <DollarSign className="h-5 w-5" />
            Adicionar Novo Saldo Devedor
          </DialogTitle>
        </DialogHeader>
        <DebtRecordForm
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          isPending={addDebtRecordMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};