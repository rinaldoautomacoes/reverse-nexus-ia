import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Importar os novos componentes modulares
import { ColetasHeader } from "@/components/coletas-page/ColetasHeader";
import { ColetasFilters } from "@/components/coletas-page/ColetasFilters";
import { ColetasListSection } from "@/components/coletas-page/ColetasListSection";
import { CreateColetaDialog } from "@/components/coletas-page/CreateColetaDialog";

// Importar diálogos existentes
import { CollectionStatusUpdateDialog } from "@/components/CollectionStatusUpdateDialog";
import { EditResponsibleDialog } from "@/components/EditResponsibleDialog";
import { EditColetaDialog } from "@/components/EditColetaDialog";

// Importar tipos e utilitários
import { ItemData } from "@/components/coleta-form-sections/ColetaItemRow";
import { formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type Coleta = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null;
  attachments?: FileAttachment[] | null;
};
type ColetaInsert = TablesInsert<'coletas'>;

interface ColetasProps {
  selectedYear: string;
}

export const Coletas: React.FC<ColetasProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [isEditResponsibleDialogOpen, setIsEditResponsibleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingColeta, setEditingColeta] = useState<Coleta | null>(null);
  const [selectedCollectionForStatus, setSelectedCollectionForStatus] = useState<{ id: string; name: string; status: string } | null>(null);
  const [selectedCollectionForResponsible, setSelectedCollectionForResponsible] = useState<{ id: string; name: string; responsible_user_id: string | null } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const { data: coletas, isLoading: isLoadingColetas, error: coletasError } = useQuery<Coleta[], Error>({
    queryKey: ['coletasAtivas', user?.id, searchTerm, filterDate?.toISOString().split('T')[0]],
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
        .eq('type', 'coleta')
        .neq('status_coleta', 'concluida')
        .order('previsao_coleta', { ascending: true });

      if (searchTerm) {
        query = query.or(
          `parceiro.ilike.%${searchTerm}%,endereco_origem.ilike.%${searchTerm}%,endereco_destino.ilike.%${searchTerm}%,modelo_aparelho.ilike.%${searchTerm}%,status_coleta.ilike.%${searchTerm}%,unique_number.ilike.%${searchTerm}%,client_control.ilike.%${searchTerm}%,contrato.ilike.%${searchTerm}%,nf_glbl.ilike.%${searchTerm}%,partner_code.ilike.%${searchTerm}%`
        );
      }

      if (filterDate) {
        const formattedDate = filterDate.toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'
        query = query.eq('previsao_coleta', formattedDate);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Coleta[];
    },
    enabled: !!user?.id,
  });

  const addColetaMutation = useMutation({
    mutationFn: async (data: { coleta: ColetaInsert; items: ItemData[]; attachments: FileAttachment[] }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar coletas.");
      }
      
      const coletaToInsert: ColetaInsert = {
        ...data.coleta,
        user_id: user.id,
        type: 'coleta',
        modelo_aparelho: formatItemsForColetaModeloAparelho(data.items), // Resumo dos itens
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(data.items), // Quantidade total
        attachments: data.attachments, // Salvar os anexos
      };

      const { data: insertedColeta, error: coletaError } = await supabase
        .from('coletas')
        .insert(coletaToInsert)
        .select()
        .single();
      
      if (coletaError) throw new Error(coletaError.message);

      for (const item of data.items) {
        if (item.modelo_aparelho && item.qtd_aparelhos_solicitado && item.qtd_aparelhos_solicitado > 0) {
          const newItem: TablesInsert<'items'> = {
            user_id: user.id,
            collection_id: insertedColeta.id,
            name: item.modelo_aparelho,
            description: item.descricaoMaterial,
            quantity: item.qtd_aparelhos_solicitado,
            status: insertedColeta.status_coleta || 'pendente',
          };
          const { error: itemError } = await supabase.from('items').insert(newItem);
          if (itemError) {
            console.error("Erro ao inserir item na tabela 'items':", itemError.message);
          }
        }
      }

      return insertedColeta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Coleta Agendada!", description: "Nova coleta criada com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar coleta", description: err.message, variant: "destructive" });
    },
  });

  const deleteColetaMutation = useMutation({
    mutationFn: async (coletaId: string) => {
      const { error } = await supabase
        .from('coletas')
        .delete()
        .eq('id', coletaId)
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Coleta Excluída!", description: "Coleta removida com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir coleta", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteColeta = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta coleta? Esta ação não pode ser desfeita.")) {
      deleteColetaMutation.mutate(id);
    }
  };

  const handleEditColeta = (coleta: Coleta) => {
    setEditingColeta(coleta);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = (id: string, name: string, status: string) => {
    setSelectedCollectionForStatus({ id, name, status });
    setIsStatusUpdateDialogOpen(true);
  };

  const handleUpdateResponsible = (id: string, name: string, responsible_user_id: string | null) => {
    setSelectedCollectionForResponsible({ id, name, responsible_user_id });
    setIsEditResponsibleDialogOpen(true);
  };

  const handleWhatsAppClick = (coleta: Coleta) => {
    if (coleta.telefone) {
      const cleanedPhone = coleta.telefone.replace(/\D/g, '');
      const message = "Olá, tudo bem? Me chamo Rinaldo, representante logístico da empresa Método Telecomunicações, tentei te ligar e não obtive retorno, meu contato é referente ao recolhimento de aparelhos e equipamentos, quando possível me retorne , desde já agradeço.";
      window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast({ title: "Dados incompletos", description: "Telefone do cliente não disponível.", variant: "destructive" });
    }
  };

  const handleEmailClick = (coleta: Coleta) => {
    if (coleta.email) {
      const subject = encodeURIComponent("Contato referente ao recolhimento de aparelhos e equipamentos");
      const body = encodeURIComponent("Olá, tudo bem? Me chamo Rinaldo, representante logístico da empresa Método Telecomunicações, tentei te ligar e não obtive retorno, meu contato é referente ao recolhimento de aparelhos e equipamentos, quando possível me retorne , desde já agradeço.");
      window.open(`mailto:${coleta.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      toast({ title: "Dados incompletos", description: "Email do cliente não disponível.", variant: "destructive" });
    }
  };

  if (coletasError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar coletas: {coletasError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/coletas-dashboard')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard de Coletas
        </Button>

        <div className="space-y-6">
          <ColetasHeader />

          <ColetasFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
          />

          <ColetasListSection
            coletas={coletas}
            isLoading={isLoadingColetas}
            onAddColetaClick={() => setIsAddDialogOpen(true)}
            onEditColeta={handleEditColeta}
            onDeleteColeta={handleDeleteColeta}
            onUpdateStatus={handleUpdateStatus}
            onUpdateResponsible={handleUpdateResponsible}
            onWhatsAppClick={handleWhatsAppClick}
            onEmailClick={handleEmailClick}
            isDeletingColeta={deleteColetaMutation.isPending}
          />
        </div>
      </div>

      <CreateColetaDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={addColetaMutation.mutate}
        isPending={addColetaMutation.isPending}
      />

      {selectedCollectionForStatus && (
        <CollectionStatusUpdateDialog
          collectionId={selectedCollectionForStatus.id}
          collectionName={selectedCollectionForStatus.name}
          currentCollectionStatus={selectedCollectionForStatus.status}
          isOpen={isStatusUpdateDialogOpen}
          onClose={() => setIsStatusUpdateDialogOpen(false)}
        />
      )}

      {selectedCollectionForResponsible && (
        <EditResponsibleDialog
          collectionId={selectedCollectionForResponsible.id}
          collectionName={selectedCollectionForResponsible.name}
          currentResponsibleUserId={selectedCollectionForResponsible.responsible_user_id}
          isOpen={isEditResponsibleDialogOpen}
          onClose={() => setIsEditResponsibleDialogOpen(false)}
        />
      )}

      {editingColeta && (
        <EditColetaDialog
          coleta={editingColeta}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingColeta(null);
          }}
        />
      )}
    </div>
  );
};