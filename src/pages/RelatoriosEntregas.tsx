import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, Search, Download, Loader2, CheckCircle, XCircle, Clock, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { EditReportDialog } from "@/components/EditReportDialog"; // Importar o novo diálogo
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns"; // Importar isValid
import { ptBR } from "date-fns/locale";
import { generateReport } from "@/lib/report-utils";

type Report = Tables<'reports'>;

export const RelatoriosEntregas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Estado para o diálogo de edição
  const [editingReport, setEditingReport] = useState<Report | null>(null); // Estado para o relatório sendo editado

  const { data: reports, isLoading: isLoadingReports, error: reportsError } = useQuery<Report[], Error>({
    queryKey: ['reportsEntregas', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'entrega') // Filtrar apenas relatórios de entrega
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user?.id); // RLS check
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportsEntregas', user?.id] });
      toast({ title: "Relatório Excluído!", description: "Relatório removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir relatório", description: err.message, variant: "destructive" });
    },
  });

  const handleGenerateReportClick = async (report: Report) => {
    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setGeneratingReportId(report.id);
    try {
      await generateReport(report, user.id);
      toast({ title: "Relatório Gerado!", description: `O relatório "${report.title}" foi gerado com sucesso.` });
    } catch (error: any) {
      toast({ title: "Erro ao Gerar Relatório", description: error.message, variant: "destructive" });
    } finally {
      setGeneratingReportId(null);
      queryClient.invalidateQueries({ queryKey: ['reportsEntregas', user?.id] }); // Invalida para atualizar o status
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setIsEditDialogOpen(true);
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.")) {
      deleteReportMutation.mutate(id);
    }
  };

  const filteredReports = reports?.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-warning-yellow/20 text-warning-yellow"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'concluido':
        return <Badge variant="outline" className="bg-success-green/20 text-success-green"><CheckCircle className="h-3 w-3 mr-1" /> Concluído</Badge>;
      case 'erro':
        return <Badge variant="outline" className="bg-destructive/20 text-destructive"><XCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoadingReports) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (reportsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar relatórios: {reportsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/dashboard-entregas')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard de Entregas
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Relatórios de Entregas
            </h1>
            <p className="text-muted-foreground">
              Visualize e gere relatórios detalhados das suas entregas.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por título, descrição ou status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Meus Relatórios de Entregas
              </CardTitle>
              <CreateReportDialog collectionTypeFilter="entrega" />
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredReports && filteredReports.length > 0 ? (
                filteredReports.map((report, index) => (
                  <div
                    key={report.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <p>Período: {report.start_date ? (isValid(new Date(report.start_date)) ? format(new Date(report.start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida') : 'N/A'} - {report.end_date ? (isValid(new Date(report.end_date)) ? format(new Date(report.end_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida') : 'N/A'}</p>
                        <p>Formato: <Badge variant="secondary">{report.format.toUpperCase()}</Badge></p>
                        <p>Status: {getStatusBadge(report.status)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => handleEditReport(report)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      {report.report_url && report.status === 'concluido' ? (
                        <a href={report.report_url} target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-success-green text-success-green hover:bg-success-green/10"
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleGenerateReportClick(report)}
                          disabled={generatingReportId === report.id || report.status === 'concluido'}
                        >
                          {generatingReportId === report.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="mr-1 h-3 w-3" />
                          )}
                          Gerar {report.format.toUpperCase()}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={deleteReportMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum relatório de entrega encontrado.</p>
                  <p className="text-sm">Crie um novo relatório para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingReport && (
        <EditReportDialog
          report={editingReport}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingReport(null);
          }}
        />
      )}
    </div>
  );
};