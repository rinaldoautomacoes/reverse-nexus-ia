import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Truck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { EntregaForm } from "@/components/EntregaForm";
import { EditEntregaDialog } from "@/components/EditEntregaDialog";
import { CollectionStatusUpdateDialog } from "@/components/CollectionStatusUpdateDialog";
import { EditResponsibleDialog } from "@/components/EditResponsibleDialog";
import { ItemData } from "@/components/coleta-form-sections/ColetaItemRow";
import { formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

// Import new modular components
import { EntregasHeader } from "@/components/entregas-ativas/EntregasHeader";
import { EntregasFilters } from "@/components/entregas-ativas/EntregasFilters";
import { EntregaListItem } from "@/components/entregas-ativas/EntregaListItem";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type Entrega = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null;
  attachments?: FileAttachment[] | null;
};
type EntregaInsert = TablesInsert<'coletas'>;

interface EntregasAtivasProps {
  selectedYear: string;
}

export const EntregasAtivas: React.FC<EntregasAtivasProps> = ({ selectedYear }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [isEditResponsibleDialogOpen, setIsEditResponsibleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntrega, setEditingEntrega] = useState<Entrega | null>(null);
  const [selectedEntregaForStatus, setSelectedEntregaForStatus] = useState<{ id: string; name: string; status: string } | null>(null);
  const [selectedEntregaForResponsible, setSelectedEntregaForResponsible] = useState<{ id: string; name: string; responsible_user_id: string | null } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const { data: entregas, isLoading: isLoadingEntregas, error: entregasError } = useQuery<Entrega[], Error>({
    queryKey: ['entregasAtivas', user?.id, searchTerm, filterDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('coletas')
        .select(`
          *,
          driver:drivers(name),
          transportadora:transportadoras(name),
          items(*)
        `)
        .eq('user_id', user.id)
        .eq('type', 'entrega')
        .neq('status_coleta', 'concluida')
        .order('previsao_coleta', { ascending: true });

      if (searchTerm) {
        query = query.or(
          `parceiro.ilike.%${searchTerm}%,endereco_origem.ilike.%${searchTerm}%,endereco_destino.ilike.%${searchTerm}%,modelo_aparelho.ilike.%${searchTerm}%,status_coleta.ilike.%${searchTerm}%,unique_number.ilike.%${searchTerm}%,client_control.ilike.%${searchTerm}%,contrato.ilike.%${searchTerm}%,nf_glbl.ilike.%${searchTerm}%,partner_code.ilike.%${searchTerm}%`
        );
      }

      if (filterDate) {
        const formattedDate = format(filterDate, 'yyyy-MM-dd');
        query = query.eq('previsao_coleta', formattedDate);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Entrega[];
    },
    enabled: !!user?.id,
  });

  const addEntregaMutation = useMutation({
    mutationFn: async (data: { entrega: EntregaInsert; items: ItemData[]; attachments: FileAttachment[] }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar entregas.");
      }
      
      const entregaToInsert: EntregaInsert = {
        ...data.entrega,
        user_id: user.id,
        type: 'entrega',
        modelo_aparelho: formatItemsForColetaModeloAparelho(data.items),
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(data.items),
        attachments: data.attachments,
      };

      const { data: insertedEntrega, error: entregaError } = await supabase
        .from('coletas')
        .insert(entregaToInsert)
        .select()
        .single();
      
      if (entregaError) throw new Error(entregaError.message);

      for (const item of data.items) {
        if (item.modelo_aparelho && item.qtd_aparelhos_solicitado && item.qtd_aparelhos_solicitado > 0) {
          const newItem: TablesInsert<'items'> = {
            user_id: user.id,
            collection_id: insertedEntrega.id,
            name: item.modelo_aparelho,
            description: item.descricaoMaterial,
            quantity: item.qtd_aparelhos_solicitado,
            status: insertedEntrega.status_coleta || 'pendente',
          };
          const { error: itemError } = await supabase.from('items').insert(newItem);
          if (itemError) {
            console.error("Erro ao inserir item na tabela 'items':", itemError.message);
          }
        }
      }

      return insertedEntrega;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Entrega Agendada!", description: "Nova entrega criada com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar entrega", description: err.message, variant: "destructive" });
    },
  });

  const deleteEntregaMutation = useMutation({
    mutationFn: async (entregaId: string) => {
      const { error } = await supabase
        .from('coletas')
        .delete()
        .eq('id', entregaId)
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Entrega Excluída!", description: "Entrega removida com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir entrega", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteEntrega = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.")) {
      deleteEntregaMutation.mutate(id);
    }
  };

  const handleEditEntrega = (entrega: Entrega) => {
    setEditingEntrega(entrega);
    setIsEditDialogOpen(true);
  };

  const handleWhatsAppClick = (entrega: Entrega) => {
    if (entrega.telefone && entrega.parceiro && entrega.previsao_coleta) {
      const cleanedPhone = entrega.telefone.replace(/\D/g, '');
      const formattedDate = isValid(new Date(entrega.previsao_coleta)) ? format(new Date(entrega.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
      const transportadoraName = entrega.transportadora?.name ? ` pela transportadora ${entrega.transportadora.name}` : '';
      const message = `Olá ${entrega.parceiro},\n\nGostaríamos de confirmar sua entrega agendada para o dia ${formattedDate}${transportadoraName}. Número da Entrega: ${entrega.unique_number}.`;
      window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast({ title: "Dados incompletos", description: "Telefone, nome do parceiro ou data de previsão da entrega não disponíveis.", variant: "destructive" });
    }
  };

  const handleEmailClick = (entrega: Entrega) => {
    if (entrega.email && entrega.parceiro && entrega.previsao_coleta) {
      const formattedDate = isValid(new Date(entrega.previsao_coleta)) ? format(new Date(entrega.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
      const transportadoraName = entrega.transportadora?.name ? ` pela transportadora ${entrega.transportadora.name}` : '';
      const subject = encodeURIComponent(`Confirmação de Agendamento de Entrega - ${entrega.parceiro} - ${entrega.unique_number}`);
      const body = encodeURIComponent(`Olá ${entrega.parceiro},\n\nGostaríamos de confirmar sua entrega agendada para o dia ${formattedDate}${transportadoraName}. Número da Entrega: ${entrega.unique_number}.\n\nAtenciosamente,\nSua Equipe de Logística`);
      window.open(`mailto:${entrega.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      toast({ title: "Dados incompletos", description: "Email, nome do parceiro ou data de previsão da entrega não disponíveis.", variant: "destructive" });
    }
  };

  const handleUpdateStatus = (id: string, name: string, status: string) => {
    setSelectedEntregaForStatus({ id, name, status });
    setIsStatusUpdateDialogOpen(true);
  };

  const handleUpdateResponsible = (id: string, name: string, responsibleUserId: string | null) => {
    setSelectedEntregaForResponsible({ id, name, responsible_user_id: responsibleUserId });
    setIsEditResponsibleDialogOpen(true);
  };

  const handleAddEntrega = (data: EntregaInsert, items: ItemData[], attachments: FileAttachment[]) => {
    addEntregaMutation.mutate({ entrega: data, items, attachments });
  };

  const isFormDisabled = addEntregaMutation.isPending || deleteEntregaMutation.isPending || isLoadingEntregas;

  if (isLoadingEntregas) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando entregas ativas...</p>
        </div>
      </div>
    );
  }

  if (entregasError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar entregas: {entregasError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <EntregasHeader />
        <EntregasFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          isFormDisabled={isFormDisabled}
        />

        <Card className="card-futuristic mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Minhas Entregas Ativas
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Entrega
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] bg-card border-primary/20 max-h-[calc(100vh-150px)] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 gradient-text">
                    <Truck className="h-5 w-5" />
                    Agendar Nova Entrega
                  </DialogTitle>
                </DialogHeader>
                <EntregaForm
                  onSave={handleAddEntrega}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isPending={addEntregaMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {entregas && entregas.length > 0 ? (
              entregas.map((entrega, index) => (
                <EntregaListItem
                  key={entrega.id}
                  entrega={entrega}
                  index={index}
                  onEdit={handleEditEntrega}
                  onDelete={handleDeleteEntrega}
                  onWhatsApp={handleWhatsAppClick}
                  onEmail={handleEmailClick}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateResponsible={handleUpdateResponsible}
                  isDeleting={deleteEntregaMutation.isPending}
                />
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhuma entrega ativa encontrada.</p>
                <p className="text-sm">Agende uma nova entrega para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedEntregaForStatus && (
        <CollectionStatusUpdateDialog
          collectionId={selectedEntregaForStatus.id}
          collectionName={selectedEntregaForStatus.name}
          currentCollectionStatus={selectedEntregaForStatus.status}
          isOpen={isStatusUpdateDialogOpen}
          onClose={() => setIsStatusUpdateDialogOpen(false)}
        />
      )}

      {selectedEntregaForResponsible && (
        <EditResponsibleDialog
          collectionId={selectedEntregaForResponsible.id}
          collectionName={selectedEntregaForResponsible.name}
          currentResponsibleUserId={selectedEntregaForResponsible.responsible_user_id}
          isOpen={isEditResponsibleDialogOpen}
          onClose={() => setIsEditResponsibleDialogOpen(false)}
        />
      )}

      {editingEntrega && (
        <EditEntregaDialog
          entrega={editingEntrega}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingEntrega(null);
          }}
        />
      )}
    </div>
  );
};