import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, TrendingUp, BarChart3, Download, FileText, Calendar, Filter, Edit, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { ReportForm } from "@/components/ReportForm";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { generateReport } from "@/lib/report-utils";
import { PerformanceChart } from "@/components/PerformanceChart"; // Importar o novo componente
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importação corrigida
import { useEffect } from "react";

type Coleta = Tables<'coletas'>;
type Item = Tables<'items'>;
type Report = Tables<'reports'>;
type ReportInsert = TablesInsert<'reports'>;
type ReportUpdate = TablesUpdate<'reports'>;

export const Relatorios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2025'); // Adicionado estado para o ano

  // --- Fetching Metrics ---
  const { data: coletasData, isLoading: isLoadingColetas, error: coletasError } = useQuery<Coleta[], Error>({
    queryKey: ['coletasForReports', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;
      const { data, error } = await supabase
        .from('coletas')
        .select('id, status_coleta, created_at, qtd_aparelhos_solicitado') // Adicionado created_at e qtd_aparelhos_solicitado
        .eq('user_id', user.id)
        .gte('created_at', startDate) // Filtrar por created_at
        .lt('created_at', endDate);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: itemsData, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['itemsForReports', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;
      const { data, error } = await supabase
        .from('items')
        .select('quantity, status, created_at') // Adicionado created_at
        .eq('user_id', user.id)
        .gte('created_at', startDate) // Filtrar por created_at
        .lt('created_at', endDate);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  // Processar dados para o gráfico de performance
  const processPerformanceChartData = (coletas: Coleta[] | undefined, items: Item[] | undefined) => {
    const monthlyDataMap = new Map<string, { totalColetas: number; totalItems: number }>();
    const allMonths: string[] = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(new Date(currentYear, i));
      const monthKey = format(month, 'MMM', { locale: ptBR });
      allMonths.push(monthKey);
      monthlyDataMap.set(monthKey, { totalColetas: 0, totalItems: 0 });
    }

    coletas?.forEach(coleta => {
      if (coleta.created_at) {
        const coletaDate = parseISO(coleta.created_at);
        const monthKey = format(startOfMonth(coletaDate), 'MMM', { locale: ptBR });
        if (monthlyDataMap.has(monthKey)) {
          monthlyDataMap.get(monthKey)!.totalColetas += 1;
        }
      }
    });

    items?.forEach(item => {
      if (item.created_at) {
        const itemDate = parseISO(item.created_at);
        const monthKey = format(startOfMonth(itemDate), 'MMM', { locale: ptBR });
        if (monthlyDataMap.has(monthKey)) {
          monthlyDataMap.get(monthKey)!.totalItems += item.quantity;
        }
      }
    });

    return allMonths.map(monthKey => ({
      month: monthKey,
      totalColetas: monthlyDataMap.get(monthKey)?.totalColetas || 0,
      totalItems: monthlyDataMap.get(monthKey)?.totalItems || 0,
    }));
  };

  const performanceChartData = processPerformanceChartData(coletasData, itemsData);

  const calculateMetrics = (coletas: Coleta[] | undefined, items: Item[] | undefined) => {
    if (!user?.id || (!coletas && !items)) {
      return [
        { titulo: "Coletas Finalizadas", valor: "0", unidade: "", variacao: "0%" },
        { titulo: "Itens Entregues", valor: "0", unidade: "itens", variacao: "0%" },
        { titulo: "Total Geral Itens", valor: "0", unidade: "itens", variacao: "0%" },
        { titulo: "Eficiência IA", valor: "94.2%", unidade: "", variacao: "+8%" }, // Placeholder
      ];
    }

    const totalColetasFinalizadas = coletas?.filter(c => c.status_coleta === 'concluida').length || 0;
    const totalItensEntregues = items?.filter(item => item.status === 'processado').reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalGeralItens = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return [
      { titulo: "Coletas Finalizadas", valor: totalColetasFinalizadas.toString(), unidade: "", variacao: "+12%" }, // Placeholder de variação
      { titulo: "Itens Entregues", valor: totalItensEntregues.toString(), unidade: "itens", variacao: "+15%" }, // Placeholder de variação
      { titulo: "Total Geral Itens", valor: totalGeralItens.toString(), unidade: "itens", variacao: "+10%" }, // Placeholder de variação
      { titulo: "Eficiência IA", valor: "94.2%", unidade: "", variacao: "+8%" }, // Placeholder
    ];
  };

  const dashboardMetrics = calculateMetrics(coletasData, itemsData);

  // --- Fetching Reports ---
  const { data: reports, isLoading: isLoadingReports, error: reportsError } = useQuery<Report[], Error>({
    queryKey: ['reports', user?.id, statusFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id);
      
      if (statusFilter !== "todos") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  // --- Mutations for Reports ---
  const updateReportMutation = useMutation({
    mutationFn: async (updatedReport: ReportUpdate) => {
      const { data, error } = await supabase
        .from('reports')
        .update(updatedReport)
        .eq('id', updatedReport.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      toast({ title: "Relatório atualizado!", description: "As informações do relatório foram atualizadas com sucesso." });
      setIsEditDialogOpen(false);
      setEditingReport(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar relatório", description: err.message, variant: "destructive" });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      toast({ title: "Relatório excluído!", description: "O relatório foi removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir relatório", description: err.message, variant: "destructive" });
    },
  });

  // Nova mutação para atualizar o status do relatório após o download
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, newStatus }: { reportId: string; newStatus: string }) => {
      const { data, error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar status do relatório", description: err.message, variant: "destructive" });
    },
  });

  const handleUpdateReport = (data: ReportUpdate) => {
    updateReportMutation.mutate(data);
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este relatório?")) {
      deleteReportMutation.mutate(id);
    }
  };

  const handleDownload = async (report: Report) => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para baixar relatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Gerar o relatório usando a nova função e o formato do relatório
      await generateReport(report, user.id, performanceChartData); // Passar performanceChartData

      // Se a geração do relatório for bem-sucedida e o status não for 'Pronto', atualizá-lo
      if (report.status !== 'Pronto') {
        await updateReportStatusMutation.mutateAsync({ reportId: report.id, newStatus: 'Pronto' });
      }

      toast({
        title: "Download Iniciado",
        description: `O download do relatório "${report.title}" foi iniciado.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
      // Opcionalmente, atualiza o status para 'Falha' se a geração falhar
      if (report.status !== 'Falha') {
        updateReportStatusMutation.mutate({ reportId: report.id, newStatus: 'Falha' });
      }
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Pronto':
        return 'bg-primary/20 text-primary';
      case 'Gerando':
        return 'bg-accent/20 text-accent';
      case 'Falha':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const filteredReports = reports?.filter(report => {
    const matchesSearch = (report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.period?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "todos" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoadingColetas || isLoadingItems || isLoadingReports) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando dados de relatórios...</p>
        </div>
      </div>
    );
  }

  if (coletasError || itemsError || reportsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar dados: {coletasError?.message || itemsError?.message || reportsError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Relatórios
            </h1>
            <p className="text-muted-foreground">
              Análises inteligentes e insights automatizados
            </p>
          </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardMetrics.map((metrica, index) => (
              <Card key={index} className="card-futuristic">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{metrica.titulo}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold">{metrica.valor}</p>
                        <p className="text-xs text-muted-foreground">{metrica.unidade}</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={metrica.variacao.startsWith('+') ? 'text-accent' : 'text-neural'}
                      >
                        {metrica.variacao}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico Principal */}
          <PerformanceChart data={performanceChartData} selectedYear={selectedYear} />

          {/* Lista de Relatórios */}
          <Card className="card-futuristic">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Relatórios Disponíveis
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar relatório..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Pronto">Pronto</SelectItem>
                      <SelectItem value="Gerando">Gerando</SelectItem>
                      <SelectItem value="Falha">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                  <CreateReportDialog />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredReports.length > 0 ? (
                filteredReports.map((report, index) => (
                  <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold">{report.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{report.period}</span>
                        <Badge variant="secondary" className="text-xs">
                          {report.type}
                        </Badge>
                        <span>{report.format}</span>
                        {report.collection_status_filter && report.collection_status_filter !== 'todos' && (
                          <Badge variant="secondary" className="text-xs bg-neural/20 text-neural">
                            Coletas: {report.collection_status_filter}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={report.status === 'Pronto' ? 'default' : 'secondary'}
                        className={getStatusColor(report.status)}
                      >
                        {report.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        // O botão estará habilitado se o status for 'Gerando' ou 'Pronto', e desabilitado se for 'Falha' ou se a mutação estiver pendente
                        disabled={report.status === 'Falha' || (updateReportStatusMutation.isPending && updateReportStatusMutation.variables?.reportId === report.id)}
                        className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                        onClick={() => handleDownload(report)}
                      >
                        {updateReportStatusMutation.isPending && updateReportStatusMutation.variables?.reportId === report.id ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Download
                      </Button>
                      <Dialog open={isEditDialogOpen && editingReport?.id === report.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingReport(report);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 gradient-text">
                              <FileText className="h-5 w-5" />
                              Editar Relatório
                            </DialogTitle>
                          </DialogHeader>
                          {editingReport && editingReport.id === report.id && (
                            <ReportForm 
                              initialData={editingReport}
                              onSave={handleUpdateReport}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingReport(null);
                              }}
                              isPending={updateReportMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
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
                  <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                  <p className="text-muted-foreground">
                    Crie seu primeiro relatório para começar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};