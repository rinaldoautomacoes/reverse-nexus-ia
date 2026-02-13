import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, Users, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/use-auth";
import { SupervisorCombobox } from "./SupervisorCombobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateTechnicianReport } from "@/lib/technician-report-utils"; // Importar o novo utilitário
import { Label } from "@/components/ui/label"; // Adicionado: Importação do componente Label

type Profile = Tables<'profiles'>;

interface CreateTechnicianReportDialogProps {
  technicians: Profile[]; // Recebe a lista de técnicos filtrados
  allProfiles: Profile[]; // Recebe todos os perfis para resolver nomes de supervisores
}

export const CreateTechnicianReportDialog: React.FC<CreateTechnicianReportDialogProps> = ({ technicians, allProfiles }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | 'all'>('all');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv'>('pdf');

  const { data: supervisors, isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['allSupervisorsForReport', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('supervisor_id', null)
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data as unknown as Profile[];
    },
    enabled: !!currentUser?.id && open,
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para gerar relatórios.");
      }

      let techniciansToReport: Profile[] = [];
      let reportTitle = "Relatório de Técnicos";

      if (selectedSupervisorId === 'all') {
        techniciansToReport = technicians;
        reportTitle = "Relatório de Todos os Técnicos";
      } else {
        const supervisorProfile = allProfiles.find(p => p.id === selectedSupervisorId);
        if (!supervisorProfile) {
          throw new Error("Supervisor selecionado não encontrado.");
        }
        techniciansToReport = technicians.filter(tech => tech.supervisor_id === selectedSupervisorId);
        reportTitle = `Relatório de Técnicos - Supervisor: ${supervisorProfile.first_name} ${supervisorProfile.last_name || ''}`;
      }

      if (techniciansToReport.length === 0) {
        throw new Error("Nenhum técnico encontrado para os critérios selecionados.");
      }

      await generateTechnicianReport(techniciansToReport, allProfiles, reportFormat, reportTitle);
    },
    onSuccess: () => {
      toast({ title: "Relatório Gerado!", description: `O relatório de técnicos foi gerado com sucesso em formato ${reportFormat.toUpperCase()}.` });
      setOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao gerar relatório", description: err.message, variant: "destructive" });
    },
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  const isGenerating = generateReportMutation.isPending || isLoadingSupervisors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-secondary hover:bg-gradient-secondary/80">
          <FileText className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <FileText className="h-5 w-5" />
            Gerar Relatório de Técnicos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="supervisor-select">Selecionar Supervisor</Label>
            <SupervisorCombobox
              value={selectedSupervisorId === 'all' ? null : selectedSupervisorId}
              onValueChange={(id) => setSelectedSupervisorId(id || 'all')}
              disabled={isGenerating}
            />
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="select-all-supervisors"
                checked={selectedSupervisorId === 'all'}
                onChange={() => setSelectedSupervisorId(prev => prev === 'all' ? null : 'all')}
                disabled={isGenerating}
                className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <label htmlFor="select-all-supervisors" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Todos os Supervisores
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-format">Formato do Relatório</Label>
            <Select
              value={reportFormat}
              onValueChange={(value: 'pdf' | 'csv') => setReportFormat(value)}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || (!selectedSupervisorId && selectedSupervisorId !== 'all')}
              className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Gerar Relatório
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};