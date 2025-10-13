import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowLeft, Package, MapPin, Search, Filter, Eye, Edit, Trash2, MessageSquareText, Mail, RefreshCcw, Clock, CheckCircle, ListChecks, Tag, Box, User as UserIcon, Truck } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CollectionStatusUpdateDialog } from "@/components/CollectionStatusUpdateDialog";
import { EditResponsibleDialog } from "@/components/EditResponsibleDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { cn } from "@/lib/utils";
import { EditEntregaForm } from "@/components/EditEntregaForm"; // Importar o novo componente

type Coleta = Tables<'coletas'>;
type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Item = Tables<'items'>;
type Profile = Tables<'profiles'>;

type ColetaWithResponsibleProfile = Coleta & {
  responsible_user_profile: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null;
};

interface EntregasConcluidasListProps {
  selectedYear: string;
}

export const EntregasConcluidasList: React.FC<EntregasConcluidasListProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntrega, setSelectedEntrega] = useState<ColetaWithResponsibleProfile | null>(null);
  const [editingEntrega, setEditingEntrega] = useState<Coleta | null>(null);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCollectionStatusUpdateDialogOpen, setIsCollectionStatusUpdateDialogOpen] = useState(false);
  const [selectedCollectionForStatusUpdate, setSelectedCollectionForStatusUpdate] = useState<{ id: string, name: string, status: string } | null>(null);
  const [isEditResponsibleDialogOpen, setIsEditResponsibleDialogOpen] = useState(false);
  const [selectedCollectionForResponsible, setSelectedCollectionForResponsible] = useState<{ id: string, name: string, responsibleId: string | null } | null>(null);

  // Novos estados para os filtros
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [responsibleUserFilterId, setResponsibleUserFilterId] = useState<string | null>(null);

  // Estados para controlar a abertura dos Popovers de data
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  // Fechar calendários quando dialogs são abertos
  useEffect(() => {
    if (isViewDetailsDialogOpen || isEditDialogOpen) {
      setIsStartDatePickerOpen(false);
      setIsEndDatePickerOpen(false);
    }
  }, [isViewDetailsDialogOpen, isEditDialogOpen]);

  // Query para buscar as entregas (coletas com status 'concluida')
  const { data: entregas, isLoading: isLoadingEntregas, error: entregasError } = useQuery<Coleta[], Error>({
    queryKey: ['entregasConcluidas', user?.id, selectedYear, searchTerm, startDateFilter, endDateFilter, responsibleUserFilterId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('coletas')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'entrega') // FILTRAR POR TIPO 'entrega'
        .eq('status_coleta', 'concluida'); // Filtra por entregas concluídas
      
      // Determine the effective start and end dates for the query
      const effectiveStartDate = startDateFilter 
        ? format(startDateFilter, 'yyyy-MM-dd') 
        : `${selectedYear}-01-01`;
      
      const effectiveEndDate = endDateFilter 
        ? format(endDateFilter, 'yyyy-MM-dd') 
        : `${selectedYear}-12-31`;

      query = query.gte('previsao_coleta', effectiveStartDate);
      query = query.lte('previsao_coleta', effectiveEndDate);

      if (responsibleUserFilterId) {
        query = query.eq('responsible_user_id', responsibleUserFilterId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  // Query para buscar todos os perfis (para mapear o responsável)
  const { data: profiles } = useQuery<Profile[], Error>({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  // Mapeia os perfis para um objeto para fácil acesso
  const profilesMap = new Map<string, Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>>();
  profiles?.forEach(p => profilesMap.set(p.id, p));

  // Combina as entregas com os dados do perfil do responsável
  const entregasWithProfiles: ColetaWithResponsibleProfile[] = entregas?.map(entrega => ({
    ...entrega,
    responsible_user_profile: entrega.responsible_user_id ? profilesMap.get(entrega.responsible_user_id) || null : null,
  })) || [];

  const { data: itemsForSelectedEntrega, isLoading: isLoadingItemsForEntrega, error: itemsForEntregaError } = useQuery<Item[], Error>({
    queryKey: ['itemsForCollection', selectedEntrega?.id],
    queryFn: async () => {
      if (!selectedEntrega?.id || !user?.id) return [];
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('collection_id', selectedEntrega.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!selectedEntrega?.id && !!user?.id,
  });

  const updateEntregaMutation = useMutation({
    mutationFn: async (updatedEntrega: ColetaUpdate) => {
      const { data, error } = await supabase
        .from('coletas')
        .update(updatedEntrega)
        .eq('id', updatedEntrega.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidasStatusChart', user?.id, selectedYear] });
      toast({ title: "Entrega atualizada!", description: "As informações da entrega foram atualizadas com sucesso." });
      setIsEditDialogOpen(false);
      setEditingEntrega(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar entrega", description: err.message, variant: "destructive" });
    },
  });

  const deleteEntregaMutation = useMutation({
    mutationFn: async (entregaId: string) => {
      const { error } = await supabase
        .from('coletas')
        .delete()
        .eq('id', entregaId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidasStatusChart', user?.id, selectedYear] });
      toast({ title: "Entrega excluída!", description: "A entrega foi removida com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir entrega", description: err.message, variant: "destructive" });
    },
  });

  const handleUpdateEntrega = (updatedEntrega: ColetaUpdate) => {
    updateEntregaMutation.mutate(updatedEntrega);
  };

  const handleDeleteEntrega = (entregaId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta entrega?")) {
      deleteEntregaMutation.mutate(entregaId);
    }
  };

  const handleStatusChange = (entregaId: string, newStatus: 'pendente' | 'concluida' | 'agendada') => {
    updateEntregaMutation.mutate({ id: entregaId, status_coleta: newStatus });
  };

  const handleOpenCollectionStatusUpdateDialog = (entrega: Coleta) => {
    setSelectedCollectionForStatusUpdate({ 
      id: entrega.id, 
      name: entrega.parceiro || 'Entrega',
      status: entrega.status_coleta || 'agendada'
    });
    setIsCollectionStatusUpdateDialogOpen(true);
  };

  const handleOpenEditResponsibleDialog = (entrega: Coleta) => {
    setSelectedCollectionForResponsible({
      id: entrega.id,
      name: entrega.parceiro || 'Entrega',
      responsibleId: entrega.responsible_user_id || null,
    });
    setIsEditResponsibleDialogOpen(true);
  };

  const handleSendWhatsApp = (entrega: Coleta) => {
    if (entrega.telefone) {
      const message = encodeURIComponent(`Olá ${entrega.contato || entrega.parceiro}, sobre a entrega agendada para ${entrega.previsao_coleta ? format(new Date(entrega.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'} no endereço ${entrega.endereco}.`);
      window.open(`https://wa.me/${entrega.telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
    } else {
      toast({
        title: "Telefone não disponível",
        description: "Não há um número de telefone cadastrado para esta entrega.",
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = (entrega: Coleta) => {
    if (entrega.email) {
      const subject = encodeURIComponent(`Informações sobre a Entrega - ${entrega.parceiro}`);
      const body = encodeURIComponent(`Prezado(a) ${entrega.contato || entrega.parceiro},\n\nEste é um email referente à entrega agendada para ${entrega.previsao_coleta ? format(new Date(entrega.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'} no endereço ${entrega.endereco}.\n\nAtenciosamente,\nEquipe LogiReverseIA`);
      window.open(`mailto:${entrega.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      toast({
        title: "Email não disponível",
        description: "Não há um endereço de email cadastrado para esta entrega.",
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
        return 'Entregue';
      case 'agendada':
        return 'Em Trânsito';
      case 'pendente':
        return 'Pendente';
      default:
        return status || 'Desconhecido';
    }
  };

  const filteredEntregas = entregasWithProfiles?.filter(entrega => {
    const matchesSearch = (entrega.parceiro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entrega.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entrega.responsible_user_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entrega.responsible_user_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  }) || [];

  if (isLoadingEntregas) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando entregas concluídas...</p>
        </div>
      </div>
    );
  }

  if (entregasError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar entregas concluídas: {entregasError?.message}</p>
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
              Entregas Concluídas ({selectedYear})
            </h1>
            <p className="text-muted-foreground">
              Visualize todas as entregas que foram finalizadas no ano de {selectedYear}
            </p>
          </div>

          <Card className="card-futuristic bg-gradient-primary border-primary/20 text-primary-foreground">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8" />
                <div>
                  <p className="text-sm font-medium opacity-80">Total de Entregas Concluídas</p>
                  <p className="text-3xl font-bold font-orbitron">{entregasWithProfiles?.length || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70">Entregas finalizadas</p>
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
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto relative">
                  {/* Data Inicial */}
                  <div className="w-full md:w-48">
                    <Label htmlFor="start-date" className="sr-only">Data Inicial</Label>
                    <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDateFilter && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDateFilter ? (
                            format(startDateFilter, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Data Inicial</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 z-50 bg-popover border shadow-lg" side="bottom" align="start">
                        <Calendar
                          mode="single"
                          selected={startDateFilter}
                          onSelect={(date) => {
                            setStartDateFilter(date);
                            setIsStartDatePickerOpen(false);
                          }}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Data Final */}
                  <div className="w-full md:w-48">
                    <Label htmlFor="end-date" className="sr-only">Data Final</Label>
                    <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDateFilter && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDateFilter ? (
                            format(endDateFilter, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Data Final</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 z-50 bg-popover border shadow-lg" side="bottom" align="start">
                        <Calendar
                          mode="single"
                          selected={endDateFilter}
                          onSelect={(date) => {
                            setEndDateFilter(date);
                            setIsEndDatePickerOpen(false);
                          }}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Responsável */}
                  <div className="w-full md:w-48">
                    <Label htmlFor="responsible-filter" className="sr-only">Responsável</Label>
                    <ResponsibleUserCombobox
                      value={responsibleUserFilterId}
                      onValueChange={setResponsibleUserFilterId}
                      onUserSelect={() => {}}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredEntregas.map((entrega, index) => (
              <Card 
                key={entrega.id} 
                className="card-futuristic border-0 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{entrega.parceiro}</h3>
                        <Badge className={getStatusColor(entrega.status_coleta)}>
                          {getStatusText(entrega.status_coleta)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {entrega.endereco}
                        </div>
                        {/* REMOVIDO: A linha que exibia o ícone de calendário e a data */}
                        <div>
                          <strong>{entrega.qtd_aparelhos_solicitado || 0}</strong> produtos - {entrega.modelo_aparelho || 'N/A'}
                        </div>
                        {entrega.responsible_user_profile ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={entrega.responsible_user_profile.avatar_url || undefined} />
                              <AvatarFallback>{entrega.responsible_user_profile.first_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">Responsável:</span> {`${entrega.responsible_user_profile.first_name || ''} ${entrega.responsible_user_profile.last_name || ''}`.trim()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span className="font-medium">Responsável:</span> N/A
                          </div>
                        )}
                      </div>
                      
                      {entrega.observacao && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {entrega.observacao}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isViewDetailsDialogOpen && selectedEntrega?.id === entrega.id} onOpenChange={setIsViewDetailsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-accent text-accent hover:bg-accent/10" 
                            onClick={() => {
                              setSelectedEntrega(entrega);
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
                              Detalhes da Entrega
                            </DialogTitle>
                          </DialogHeader>
                          {selectedEntrega && (
                            <div className="space-y-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Cliente</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEntrega.parceiro}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Pessoa de Contato</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEntrega.contato || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Telefone</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEntrega.telefone || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Email</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEntrega.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <Badge className={getStatusColor(selectedEntrega.status_coleta)}>
                                    {getStatusText(selectedEntrega.status_coleta)}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Data</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEntrega.previsao_coleta ? format(new Date(selectedEntrega.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Quantidade de Aparelhos Solicitada</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEntrega.qtd_aparelhos_solicitado || 0} produtos</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Tipo de Aparelho (Geral)</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEntrega.modelo_aparelho || 'N/A'}</p>
                                </div>
                                {selectedEntrega.responsible_user_profile ? (
                                  <div>
                                    <Label className="text-sm font-medium">Responsável</Label>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={selectedEntrega.responsible_user_profile.avatar_url || undefined} />
                                        <AvatarFallback>{selectedEntrega.responsible_user_profile.first_name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      {`${selectedEntrega.responsible_user_profile.first_name || ''} ${selectedEntrega.responsible_user_profile.last_name || ''}`.trim()}
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
                                <p className="text-sm text-muted-foreground">{selectedEntrega.endereco}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Observações</Label>
                                <p className="text-sm text-muted-foreground">{selectedEntrega.observacao || "Nenhuma observação"}</p>
                              </div>

                              <div className="space-y-4 mt-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2 gradient-text">
                                  <Package className="h-5 w-5" />
                                  Produtos da Entrega
                                </h3>
                                {isLoadingItemsForEntrega ? (
                                  <div className="text-center text-muted-foreground">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p>Carregando produtos...</p>
                                  </div>
                                ) : itemsForEntregaError ? (
                                  <div className="text-center text-destructive">
                                    <p>Erro ao carregar produtos: {itemsForEntregaError.message}</p>
                                  </div>
                                ) : itemsForSelectedEntrega && itemsForSelectedEntrega.length > 0 ? (
                                  <div className="space-y-3">
                                    {itemsForSelectedEntrega.map((item, itemIndex) => (
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
                                    <p>Nenhum produto associado a esta entrega.</p>
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
                        onClick={() => handleSendWhatsApp(entrega)}
                        disabled={!entrega.telefone}
                      >
                        <MessageSquareText className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>

                      <Button 
                        size="sm" 
                        className="bg-gradient-primary hover:bg-gradient-primary/80"
                        onClick={() => handleSendEmail(entrega)}
                        disabled={!entrega.email}
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
                          <DropdownMenuItem onClick={() => handleStatusChange(entrega.id, 'pendente')}>
                              <Clock className="mr-2 h-3 w-3 text-destructive" /> Marcar como Pendente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(entrega.id, 'agendada')}>
                              <Calendar className="mr-2 h-3 w-3 text-warning-yellow" /> Marcar como Em Trânsito
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(entrega.id, 'concluida')}>
                              <CheckCircle className="mr-2 h-3 w-3 text-success-green" /> Marcar como Entregue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => handleOpenCollectionStatusUpdateDialog(entrega)}
                      >
                        <ListChecks className="mr-1 h-3 w-3" />
                        Situação da Entrega
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neural text-neural hover:bg-neural/10"
                        onClick={() => handleOpenEditResponsibleDialog(entrega)}
                      >
                        <UserIcon className="mr-1 h-3 w-3" />
                        Editar Responsável
                      </Button>

                      <Dialog open={isEditDialogOpen && editingEntrega?.id === entrega.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-gradient-primary hover:bg-gradient-primary/80" 
                            onClick={() => {
                                setEditingEntrega(entrega);
                                setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Entrega</DialogTitle>
                          </DialogHeader>
                          {editingEntrega && editingEntrega.id === entrega.id && (
                            <EditEntregaForm 
                              entrega={editingEntrega} 
                              onUpdate={handleUpdateEntrega}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingEntrega(null);
                              }}
                              isPending={updateEntregaMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteEntrega(entrega.id)}
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

          {filteredEntregas.length === 0 && (
            <Card className="card-futuristic">
              <CardContent className="p-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma entrega concluída encontrada</h3>
                <p className="text-muted-foreground">
                  As entregas finalizadas aparecerão aqui.
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

export default EntregasConcluidasList;