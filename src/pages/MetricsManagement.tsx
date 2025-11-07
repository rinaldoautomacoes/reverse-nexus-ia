import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Gauge, Search, TrendingUp, Palette, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MetricForm } from "@/components/MetricForm"; // Assuming you have a MetricForm component

type Metric = Tables<'metrics'>;
type MetricInsert = TablesInsert<'metrics'>;
type MetricUpdate = TablesUpdate<'metrics'>;

export const MetricsManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery<Metric[], Error>({
    queryKey: ['metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('title', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const addMetricMutation = useMutation({
    mutationFn: async (newMetric: MetricInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar métricas.");
      }
      const { data, error } = await supabase
        .from('metrics')
        .insert({ ...newMetric, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', user?.id] });
      toast({ title: "Métrica adicionada!", description: "Nova métrica criada com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar métrica", description: err.message, variant: "destructive" });
    },
  });

  const updateMetricMutation = useMutation({
    mutationFn: async (updatedMetric: MetricUpdate) => {
      const { data, error } = await supabase
        .from('metrics')
        .update(updatedMetric)
        .eq('id', updatedMetric.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', user?.id] });
      toast({ title: "Métrica atualizada!", description: "Métrica salva com sucesso." });
      setIsEditDialogOpen(false);
      setEditingMetric(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar métrica", description: err.message, variant: "destructive" });
    },
  });

  const deleteMetricMutation = useMutation({
    mutationFn: async (metricId: string) => {
      const { error } = await supabase
        .from('metrics')
        .delete()
        .eq('id', metricId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', user?.id] });
      toast({ title: "Métrica excluída!", description: "Métrica removida com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir métrica", description: err.message, variant: "destructive" });
    },
  });

  const handleAddMetric = (data: MetricInsert) => {
    addMetricMutation.mutate(data);
  };

  const handleUpdateMetric = (data: MetricUpdate) => {
    updateMetricMutation.mutate(data);
  };

  const handleDeleteMetric = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta métrica?")) {
      deleteMetricMutation.mutate(id);
    }
  };

  const filteredMetrics = metrics?.filter(metric =>
    metric.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metric.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metric.change.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Mapeamento de nomes de ícones para componentes Lucide React
  const iconMap: { [key: string]: React.ElementType } = {
    Gauge,
    TrendingUp,
    Palette,
    Zap,
    // Adicione outros ícones conforme necessário
  };

  if (isLoadingMetrics) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar métricas: {metricsError.message}</p>
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
              Gerenciar Métricas
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova as métricas exibidas no dashboard.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por título, valor ou mudança..."
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
                <Gauge className="h-5 w-5 text-primary" />
                Minhas Métricas
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Métrica
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <Gauge className="h-5 w-5" />
                      Adicionar Nova Métrica
                    </DialogTitle>
                  </DialogHeader>
                  <MetricForm
                    onSave={handleAddMetric}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isPending={addMetricMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredMetrics && filteredMetrics.length > 0 ? (
                filteredMetrics.map((metric, index) => {
                  const Icon = iconMap[metric.icon_name];
                  return (
                    <div
                      key={metric.id}
                      className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {Icon && <Icon className={`h-5 w-5 ${metric.color}`} />}
                          {metric.title}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                          <p>Valor: <span className="font-bold text-foreground">{metric.value}</span></p>
                          <p>Mudança: <span className={`font-bold ${metric.trend === 'up' ? 'text-success-green' : 'text-destructive'}`}>{metric.change}</span></p>
                          <p>Cor: <span className={metric.color}>{metric.color}</span></p>
                          <p>Fundo: <span className={metric.bg_color}>{metric.bg_color}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Dialog open={isEditDialogOpen && editingMetric?.id === metric.id} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-accent text-accent hover:bg-accent/10"
                              onClick={() => {
                                setEditingMetric(metric);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 gradient-text">
                                <Gauge className="h-5 w-5" />
                                Editar Métrica
                              </DialogTitle>
                            </DialogHeader>
                            {editingMetric && editingMetric.id === metric.id && (
                              <MetricForm
                                initialData={editingMetric}
                                onSave={handleUpdateMetric}
                                onCancel={() => {
                                  setIsEditDialogOpen(false);
                                  setEditingMetric(null);
                                }}
                                isPending={updateMetricMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteMetric(metric.id)}
                          disabled={deleteMetricMutation.isPending}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Gauge className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma métrica cadastrada. Clique em "Nova Métrica" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};