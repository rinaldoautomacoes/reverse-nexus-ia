import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/useAuth";
import { ReportForm } from "./ReportForm"; // Importar o novo ReportForm
import { generateReport } from "@/lib/report-utils"; // Importar a função de geração de relatório do utilitário

type ReportInsert = TablesInsert<'reports'>;

interface CreateReportDialogProps {
  collectionTypeFilter?: 'coleta' | 'entrega' | 'todos'; // Adicionado prop para pré-definir o filtro
}

export const CreateReportDialog: React.FC<CreateReportDialogProps> = ({ collectionTypeFilter = 'todos' }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addReportMutation = useMutation({
    mutationFn: async (newReport: ReportInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para criar relatórios.");
      }
      const { data, error } = await supabase
        .from('reports')
        .insert({ ...newReport, user_id: user.id }) // collection_type_filter virá do formulário
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['reportsEntregas', user?.id] }); // Invalida também os relatórios de entregas
      toast({
        title: "Relatório Criado!",
        description: `${newReport.title} foi gerado com sucesso.`,
      });
      setOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Erro",
        description: err.message || "Falha ao gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  const handleSaveReport = (data: ReportInsert | TablesInsert<'reports'>) => {
    addReportMutation.mutate(data as ReportInsert);
  };

  // Determine the report type based on the collectionTypeFilter
  const reportType = collectionTypeFilter === 'todos' ? 'geral' : collectionTypeFilter;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
        >
          <FileText className="mr-2 h-4 w-4" />
          Novo Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <FileText className="h-5 w-5" />
            Criar Novo Relatório
          </DialogTitle>
        </DialogHeader>
        
        <ReportForm 
          onSave={handleSaveReport} 
          onCancel={() => setOpen(false)} 
          isPending={addReportMutation.isPending} 
          initialData={{ 
            collection_type_filter: collectionTypeFilter,
            type: reportType // Explicitly set the report type
          }} 
        />
      </DialogContent>
    </Dialog>
  );
};