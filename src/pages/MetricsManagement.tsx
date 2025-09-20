import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Gauge, TrendingUp, Package, Truck, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type Metric = Tables<'metrics'>;
type MetricInsert = TablesInsert<'metrics'>;
type MetricUpdate = TablesUpdate<'metrics'>;

const iconOptions = [
  { value: 'Package', label: 'Pacote', icon: Package },
  { value: 'Truck', label: 'Caminhão', icon: Truck },
  { value: 'Clock', label: 'Relógio', icon: Clock },
  { value: 'CheckCircle', label: 'Verificado', icon: CheckCircle },
  { value: 'TrendingUp', label: 'Tendência de Alta', icon: TrendingUp },
  { value: 'AlertTriangle', label: 'Alerta', icon: AlertTriangle },
  { value: 'Gauge', label: 'Medidor', icon: Gauge },
];

const trendOptions = [
  { value: 'up', label: 'Para Cima' },
  { value: 'down', label: 'Para Baixo' },
  { value: 'neutral', label: 'Neutro' },
];

const colorOptions = [
  { value: 'text-primary', label: 'Primário' },
  { value: 'text-accent', label: 'Destaque' },
  { value: 'text-neural', label: 'Neural' },
  { value: 'text-destructive', label: 'Destrutivo' },
  { value: 'text-ai', label: 'IA' },
  { value: 'text-warning-yellow', label: 'Amarelo Alerta' }, // Nova opção
];

const bgColorOptions = [
  { value: 'bg-primary/10', label: 'Primário (Fundo)' },
  { value: 'bg-accent/10', label: 'Destaque (Fundo)' },
  { value: 'bg-neural/10', label: 'Neural (Fundo)' },
  { value: 'bg-destructive/10', label: 'Destrutivo (Fundo)' },
  { value: 'bg-ai/10', label: 'IA (Fundo)' },
  { value: 'bg-warning-yellow/10', label: 'Amarelo Alerta (Fundo)' }, // Nova opção
];

const MetricForm = ({ initialData, onSave, onCancel }: { initialData?: Metric, onSave: (data: MetricInsert | MetricUpdate) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<MetricInsert | MetricUpdate>(initialData || {
    title: '',
    value: '',
    change: '',
    trend: 'up',
    icon_name: 'Package',
    color: 'text-primary',
    bg_color: 'bg-primary/10',
    user_id: '' // Will be set by the mutation
  });

  const handleInputChange = (field: keyof (MetricInsert | MetricUpdate), value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value">Valor</Label>
          <Input
            id="value"
            value={formData.value}
            onChange={(e) => handleInputChange("value", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="change">Mudança</Label>
          <Input
            id="change"
            value={formData.change}
            onChange={(e) => handleInputChange("change", e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trend">Tendência</Label>
        <Select value={formData.trend} onValueChange={(value) => handleInputChange("trend", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a tendência" />
          </SelectTrigger>
          <SelectContent>
            {trendOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon_name">Ícone</Label>
        <Select value={formData.icon_name} onValueChange={(value) => handleInputChange("icon_name", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o ícone" />
          </SelectTrigger>
          <SelectContent>
            {iconOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" /> {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Cor do Ícone</Label>
          <Select value={formData.color} onValueChange={(value) => handleInputChange("color", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cor" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={`${option.value}`}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bg_color">Cor de Fundo do Ícone</Label>
          <Select value={formData.bg_color} onValueChange={(value) => handleInputChange("bg_color", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cor de fundo" />
            </SelectTrigger>
            <SelectContent>
              {bgColorOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <span>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/80">
          {initialData ? "Salvar Alterações" : "Adicionar Métrica"}
        </Button>
      </div>
    </form>
  );
};

export const MetricsManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);

  const { data: metrics, isLoading, error } = useQuery<Metric[], Error>({
    queryKey: ['metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const addMetricMutation = useMutation({
    mutationFn: async (newMetric: MetricInsert) => {
      const { data, error } = await supabase
        .from('metrics')
        .insert({ ...newMetric, user_id: user!.id })
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar métricas: {error.message}</p>
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
                <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <Gauge className="h-5 w-5" />
                      Adicionar Nova Métrica
                    </DialogTitle>
                  </DialogHeader>
                  <MetricForm onSave={handleAddMetric} onCancel={() => setIsAddDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics && metrics.length > 0 ? (
                metrics.map((metric, index) => {
                  const Icon = iconOptions.find(opt => opt.value === metric.icon_name)?.icon || Gauge;
                  return (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${metric.bg_color}`}>
                          <Icon className={`h-4 w-4 ${metric.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{metric.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {metric.value} ({metric.change}) - Tendência: {metric.trend}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                          <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
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
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteMetric(metric.id)}
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