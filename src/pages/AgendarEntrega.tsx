import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, Calendar as CalendarIcon, User, Phone, Mail, MapPin, Building, Briefcase, Loader2, Hash, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientCombobox } from "@/components/ClientCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { DriverCombobox } from "@/components/DriverCombobox"; // Importar DriverCombobox
import { TransportadoraCombobox } from "@/components/TransportadoraCombobox"; // Importar TransportadoraCombobox

type ColetaInsert = TablesInsert<'coletas'>; // Reutilizando o tipo 'coletas' para entregas
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>; // Adicionar tipo Driver
type Transportadora = Tables<'transportadoras'>; // Adicionar tipo Transportadora

export const AgendarEntrega = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ColetaInsert>({
    parceiro: "",
    endereco: "",
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'), // Usado para data da entrega
    qtd_aparelhos_solicitado: 1,
    modelo_aparelho: "",
    status_coleta: "agendada", // Status inicial para entrega
    observacao: "",
    telefone: "",
    email: "",
    contato: "",
    responsavel: "",
    responsible_user_id: null,
    client_id: null,
    type: "entrega", // Definir como 'entrega'
    user_id: user?.id || "",
    // Novos campos
    cep: "",
    bairro: "",
    cidade: "",
    uf: "",
    localidade: "",
    cnpj: "",
    contrato: "",
    nf_glbl: "",
    nf_metodo: "",
    cep_origem: "",
    cep_destino: "",
    endereco_origem: "",
    endereco_destino: "",
    driver_id: null, // Novo campo
    transportadora_id: null, // Novo campo
  });

  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
    }
  }, [user?.id]);

  const addEntregaMutation = useMutation({
    mutationFn: async (newEntrega: ColetaInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar entregas.");
      }
      const { data, error } = await supabase
        .from('coletas') // Usar a tabela 'coletas' para entregas também
        .insert({ ...newEntrega, user_id: user.id, type: 'entrega' }) // Garantir que o tipo é 'entrega'
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      toast({ title: "Entrega Agendada!", description: "Nova entrega criada com sucesso." });
      navigate('/dashboard-entregas');
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar entrega", description: err.message, variant: "destructive" });
    },
  });

  const handleInputChange = (field: keyof ColetaInsert, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientComboboxSelect = (client: Client | null) => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        parceiro: client.name,
        telefone: client.phone || '',
        email: client.email || '',
        endereco: client.address || '',
        cnpj: client.cnpj || '',
        contato: client.contact_person || '',
        client_id: client.id,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        client_id: null,
        telefone: '',
        email: '',
        endereco: '',
        cnpj: '',
        contato: '',
      }));
    }
  };

  const handleProductComboboxSelect = (product: Product | null) => {
    if (product) {
      setFormData(prev => ({
        ...prev,
        modelo_aparelho: product.code,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        modelo_aparelho: "",
      }));
    }
  };

  const handleResponsibleUserSelect = (userProfile: Profile | null) => {
    setFormData(prev => ({
      ...prev,
      responsible_user_id: userProfile?.id || null,
      responsavel: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : null,
    }));
  };

  const handleDriverSelect = (driver: Driver | null) => {
    setFormData(prev => ({
      ...prev,
      driver_id: driver?.id || null,
    }));
  };

  const handleTransportadoraSelect = (transportadora: Transportadora | null) => {
    setFormData(prev => ({
      ...prev,
      transportadora_id: transportadora?.id || null,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEntregaMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate('/dashboard-entregas')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard de Entregas
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
            Agendar Nova Entrega
          </h1>
          <p className="text-muted-foreground">
            Preencha os detalhes para agendar uma nova entrega.
          </p>
        </div>

        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5 text-primary" />
              Detalhes da Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parceiro">Cliente *</Label>
                  <ClientCombobox
                    value={formData.parceiro || ''}
                    onValueChange={(name) => handleInputChange("parceiro", name)}
                    onClientSelect={handleClientComboboxSelect}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato">Pessoa de Contato</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contato"
                      placeholder="Nome do contato"
                      className="pl-10"
                      value={formData.contato || ''}
                      onChange={(e) => handleInputChange("contato", e.target.value)}
                      disabled={addEntregaMutation.isPending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      placeholder="(XX) XXXXX-XXXX"
                      className="pl-10"
                      value={formData.telefone || ''}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                      disabled={addEntregaMutation.isPending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@cliente.com"
                      className="pl-10"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={addEntregaMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço de Entrega *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endereco"
                    placeholder="Endereço completo para entrega"
                    className="pl-10"
                    value={formData.endereco || ''}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                    required
                    disabled={addEntregaMutation.isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previsao_coleta">Data da Entrega *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal pl-10",
                          !formData.previsao_coleta && "text-muted-foreground"
                        )}
                        disabled={addEntregaMutation.isPending}
                      >
                        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        {formData.previsao_coleta ? format(new Date(formData.previsao_coleta), "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.previsao_coleta ? new Date(formData.previsao_coleta) : undefined}
                        onSelect={(date) => handleInputChange("previsao_coleta", date ? format(date, 'yyyy-MM-dd') : null)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="qtd_aparelhos_solicitado"
                      type="number"
                      placeholder="1"
                      className="pl-10"
                      value={formData.qtd_aparelhos_solicitado || 0}
                      onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || 0)}
                      required
                      min={1}
                      disabled={addEntregaMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo_aparelho">Tipo de Material *</Label>
                <ProductCombobox
                  value={formData.modelo_aparelho || ''}
                  onValueChange={(code) => handleInputChange("modelo_aparelho", code)}
                  onProductSelect={handleProductComboboxSelect}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driver">Motorista</Label>
                  <DriverCombobox
                    value={formData.driver_id}
                    onValueChange={(id) => handleInputChange("driver_id", id)}
                    onDriverSelect={handleDriverSelect}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportadora">Transportadora</Label>
                  <TransportadoraCombobox
                    value={formData.transportadora_id}
                    onValueChange={(id) => handleInputChange("transportadora_id", id)}
                    onTransportadoraSelect={handleTransportadoraSelect}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible_user">Responsável pela Entrega</Label>
                <ResponsibleUserCombobox
                  value={formData.responsible_user_id || null}
                  onValueChange={(id) => handleInputChange("responsible_user_id", id)}
                  onUserSelect={handleResponsibleUserSelect}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observações</Label>
                <Textarea
                  id="observacao"
                  placeholder="Informações adicionais sobre a entrega..."
                  value={formData.observacao || ''}
                  onChange={(e) => handleInputChange("observacao", e.target.value)}
                  rows={4}
                  disabled={addEntregaMutation.isPending}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard-entregas')}
                  disabled={addEntregaMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                  disabled={addEntregaMutation.isPending}
                >
                  {addEntregaMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4" />
                  )}
                  Agendar Entrega
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};