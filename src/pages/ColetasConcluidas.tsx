import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, Search, CheckCircle, Calendar as CalendarIcon, User, MapPin, Hash, Truck, Building, MessageSquare, Send, Edit, Trash2, Clock, DollarSign, Tag, Home, Flag, ClipboardList, FileText, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns"; // Importar isValid
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";
import { EditColetaDialog } from "@/components/EditColetaDialog";
import { CollectionStatusUpdateDialog } from "@/components/CollectionStatusUpdateDialog";
import { EditResponsibleDialog } from "@/components/EditResponsibleDialog";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type Coleta = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null; // Adicionado items relation
  attachments?: FileAttachment[] | null; // Adicionado attachments
};

interface ColetasConcluidasProps {
  selectedYear: string;
}

const ColetasConcluidas: React.FC<ColetasConcluidasProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingColeta, setEditingColeta] = useState<Coleta | null>(null);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [selectedCollectionForStatus, setSelectedCollectionForStatus] = useState<{ id: string; name: string; status: string } | null>(null);
  const [isEditResponsibleDialogOpen, setIsEditResponsibleDialogOpen] = useState(false);
  const [selectedCollectionForResponsible, setSelectedCollectionForResponsible] = useState<{ id: string; name: string; responsible_user_id: string | null } | null>(null);

  const { data: coletas, isLoading: isLoadingColetas, error: coletasError } = useQuery<Coleta[], Error>({
    queryKey: ['coletasConcluidas', user?.id, searchTerm, filterDate?.toISOString().split('T')[0], selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('coletas')
        .select(`
          *,
          driver:drivers(name),
          transportadora:transportadoras(name),
          items(*)
        `) // Adicionado items(*)
        .eq('user_id', user.id)
        .eq('type', 'coleta')
        .eq('status_coleta', 'concluida')
        .gte('previsao_coleta', `${selectedYear}-01-01`) // Alterado para previsao_coleta
        .lt('previsao_coleta', `${parseInt(selectedYear) + 1}-01-01`) // Alterado para previsao_coleta
        .order('previsao_coleta', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `parceiro.ilike.%${searchTerm}%,endereco_origem.ilike.%${searchTerm}%,endereco_destino.ilike.%${searchTerm}%,modelo_aparelho.ilike.%${searchTerm}%,responsavel.ilike.%${searchTerm}%,unique_number.ilike.%${searchTerm}%,client_control.ilike.%${searchTerm}%,contrato.ilike.%${searchTerm}%,nf_glbl.ilike.%${searchTerm}%,partner_code.ilike.%${searchTerm}%`
        );
      }

      if (filterDate) {
        const formattedDate = format(filterDate, 'yyyy-MM-dd');
        query = query.eq('previsao_coleta', formattedDate);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Coleta[];
    },
    enabled: !!user?.id,
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
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', user?.id] });
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-success-green/20 text-success-green';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

  if (isLoadingColetas) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando coletas concluídas...</p>
        </div>
      </div>
    );
  }

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
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Coletas Concluídas
            </h1>
            <p className="text-muted-foreground">
              Histórico de todas as coletas que foram finalizadas.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por parceiro, endereço, modelo, responsável, número único, controle do cliente, contrato ou CÓD. PARC..."
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
                      {filterDate ? (isValid(new Date(filterDate)) ? format(new Date(filterDate), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Filtrar por data"}
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
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Minhas Coletas Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coletas && coletas.length > 0 ? (
                coletas.map((coleta, index) => (
                  <div
                    key={coleta.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg">{coleta.parceiro}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {coleta.unique_number}
                        {coleta.client_control && (
                          <span className="ml-2 flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" /> {coleta.client_control}
                          </span>
                        )}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        {coleta.endereco_origem && (
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3" /> Origem: {coleta.endereco_origem}
                          </div>
                        )}
                        {coleta.endereco_destino && (
                          <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3" /> Destino: {coleta.endereco_destino}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Concluída em: {coleta.previsao_coleta ? (isValid(new Date(coleta.previsao_coleta)) ? format(new Date(coleta.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida') : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Qtd Total: {getTotalQuantityOfItems(coleta.items)}
                        </div>
                        <div className="flex items-center gap-1 col-span-full">
                          <Package className="h-3 w-3" /> Materiais: {formatItemsForColetaModeloAparelho(coleta.items)}
                        </div>
                        {coleta.contrato && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Nr. Contrato: {coleta.contrato}
                          </div>
                        )}
                        {coleta.nf_glbl && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" /> CONTRATO SANKHYA: {coleta.nf_glbl}
                          </div>
                        )}
                        {coleta.partner_code && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" /> CÓD. PARC: {coleta.partner_code}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" /> Responsável: {coleta.responsavel || 'Não atribuído'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Motorista: {coleta.driver?.name || 'Não atribuído'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" /> Transportadora: {coleta.transportadora?.name || 'Não atribuída'}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Frete: {coleta.freight_value ? `R$ ${coleta.freight_value.toFixed(2)}` : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Status: <Badge className={getStatusBadgeColor(coleta.status_coleta)}>{getStatusText(coleta.status_coleta)}</Badge>
                        </div>
                        {coleta.attachments && coleta.attachments.length > 0 && (
                          <div className="flex items-center gap-1 col-span-full">
                            <Paperclip className="h-3 w-3" /> Anexos: {coleta.attachments.length}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => handleEditColeta(coleta)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-success-green text-success-green hover:bg-success-green/10"
                        onClick={() => handleWhatsAppClick(coleta)}
                        disabled={!coleta.telefone}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neural text-neural hover:bg-neural/10"
                        onClick={() => handleEmailClick(coleta)}
                        disabled={!coleta.email}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        E-mail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => {
                          setSelectedCollectionForStatus({ id: coleta.id, name: coleta.parceiro || 'Coleta', status: coleta.status_coleta });
                          setIsStatusUpdateDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => {
                          setSelectedCollectionForResponsible({ id: coleta.id, name: coleta.parceiro || 'Coleta', responsible_user_id: coleta.responsible_user_id });
                          setIsEditResponsibleDialogOpen(true);
                        }}
                      >
                        <User className="mr-1 h-3 w-3" />
                        Responsável
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteColeta(coleta.id)}
                        disabled={deleteColetaMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma coleta concluída encontrada para {selectedYear}.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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

export default ColetasConcluidas;