import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, Search, CheckCircle, Calendar as CalendarIcon, User, MapPin, Hash, Truck, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Coleta = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
};

interface ColetasConcluidasProps {
  selectedYear: string;
}

const ColetasConcluidas: React.FC<ColetasConcluidasProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const { data: coletas, isLoading: isLoadingColetas, error: coletasError } = useQuery<Coleta[], Error>({
    queryKey: ['coletasConcluidas', user?.id, searchTerm, filterDate?.toISOString().split('T')[0], selectedYear],
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
        .eq('type', 'coleta') // Filtrar apenas coletas
        .eq('status_coleta', 'concluida') // Apenas coletas concluídas
        .gte('created_at', `${selectedYear}-01-01T00:00:00Z`)
        .lte('created_at', `${selectedYear}-12-31T23:59:59Z`)
        .order('previsao_coleta', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `parceiro.ilike.%${searchTerm}%,endereco.ilike.%${searchTerm}%,modelo_aparelho.ilike.%${searchTerm}%,responsavel.ilike.%${searchTerm}%`
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-success-green/20 text-success-green'; // neon-cyan
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
                    placeholder="Buscar por parceiro, endereço, modelo ou responsável..."
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
                        <MapPin className="h-3 w-3" /> {coleta.endereco}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Concluída em: {coleta.previsao_coleta ? format(new Date(coleta.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Qtd: {coleta.qtd_aparelhos_solicitado}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" /> Material: {coleta.modelo_aparelho}
                        </div>
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
                          <CheckCircle className="h-3 w-3" /> Status: <Badge className={getStatusBadgeColor(coleta.status_coleta)}>{getStatusText(coleta.status_coleta)}</Badge>
                        </div>
                      </div>
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
    </div>
  );
};

export default ColetasConcluidas;