import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Calendar as CalendarIcon, User, Phone, Mail, MapPin, Building, Briefcase, Loader2, Hash } from "lucide-react";
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

type ColetaInsert = TablesInsert<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;

export const AgendarColeta = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ColetaInsert>({
    parceiro: "",
    endereco: "",
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
    qtd_aparelhos_solicitado: 1,
    modelo_aparelho: "",
    status_coleta: "pendente",
    observacao: "",
    telefone: "",
    email: "",
    contato: "",
    responsavel: "",
    responsible_user_id: null,
    client_id: null,
    type: "coleta",
    user_id: user?.id || "", // Preencher com o user.id do contexto
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
  });

  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
    }
  }, [user?.id]);

  const addColetaMutation = useMutation({
    mutationFn: async (newColeta: ColetaInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar coletas.");
      }
      const { data, error } = await supabase
        .from('coletas')
        .insert({ ...newColeta, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      toast({ title: "Coleta Agendada!", description: "Nova coleta criada com sucesso." });
      navigate('/coletas-dashboard');
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar coleta", description: err.message, variant: "destructive" });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addColetaMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate('/coletas-dashboard')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard de Coletas
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
            Agendar Nova Coleta
          </h1>
          <p className="text-muted-foreground">
            Preencha os detalhes para agendar uma nova coleta.
          </p>
        </div>

        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-primary" />
              Detalhes da Coleta
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
                      disabled={addColetaMutation.isPending}
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
                      disabled={addColetaMutation.isPending}
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
                      disabled={addColetaMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço de Coleta *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endereco"
                    placeholder="Endereço completo para coleta"
                    className="pl-10"
                    value={formData.endereco || ''}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                    required
                    disabled={addColetaMutation.isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previsao_coleta">Data da Coleta *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal pl-10",
                          !formData.previsao_coleta && "text-muted-foreground"
                        )}
                        disabled={addColetaMutation.isPending}
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
                      disabled={addColetaMutation.isPending}
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

              <div className="space-y-2">
                <Label htmlFor="responsible_user">Responsável pela Coleta</Label>
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
                  placeholder="Informações adicionais sobre a coleta..."
                  value={formData.observacao || ''}
                  onChange={(e) => handleInputChange("observacao", e.target.value)}
                  rows={4}
                  disabled={addColetaMutation.isPending}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/coletas-dashboard')}
                  disabled={addColetaMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                  disabled={addColetaMutation.isPending}
                >
                  {addColetaMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="mr-2 h-4 w-4" />
                  )}
                  Agendar Coleta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};