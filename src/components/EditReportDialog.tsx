import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Edit } from "lucide-react";
import { ReportForm } from "./ReportForm";

type Report = Tables<'reports'>;
type ReportUpdate = TablesUpdate<'reports'>;

interface EditReportDialogProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditReportDialog: React.FC<EditReportDialogProps> = ({ report, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const updateReportMutation = useMutation({
    mutationFn: async (updatedReport: ReportUpdate) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar relatórios.");
      }
      const { data, error } = await supabase
        .from('reports')
        .update(updatedReport)
        .eq('id', updatedReport.id as string)
        .eq('user_id', user.id) // RLS check
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['reportsEntregas', user?.id] });
      toast({ title: "Relatório Atualizado!", description: `O relatório "${updatedReport.title}" foi salvo com sucesso.` });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar relatório", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: ReportUpdate) => {
    updateReportMutation.mutate(data);
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Relatório: {report.title}
          </DialogTitle>
        </DialogHeader>
        <ReportForm
          initialData={report}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateReportMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};