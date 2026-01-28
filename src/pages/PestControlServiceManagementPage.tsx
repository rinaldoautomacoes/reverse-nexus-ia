import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Bug, Search, Calendar as CalendarIcon, User, MapPin, Clock, CheckCircle, XCircle, Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { PestControlServiceForm } from "@/components/PestControlServiceForm";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { CollectionAttachmentsDialog } from "@/components/CollectionAttachmentsDialog"; // Re-using for attachments
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importar DropdownMenu components
import { generatePestControlServiceReport } from "@/lib/pest-control-report-utils"; // Importar o novo utilitário

type PestControlService = Tables<'pest_control_services'> & {
  client?: { name: string } | null;
  responsible_user?: { first_name: string; last_name: string } | null;
};
type PestControlServiceInsert = TablesInsert<'pest_control_services'>;
type PestControlServiceUpdate = TablesUpdate<'pest_control_services'>;

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export const PestControlServiceManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PestControlService | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<Enums<'pest_service_status'> | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Enums<'pest_service_priority'> | 'all'>('all');

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false);
  const [selectedServiceAttachments, setSelectedServiceAttachments] = useState<FileAttachment[]>([]);
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false); // Novo estado para controlar o loading da exportação

  const { data: services, isLoading: isLoadingServices, error: servicesError } = useQuery<PestControlService[], Error>({
    queryKey: ['pestControlServices', user?.id, searchTerm, filterDate?.toISOString().split('T')[0], filterStatus, filterPriority],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('pest_control_services')
        .select(`
          *,
          client:clients(name),
          responsible_user:profiles(first_name, last_name)
        `)
        .eq('user_id', user.id)
        .order('service_date', { ascending: true });

      if (searchTerm) {
        query = query.or(
          `address.ilike.%${searchTerm}%,pests_detected.cs.{"%${searchTerm}%"},environment_type.ilike.%${searchTerm}%,observations.ilike.%${searchTerm}%,client.name.ilike.%${searchTerm}%,responsible_user.first_name.ilike.%${searchTerm}%,responsible_user.last_name.ilike.%${searchTerm}%`
        );
      }

      if (filterDate) {
        const formattedDate = format(filterDate, 'yyyy-MM-dd');
        query = query.eq('service_date', formattedDate);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as PestControlService[];
    },
    enabled: !!user?.id,
  });

  const addServiceMutation = useMutation({
    mutationFn: async (newService: PestControlServiceInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar serviços.");
      }
      const { data, error } = await supabase
        .from('pest_control_services')
        .insert({ ...newService, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pestControlServices', user?.id] });
      toast({ title: "Serviço Agendado!", description: "Novo serviço de controle de pragas criado com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar serviço", description: err.message, variant: "destructive" });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (updatedService: PestControlServiceUpdate) => {
      const { data, error } = await supabase
        .from('pest_control_services')
        .update(updatedService)
        .eq('id', updatedService.id as string)
        .eq('user_id', user?.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pestControlServices', user?.id] });
      toast({ title: "Serviço Atualizado!", description: "Serviço de controle de pragas salvo com sucesso." });
      setIsEditDialogOpen(false);
      setEditingService(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar serviço", description: err.message, variant: "destructive" });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('pest_control_services')
        .delete()
        .eq('id', serviceId)
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pestControlServices', user?.id] });
      toast({ title: "Serviço Excluído!", description: "Serviço de controle de pragas removido com sucesso." });
      setIsConfirmDeleteDialogOpen(false);
      setServiceToDelete(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir serviço", description: err.message, variant: "destructive" });
      setIsConfirmDeleteDialogOpen(false);
      setServiceToDelete(null);
    },
  });

  const handleAddService = (data: PestControlServiceInsert) => {
    addServiceMutation.mutate(data);
  };

  const handleUpdateService = (data: PestControlServiceUpdate) => {
    updateServiceMutation.mutate(data);
  };

  const handleDeleteServiceClick = (id: string) => {
    setServiceToDelete(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete);
    }
  };

  const handleEditService = (service: PestControlService) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  const handleViewAttachments = (attachments: FileAttachment[], serviceName: string) => {
    setSelectedServiceAttachments(attachments);
    setSelectedServiceName(serviceName);
    setIsAttachmentsDialogOpen(true);
  };

  const handleExportReport = async (formatType: 'pdf' | 'csv') => {
    if (!services || services.length === 0) {
      toast({ title: "Nenhum serviço para exportar", description: "Não há serviços para gerar o relatório.", variant: "warning" });
      return;
    }
    setIsExporting(true);
    try {
      await generatePestControlServiceReport(services, formatType, "Relatório de Serviços de Controle de Pragas");
      toast({ title: "Exportação Concluída", description: `O relatório de serviços foi exportado com sucesso para ${formatType.toUpperCase()}.` });
    } catch (error: any) {
      console.error("Erro ao exportar relatório de serviços:", error);
      toast({ title: "Erro na Exportação", description: error.message || "Ocorreu um erro ao gerar o relatório.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadgeColor = (status: Enums<'pest_service_status'>) => {
    switch (status) {
      case 'agendado': return 'bg-primary/20 text-primary';
      case 'em_andamento': return 'bg-warning-yellow/20 text-warning-yellow';
      case 'concluido': return 'bg-success-green/20 text-success-green';
      case 'cancelado': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getPriorityBadgeColor = (priority: Enums<'pest_service_priority'>) => {
    switch (priority) {
      case 'urgente': return 'bg-destructive/20 text-destructive';
      case 'contrato': return 'bg-neural/20 text-neural';
      case 'normal': return 'bg-muted/20 text-muted-foreground';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  if (isLoadingServices) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando serviços de controle de pragas...</p>
        </div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar serviços: {servicesError.message}</p>
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
              Gerenciar Serviços de Controle de Pragas
            </h1>
            <p className="text-muted-foreground">
              Agende, edite e acompanhe os serviços de controle de pragas.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, endereço, pragas, técnico ou observações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full md:w-auto justify-start text-left font-normal",
                        !filterDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDate ? (isValid(filterDate) ? format(filterDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Filtrar por data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                {filterDate && (
                  <Button variant="ghost" onClick={() => setFilterDate(undefined)} className="w-full md:w-auto">
                    Limpar Data
                  </Button>
                )}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as Enums<'pest_service_status'> | 'all')}
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full md:w-auto"
                >
                  <option value="all">Todos os Status</option>
                  <option value="agendado">Agendado</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as Enums<'pest_service_priority'> | 'all')}
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full md:w-auto"
                >
                  <option value="all">Todas as Prioridades</option>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                  <option value="contrato">Contrato</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-primary" />
                Meus Serviços
              </CardTitle>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-gradient-secondary hover:bg-gradient-secondary/80" disabled={isExporting || !services || services.length === 0}>
                      {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Gerar Relatório
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportReport('pdf')} disabled={isExporting}>
                      <FileText className="mr-2 h-4 w-4" /> Exportar para PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportReport('csv')} disabled={isExporting}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar para CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo Serviço
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 gradient-text">
                        <Bug className="h-5 w-5" />
                        Agendar Novo Serviço
                      </DialogTitle>
                    </DialogHeader>
                    <PestControlServiceForm
                      onSave={handleAddService}
                      onCancel={() => setIsAddDialogOpen(false)}
                      isPending={addServiceMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {services && services.length > 0 ? (
                services.map((service, index) => (
                  <div
                    key={service.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg">{service.client?.name || 'Cliente Desconhecido'}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {service.address}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Data: {format(new Date(service.service_date), 'dd/MM/yyyy', { locale: ptBR })} {service.service_time && `(${service.service_time})`}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" /> Técnico: {service.responsible_user ? `${service.responsible_user.first_name} ${service.responsible_user.last_name || ''}`.trim() : 'Não atribuído'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bug className="h-3 w-3" /> Pragas: {(service.pests_detected as string[] || []).join(', ') || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Duração Est.: {service.estimated_duration ? `${service.estimated_duration} min` : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          Status: <Badge className={getStatusBadgeColor(service.status)}>{service.status}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          Prioridade: <Badge className={getPriorityBadgeColor(service.priority)}>{service.priority}</Badge>
                        </div>
                        {(service.attachments as FileAttachment[] || []).length > 0 && (
                          <div className="flex items-center gap-1 col-span-full">
                            <Paperclip className="h-3 w-3" /> Anexos: {(service.attachments as FileAttachment[]).length}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-6 px-2 text-xs text-primary hover:bg-primary/10"
                              onClick={() => handleViewAttachments(service.attachments as FileAttachment[], service.client?.name || 'Serviço')}
                            >
                              Ver Anexos
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteServiceClick(service.id)}
                        disabled={deleteServiceMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Bug className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum serviço de controle de pragas agendado.</p>
                  <p className="text-sm">Clique em "Novo Serviço" para agendar um.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingService && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 gradient-text">
                <Edit className="h-5 w-5" />
                Editar Serviço: {editingService.client?.name || 'N/A'}
              </DialogTitle>
            </DialogHeader>
            <PestControlServiceForm
              initialData={editingService}
              onSave={handleUpdateService}
              onCancel={() => setIsEditDialogOpen(false)}
              isPending={updateServiceMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      <ConfirmationDialog
        isOpen={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        title="Confirmar Exclusão de Serviço"
        description="Tem certeza que deseja excluir permanentemente este serviço de controle de pragas? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteService}
        isConfirming={deleteServiceMutation.isPending}
        confirmButtonText="Excluir"
      />

      <CollectionAttachmentsDialog
        collectionName={selectedServiceName}
        attachments={selectedServiceAttachments}
        isOpen={isAttachmentsDialogOpen}
        onClose={() => setIsAttachmentsDialogOpen(false)}
      />
    </div>
  );
};