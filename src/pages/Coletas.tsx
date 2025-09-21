import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Package, MapPin, Calendar, Search, Filter, Eye, Edit, Trash2, MessageSquareText, Mail, RefreshCcw, Clock, CheckCircle, ListChecks, Tag, Box, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CollectionStatusUpdateDialog } from "@/components/CollectionStatusUpdateDialog";
import { EditResponsibleDialog } from "@/components/EditResponsibleDialog"; // Importar o novo diálogo
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Importar Avatar

type Coleta = Tables<'coletas'>;
type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Item = Tables<'items'>; // Renomeado Produto para Item para consistência com types.ts
type Profile = Tables<'profiles'>; // Importar o tipo Profile

// Definir um tipo auxiliar para a coleta com o perfil do responsável aninhado
type ColetaWithResponsibleProfile = Coleta & {
  responsible_user_profile: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null;
};

interface ColetasProps {
  selectedYear: string;
}

const EditColetaForm = ({ coleta, onUpdate, onCancel }: { coleta: Coleta, onUpdate: (coleta: ColetaUpdate) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<ColetaUpdate>({
    id: coleta.id,
    parceiro: coleta.parceiro || '',
    endereco: coleta.endereco || '',
    previsao_coleta: coleta.previsao_coleta || '',
    qtd_aparelhos_solicitado: coleta.qtd_aparelhos_solicitado || 0,
    modelo_aparelho: coleta.modelo_aparelho || '',
    status_coleta: coleta.status_coleta || 'pendente',
    observacao: coleta.observacao || '',
    telefone: coleta.telefone || '',
    email: coleta.email || '',
    contato: coleta.contato || '',
    responsavel: coleta.responsavel || '', // Manter este campo para compatibilidade
    responsible_user_id: coleta.responsible_user_id || null,
  });

  const handleInputChange = (field: keyof ColetaUpdate, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="parceiro">Cliente</Label>
          <Input 
            id="parceiro"
            value={formData.parceiro || ''}
            onChange={(e) => handleInputChange("parceiro", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="contato">Pessoa de Contato</Label>
          <Input 
            id="contato"
            value={formData.contato || ''}
            onChange={(e) => handleInputChange("contato", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input 
            id="telefone"
            value={formData.telefone || ''}
            onChange={(e) => handleInputChange("telefone", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="previsao_coleta">Data</Label>
          <Input 
            id="previsao_coleta"
            type="date"
            value={formData.previsao_coleta || ''}
            onChange={(e) => handleInputChange("previsao_coleta", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos</Label>
          <Input 
            id="qtd_aparelhos_solicitado"
            type="number"
            value={formData.qtd_aparelhos_solicitado || 0}
            onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || 0)}
            required
            min={0}
          />
        </div>
        <div>
          <Label htmlFor="modelo_aparelho">Tipo de Aparelho</Label>
          <Select value={formData.modelo_aparelho || ''} onValueChange={(value) => handleInputChange("modelo_aparelho", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
              <SelectItem value="Eletrodomésticos">Eletrodomésticos</SelectItem>
              <SelectItem value="Móveis">Móveis</SelectItem>
              <SelectItem value="Vestuário">Vestuário</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status_coleta">Status</Label>
          <Select value={formData.status_coleta || 'pendente'} onValueChange={(value) => handleInputChange("status_coleta", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agendada">Agendada</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input 
          id="endereco"
          value={formData.endereco || ''}
          onChange={(e) => handleInputChange("endereco", e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="observacao">Observações</Label>
        <Textarea 
          id="observacao"
          value={formData.observacao || ''}
          onChange={(e) => handleInputChange("observacao", e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/80">
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};

const Coletas: React.FC<ColetasProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedColeta, setSelectedColeta] = useState<ColetaWithResponsibleProfile | null>(null);
  const [editingColeta, setEditingColeta] = useState<Coleta | null>(null);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCollectionStatusUpdateDialogOpen, setIsCollectionStatusUpdateDialogOpen] = useState(false);
  const [selectedCollectionForStatusUpdate, setSelectedCollectionForStatusUpdate] = useState<{ id: string, name: string, status: string } | null>(null);
  const [isEditResponsibleDialogOpen, setIsEditResponsibleDialogOpen] = useState(false); // Novo estado
  const [selectedCollectionForResponsible, setSelectedCollectionForResponsible] = useState<{ id: string, name: string, responsibleId: string | null } | null>(null); // Novo estado

  const { data: coletas, isLoading, error } = useQuery<ColetaWithResponsibleProfile[], Error>({
    queryKey: ['coletasAtivas', user?.id, statusFilter, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${parseInt(selectedYear) + 1}-01-01`;

      let query = supabase
        .from('coletas')
        .select(`
          *,
          responsible_user_profile: responsible_user_id(
            profiles(first_name, last_name, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .neq('status_coleta', 'concluida')
        .gte('previsao_coleta', startDate)
        .lt('previsao_coleta', endDate);
      
      if (statusFilter !== "todos") {
        query = query.eq('status_coleta', statusFilter === 'em_transito' ? 'agendada' : statusFilter);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as ColetaWithResponsibleProfile[];
    },
    enabled: !!user?.id,
  });

  const { data: itemsForSelectedColeta, isLoading: isLoadingItemsForColeta, error: itemsForColetaError } = useQuery<Item[], Error>({
    queryKey: ['itemsForCollection', selectedColeta?.id],
    queryFn: async () => {
      if (!selectedColeta?.id || !user?.id) return [];
      const { data, error } = await supabase
        .from('items')
        .select('name, description, quantity, model')
        .eq('collection_id', selectedColeta.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!selectedColeta?.id && !!user?.id,
  });

  const updateColetaMutation = useMutation({
    mutationFn: async (updatedColeta: ColetaUpdate) => {
      const { data, error } = await supabase
        .from('coletas')
        .update(updatedColeta)
        .eq('id', updatedColeta.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id, statusFilter, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id, selectedYear] });
      toast({ title: "Coleta atualizada!", description: "As informações da coleta foram atualizadas com sucesso." });
      setIsEditDialogOpen(false);
      setEditingColeta(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar coleta", description: err.message, variant: "destructive" });
    },
  });

  const deleteColetaMutation = useMutation({
    mutationFn: async (coletaId: string) => {
      const { error } = await supabase
        .from('coletas')
        .delete()
        .eq('id', coletaId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id, statusFilter, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id, selectedYear] });
      toast({ title: "Coleta excluída!", description: "A coleta foi removida com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir coleta", description: err.message, variant: "destructive" });
    },
  });

  const handleUpdateColeta = (updatedColeta: ColetaUpdate) => {
    updateColetaMutation.mutate(updatedColeta);
  };

  const handleDeleteColeta = (coletaId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta coleta?")) {
      deleteColetaMutation.mutate(coletaId);
    }
  };

  const handleStatusChange = (coletaId: string, newStatus: 'pendente' | 'concluida' | 'agendada') => {
    updateColetaMutation.mutate({ id: coletaId, status_coleta: newStatus });
  };

  const handleOpenCollectionStatusUpdateDialog = (coleta: Coleta) => {
    setSelectedCollectionForStatusUpdate({ 
      id: coleta.id, 
      name: coleta.parceiro || 'Coleta',
      status: coleta.status_coleta || 'pendente'
    });
    setIsCollectionStatusUpdateDialogOpen(true);
  };

  const handleOpenEditResponsibleDialog = (coleta: Coleta) => {
    setSelectedCollectionForResponsible({
      id: coleta.id,
      name: coleta.parceiro || 'Coleta',
      responsibleId: coleta.responsible_user_id || null,
    });
    setIsEditResponsibleDialogOpen(true);
  };

  const handleSendWhatsApp = (coleta: Coleta) => {
    if (coleta.telefone) {
      const message = encodeURIComponent(`Olá ${coleta.contato || coleta.parceiro}, sobre a coleta agendada para ${coleta.previsao_coleta ? format(new Date(coleta.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'} no endereço ${coleta.endereco}.`);
      window.open(`https://wa.me/${coleta.telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
    } else {
      toast({
        title: "Telefone não disponível",
        description: "Não há um número de telefone cadastrado para esta coleta.",
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = (coleta: Coleta) => {
    if (coleta.email) {
      const subject = encodeURIComponent(`Informações sobre a Coleta - ${coleta.parceiro}`);
      const body = encodeURIComponent(`Prezado(a) ${coleta.contato || coleta.parceiro},\n\nEste é um email referente à coleta agendada para ${coleta.previsao_coleta ? format(new Date(coleta.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'} no endereço ${coleta.endereco}.\n\nAtenciosamente,\nEquipe LogiReverseIA`);
      window.open(`mailto:${coleta.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      toast({
        title: "Email não disponível",
        description: "Não há um endereço de email cadastrado para esta coleta.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'concluida':
        return 'bg-success-green/20 text-success-green';
      case 'agendada':
        return 'bg-warning-yellow/20 text-warning-yellow';
      case 'pendente':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'agendada':
        return 'Em Trânsito';
      case 'pendente':
        return 'Pendente';
      default:
        return status || 'Desconhecido';
    }
  };

  const filteredColetas = coletas?.filter(coleta => {
    const matchesSearch = (coleta.parceiro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coleta.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coleta.responsible_user_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coleta.responsible_user_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "todos" || 
                          (statusFilter === 'em_transito' && coleta.status_coleta === 'agendada') ||
                          (statusFilter !== 'em_transito' && coleta.status_coleta === statusFilter);
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando coletas ativas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar coletas ativas: {error.message}</p>
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
              Coletas Ativas ({selectedYear})
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie coletas pendentes e em trânsito no ano de {selectedYear}
            </p>
          </div>

          <Card className="card-futuristic bg-gradient-primary border-primary/20 text-primary-foreground">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ListChecks className="h-8 w-8" />
                <div>
                  <p className="text-sm font-medium opacity-80">Total de Coletas Ativas</p>
                  <p className="text-3xl font-bold font-orbitron">{coletas?.length || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70">Coletas registradas</p>
                <p className="text-sm font-medium opacity-90">em sua base</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, endereço ou responsável..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="em_transito">Em Trânsito</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredColetas.map((coleta, index) => (
              <Card 
                key={coleta.id} 
                className="card-futuristic border-0 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{coleta.parceiro}</h3>
                        <Badge className={getStatusColor(coleta.status_coleta)}>
                          {getStatusText(coleta.status_coleta)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {coleta.endereco}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {coleta.previsao_coleta ? format(new Date(coleta.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                        </div>
                        <div>
                          <strong>{coleta.qtd_aparelhos_solicitado || 0}</strong> produtos - {coleta.modelo_aparelho || 'N/A'}
                        </div>
                        {coleta.responsible_user_profile ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={coleta.responsible_user_profile.avatar_url || undefined} />
                              <AvatarFallback>{coleta.responsible_user_profile.first_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">Responsável:</span> {`${coleta.responsible_user_profile.first_name || ''} ${coleta.responsible_user_profile.last_name || ''}`.trim()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span className="font-medium">Responsável:</span> N/A
                          </div>
                        )}
                      </div>
                      
                      {coleta.observacao && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {coleta.observacao}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isViewDetailsDialogOpen && selectedColeta?.id === coleta.id} onOpenChange={setIsViewDetailsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-accent text-accent hover:bg-accent/10" 
                            onClick={() => {
                              setSelectedColeta(coleta);
                              setIsViewDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl bg-card border-primary/20">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 gradient-text">
                              <ListChecks className="h-5 w-5" />
                              Detalhes da Coleta
                            </DialogTitle>
                          </DialogHeader>
                          {selectedColeta && (
                            <div className="space-y-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Cliente</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.parceiro}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Pessoa de Contato</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.contato || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Telefone</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.telefone || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Email</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <Badge className={getStatusColor(selectedColeta.status_coleta)}>
                                    {getStatusText(selectedColeta.status_coleta)}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Data</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.previsao_coleta ? format(new Date(selectedColeta.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Quantidade de Aparelhos Solicitada</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.qtd_aparelhos_solicitado || 0} produtos</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Tipo de Aparelho (Geral)</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.modelo_aparelho || 'N/A'}</p>
                                </div>
                                {selectedColeta.responsible_user_profile ? (
                                  <div>
                                    <Label className="text-sm font-medium">Responsável</Label>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={selectedColeta.responsible_user_profile.avatar_url || undefined} />
                                        <AvatarFallback>{selectedColeta.responsible_user_profile.first_name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      {`${selectedColeta.responsible_user_profile.first_name || ''} ${selectedColeta.responsible_user_profile.last_name || ''}`.trim()}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <Label className="text-sm font-medium">Responsável</Label>
                                    <p className="text-sm text-muted-foreground">N/A</p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Endereço</Label>
                                <p className="text-sm text-muted-foreground">{selectedColeta.endereco}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Observações</Label>
                                <p className="text-sm text-muted-foreground">{selectedColeta.observacao || "Nenhuma observação"}</p>
                              </div>

                              <div className="space-y-4 mt-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2 gradient-text">
                                  <Package className="h-5 w-5" />
                                  Produtos da Coleta
                                </h3>
                                {isLoadingItemsForColeta ? (
                                  <div className="text-center text-muted-foreground">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p>Carregando produtos...</p>
                                  </div>
                                ) : itemsForColetaError ? (
                                  <div className="text-center text-destructive">
                                    <p>Erro ao carregar produtos: {itemsForColetaError.message}</p>
                                  </div>
                                ) : itemsForSelectedColeta && itemsForSelectedColeta.length > 0 ? (
                                  <div className="space-y-3">
                                    {itemsForSelectedColeta.map((item, itemIndex) => (
                                      <Card key={item.id} className="bg-slate-darker/10 border-primary/10 p-3">
                                        <CardContent className="p-0">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2">
                                              <Tag className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Código do Produto:</span> {item.name}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Box className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Modelo:</span> {item.model || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 col-span-full">
                                              <ListChecks className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Quantidade:</span> {item.quantity}
                                            </div>
                                            {item.description && (
                                              <div className="flex items-start gap-2 col-span-full">
                                                <MessageSquareText className="h-4 w-4 text-muted-foreground mt-1" />
                                                <span className="font-medium">Descrição:</span> {item.description}
                                              </div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center text-muted-foreground">
                                    <Package className="h-10 w-10 mx-auto mb-2" />
                                    <p>Nenhum produto associado a esta coleta.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        className="bg-gradient-secondary hover:bg-gradient-secondary/80"
                        onClick={() => handleSendWhatsApp(coleta)}
                        disabled={!coleta.telefone}
                      >
                        <MessageSquareText className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>

                      <Button 
                        size="sm" 
                        className="bg-gradient-primary hover:bg-gradient-primary/80"
                        onClick={() => handleSendEmail(coleta)}
                        disabled={!coleta.email}
                      >
                        <Mail className="mr-1 h-3 w-3" />
                        Email
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-neural text-neural hover:bg-neural/10">
                              <RefreshCcw className="mr-1 h-3 w-3" />
                              Mudar Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-primary/20">
                          <DropdownMenuItem onClick={() => handleStatusChange(coleta.id, 'pendente')}>
                              <Clock className="mr-2 h-3 w-3 text-destructive" /> Marcar como Pendente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(coleta.id, 'agendada')}>
                              <Calendar className="mr-2 h-3 w-3 text-warning-yellow" /> Marcar como Agendada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(coleta.id, 'concluida')}>
                              <CheckCircle className="mr-2 h-3 w-3 text-success-green" /> Marcar como Concluída
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => handleOpenCollectionStatusUpdateDialog(coleta)}
                      >
                        <ListChecks className="mr-1 h-3 w-3" />
                        Situação da Coleta
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neural text-neural hover:bg-neural/10"
                        onClick={() => handleOpenEditResponsibleDialog(coleta)}
                      >
                        <UserIcon className="mr-1 h-3 w-3" />
                        Editar Responsável
                      </Button>

                      <Dialog open={isEditDialogOpen && editingColeta?.id === coleta.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-gradient-primary hover:bg-gradient-primary/80" 
                            onClick={() => {
                                setEditingColeta(coleta);
                                setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Coleta</DialogTitle>
                          </DialogHeader>
                          {editingColeta && editingColeta.id === coleta.id && (
                            <EditColetaForm 
                              coleta={editingColeta} 
                              onUpdate={handleUpdateColeta}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingColeta(null);
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteColeta(coleta.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredColetas.length === 0 && (
            <Card className="card-futuristic">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma coleta ativa encontrada</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou realizar uma nova busca.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {selectedCollectionForStatusUpdate && (
        <CollectionStatusUpdateDialog
          collectionId={selectedCollectionForStatusUpdate.id}
          collectionName={selectedCollectionForStatusUpdate.name}
          currentCollectionStatus={selectedCollectionForStatusUpdate.status}
          isOpen={isCollectionStatusUpdateDialogOpen}
          onClose={() => setIsCollectionStatusUpdateDialogOpen(false)}
        />
      )}
      {selectedCollectionForResponsible && (
        <EditResponsibleDialog
          collectionId={selectedCollectionForResponsible.id}
          collectionName={selectedCollectionForResponsible.name}
          currentResponsibleUserId={selectedCollectionForResponsible.responsibleId}
          isOpen={isEditResponsibleDialogOpen}
          onClose={() => setIsEditResponsibleDialogOpen(false)}
        />
      )}
    </div>
  );
};

export { Coletas };