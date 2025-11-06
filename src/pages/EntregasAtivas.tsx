import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Truck, Search, Clock, Package, CheckCircle, User, Phone, Mail, MapPin, Hash, Calendar as CalendarIcon, Building, MessageSquare, Send, DollarSign, Tag, Home, Flag, ClipboardList, FileText, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate, TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { CollectionStatusUpdateDialog } from "@/components/CollectionStatusUpdateDialog";
import { EditResponsibleDialog } from "@/components/EditResponsibleDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";
import { EntregaForm } from "@/components/EntregaForm";
import { EditEntregaDialog } from "@/components/EditEntregaDialog";
import { ItemData } from "@/components/coleta-form-sections/ColetaItemRow"; // Importa a interface ItemData

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type Entrega = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null; // Adicionado items relation
  attachments?: FileAttachment[] | null; // Adicionado attachments
};
type EntregaInsert = TablesInsert<'coletas'>;

interface EntregasAtivasProps {
  selectedYear: string;
}

export const EntregasAtivas: React.FC<EntregasAtivasProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
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
        `) // Adicionado items(*)
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
        modelo_aparelho: formatItemsForColetaModeloAparelho(data.items), // Resumo dos itens
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(data.items), // Quantidade total
        attachments: data.attachments, // Salvar os anexos
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
      const formattedDate = format(new Date(entrega.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR });
      const transportadoraName = entrega.transportadora?.name ? ` pela transportadora ${entrega.transportadora.name}` : '';
      const message = `Olá ${entrega.parceiro},\n\nGostaríamos de confirmar sua entrega agendada para o dia ${formattedDate}${transportadoraName}. Número da Entrega: ${entrega.unique_number}.`;
      window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast({ title: "Dados incompletos", description: "Telefone, nome do parceiro ou data de previsão da entrega não disponíveis.", variant: "destructive" });
    }
  };

  const handleEmailClick = (entrega: Entrega) => {
    if (entrega.email && entrega.parceiro && entrega.previsao_coleta) {
      const formattedDate = format(new Date(entrega.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR });
      const transportadoraName = entrega.transportadora?.name ? ` pela transportadora ${entrega.transportadora.name}` : '';
      const subject = encodeURIComponent(`Confirmação de Agendamento de Entrega - ${entrega.parceiro} - ${entrega.unique_number}`);
      const body = encodeURIComponent(`Olá ${entrega.parceiro},\n\nGostaríamos de confirmar sua entrega agendada para o dia ${formattedDate}${transportadoraName}. Número da Entrega: ${entrega.unique_number}.\n\nAtenciosamente,\nSua Equipe de Logística`);
      window.open(`mailto:${entrega.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      toast({ title: "Dados incompletos", description: "Email, nome do parceiro ou data de previsão da entrega não disponíveis.", variant: "destructive" });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-destructive/20 text-destructive';
      case 'agendada':
        return 'bg-warning-yellow/20 text-warning-yellow';
      case 'concluida':
        return 'bg-success-green/20 text-success-green';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'agendada':
        return 'Em Trânsito';
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

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
              Entregas Ativas
            </h1>
            <p className="text-muted-foreground">
              Gerencie todas as entregas que ainda não foram concluídas.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por parceiro, endereço, modelo, status, número único, controle do cliente, contrato ou CÓD. PARC..."
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
                      {filterDate ? format(filterDate, "PPP", { locale: ptBR }) : "Filtrar por data"}
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
                  {/* EntregaForm now handles attachments internally */}
                  <EntregaForm
                    onSave={({ entrega, items, attachments }) => addEntregaMutation.mutate({ entrega, items, attachments })}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isPending={addEntregaMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {entregas && entregas.length > 0 ? (
                entregas.map((entrega, index) => (
                  <div
                    key={entrega.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg">{entrega.parceiro}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {entrega.unique_number}
                        {entrega.client_control && (
                          <span className="ml-2 flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" /> {entrega.client_control}
                          </span>
                        )}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        {entrega.endereco_origem && (
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3" /> Origem: {entrega.endereco_origem}
                          </div>
                        )}
                        {entrega.endereco_destino && (
                          <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3" /> Destino: {entrega.endereco_destino}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Previsão: {entrega.previsao_coleta ? format(new Date(entrega.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Qtd Total: {getTotalQuantityOfItems(entrega.items)}
                        </div>
                        <div className="flex items-center gap-1 col-span-full">
                          <Package className="h-3 w-3" /> Materiais: {formatItemsForColetaModeloAparelho(entrega.items)}
                        </div>
                        {entrega.contrato && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Nr. Contrato: {entrega.contrato}
                          </div>
                        )}
                        {entrega.nf_glbl && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" /> CONTRATO SANKHYA: {entrega.nf_glbl}
                          </div>
                        )}
                        {entrega.partner_code && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" /> CÓD. PARC: {entrega.partner_code}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" /> Responsável: {entrega.responsavel || 'Não atribuído'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Motorista: {entrega.driver?.name || 'Não atribuído'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" /> Transportadora: {entrega.transportadora?.name || 'Não atribuída'}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Frete: {entrega.freight_value ? `R$ ${entrega.freight_value.toFixed(2)}` : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Status: <Badge className={getStatusBadgeColor(entrega.status_coleta)}>{getStatusText(entrega.status_coleta)}</Badge>
                        </div>
                        {entrega.attachments && entrega.attachments.length > 0 && (
                          <div className="flex items-center gap-1 col-span-full">
                            <Paperclip className="h-3 w-3" /> Anexos: {entrega.attachments.length}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => handleEditEntrega(entrega)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-success-green text-success-green hover:bg-success-green/10"
                        onClick={() => handleWhatsAppClick(entrega)}
                        disabled={!entrega.telefone || !entrega.parceiro || !entrega.previsao_coleta}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neural text-neural hover:bg-neural/10"
                        onClick={() => handleEmailClick(entrega)}
                        disabled={!entrega.email || !entrega.parceiro || !entrega.previsao_coleta}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        E-mail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => {
                          setSelectedEntregaForStatus({ id: entrega.id, name: entrega.parceiro || 'Entrega', status: entrega.status_coleta });
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
                          setSelectedEntregaForResponsible({ id: entrega.id, name: entrega.parceiro || 'Entrega', responsible_user_id: entrega.responsible_user_id });
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
                        onClick={() => handleDeleteEntrega(entrega.id)}
                        disabled={deleteEntregaMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
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