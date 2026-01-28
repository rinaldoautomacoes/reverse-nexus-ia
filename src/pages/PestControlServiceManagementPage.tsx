import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bug, Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CollectionAttachmentsDialog } from "@/components/CollectionAttachmentsDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generatePestControlServiceReport } from "@/lib/pest-control-report-utils";

// Importando os novos componentes modulares
import { PestControlServiceHeader } from "@/components/pest-control-page/PestControlServiceHeader";
import { PestControlServiceFilters } from "@/components/pest-control-page/PestControlServiceFilters";
import { PestControlServiceCard } from "@/components/pest-control-page/PestControlServiceCard";
import { CreatePestControlServiceDialog } from "@/components/pest-control-page/CreatePestControlServiceDialog";
import { EditPestControlServiceDialog } from "@/components/pest-control-page/EditPestControlServiceDialog";

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
  const [isExporting, setIsExporting] = useState(false);

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

  const handleAddService = useCallback((data: PestControlServiceInsert) => {
    addServiceMutation.mutate(data);
  }, [addServiceMutation]);

  const handleUpdateService = useCallback((data: PestControlServiceUpdate) => {
    updateServiceMutation.mutate(data);
  }, [updateServiceMutation]);

  const handleDeleteServiceClick = useCallback((id: string) => {
    setServiceToDelete(id);
    setIsConfirmDeleteDialogOpen(true);
  }, []);

  const confirmDeleteService = useCallback(() => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete);
    }
  }, [serviceToDelete, deleteServiceMutation]);

  const handleEditService = useCallback((service: PestControlService) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  }, []);

  const handleViewAttachments = useCallback((attachments: FileAttachment[], serviceName: string) => {
    setSelectedServiceAttachments(attachments);
    setSelectedServiceName(serviceName);
    setIsAttachmentsDialogOpen(true);
  }, []);

  const handleExportReport = useCallback(async (formatType: 'pdf' | 'csv') => {
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
  }, [services, toast]);

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
          <PestControlServiceHeader
            title="Gerenciar Serviços de Controle de Pragas"
            description="Agende, edite e acompanhe os serviços de controle de pragas."
          />

          <PestControlServiceFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
          />

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
                <CreatePestControlServiceDialog
                  isOpen={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                  onSave={handleAddService}
                  isPending={addServiceMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {services && services.length > 0 ? (
                services.map((service, index) => (
                  <PestControlServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    onEdit={handleEditService}
                    onDeleteClick={handleDeleteServiceClick}
                    onViewAttachments={handleViewAttachments}
                    isDeleting={deleteServiceMutation.isPending}
                  />
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

      <EditPestControlServiceDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        service={editingService}
        onSave={handleUpdateService}
        isPending={updateServiceMutation.isPending}
      />

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