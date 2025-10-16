import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Truck, Search, Clock, Package, CheckCircle, User, Phone, Mail, MapPin, Hash, Calendar as CalendarIcon, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { CollectionStatusUpdateDialog } from "@/components/CollectionStatusUpdateDialog"; // Reutilizar para status de entrega
import { EditResponsibleDialog } from "@/components/EditResponsibleDialog"; // Reutilizar para responsável de entrega
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AgendarEntrega } from "./AgendarEntrega"; // Importar o componente de agendamento

type Entrega = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
}; // Reutilizando o tipo 'coletas' para entregas
type EntregaUpdate = TablesUpdate<'coletas'>;

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
          transportadora:transportadoras(name)
        `)
        .eq('user_id', user.id)
        .eq('type', 'entrega') // Filtrar apenas entregas
        .neq('status_coleta', 'concluida') // Excluir entregas concluídas
        .order('previsao_coleta', { ascending: true });

      if (searchTerm) {
        query = query.or(
          `parceiro.ilike.%${searchTerm}%,endereco.ilike.%${searchTerm}%,modelo_aparelho.ilike.%${searchTerm}%,status_coleta.ilike.%${searchTerm}%`
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

  const deleteEntregaMutation = useMutation({
    mutationFn: async (entregaId: string) => {
      const { error } = await supabase
        .from('coletas')
        .delete()
        .eq('id', entregaId)
        .eq('user_id', user?.id); // RLS check
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-destructive/20 text-destructive'; // ai-purple
      case 'agendada':
        return 'bg-warning-yellow/20 text-warning-yellow'; // amarelo
      case 'concluida':
        return 'bg-success-green/20 text-success-green'; // neon-cyan
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
                    placeholder="Buscar por parceiro, endereço, modelo ou status..."
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
                <DialogContent className="sm:max-w-[900px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <Truck className="h-5 w-5" />
                      Agendar Nova Entrega
                    </DialogTitle>
                  </DialogHeader>
                  {/* Renderiza o componente AgendarEntrega dentro do Dialog */}
                  <AgendarEntrega />
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
                        <MapPin className="h-3 w-3" /> {entrega.endereco}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Previsão: {entrega.previsao_coleta ? format(new Date(entrega.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Qtd: {entrega.qtd_aparelhos_solicitado}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" /> Material: {entrega.modelo_aparelho}
                        </div>
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
                          <Clock className="h-3 w-3" /> Status: <Badge className={getStatusBadgeColor(entrega.status_coleta)}>{getStatusText(entrega.status_coleta)}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
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
        <CollectionStatusUpdateDialog // Reutilizando o componente de status
          collectionId={selectedEntregaForStatus.id}
          collectionName={selectedEntregaForStatus.name}
          currentCollectionStatus={selectedEntregaForStatus.status}
          isOpen={isStatusUpdateDialogOpen}
          onClose={() => setIsStatusUpdateDialogOpen(false)}
        />
      )}

      {selectedEntregaForResponsible && (
        <EditResponsibleDialog // Reutilizando o componente de responsável
          collectionId={selectedEntregaForResponsible.id}
          collectionName={selectedEntregaForResponsible.name}
          currentResponsibleUserId={selectedEntregaForResponsible.responsible_user_id}
          isOpen={isEditResponsibleDialogOpen}
          onClose={() => setIsEditResponsibleDialogOpen(false)}
        />
      )}
    </div>
  );
};