import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowLeft, Package, MapPin, Truck, UserPlus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { ClientCombobox } from "@/components/ClientCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox"; // Importar o novo combobox
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

type ColetaInsert = TablesInsert<'coletas'>;
type Client = Tables<'clients'>;
type ClientInsert = TablesInsert<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>; // Importar o tipo Profile

export const AgendarColeta = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ColetaInsert & { client_id?: string; cep_origem?: string; cep_destino?: string; endereco_origem?: string; endereco_destino?: string }>({
    parceiro: "",
    telefone: "",
    email: "",
    cnpj: "",
    contato: "",
    previsao_coleta: "",
    modelo_aparelho: "",
    qtd_aparelhos_solicitado: 0,
    status_coleta: "pendente",
    observacao: "",
    user_id: user?.id || '',
    responsible_user_id: null,
    type: "coleta",
    cep_origem: "",
    cep_destino: "",
    endereco_origem: "",
    endereco_destino: "",
  });
  const [clientData, setClientData] = useState<ClientInsert>({
    name: "",
    phone: "",
    email: "",
    address: "",
    cnpj: "",
    contact_person: "",
    user_id: user?.id || '',
  });

  const addColetaMutation = useMutation({
    mutationFn: async (newColeta: ColetaInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar coletas.");
      }
      const { data, error } = await supabase
        .from('coletas')
        .insert({ ...newColeta, user_id: user.id, type: 'coleta' }) // Garantir que o tipo seja 'coleta'
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] }); // Invalida as métricas do dashboard
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] }); // Invalida o gráfico de status de produtos
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] }); // Invalida o gráfico de rosca
      toast({
        title: "Coleta agendada com sucesso!",
        description: `Coleta para ${formData.parceiro} agendada para ${new Date(formData.previsao_coleta || '').toLocaleDateString()}.`
      });
      // Reset form
      setFormData({
        parceiro: "",
        telefone: "",
        email: "",
        cnpj: "",
        contato: "",
        previsao_coleta: "",
        modelo_aparelho: "",
        qtd_aparelhos_solicitado: 0,
        status_coleta: "pendente",
        observacao: "",
        user_id: user?.id || '',
        responsible_user_id: null, // Resetar também o responsável
        type: "coleta", // Manter o tipo 'coleta'
        cep_origem: "",
        cep_destino: "",
        endereco_origem: "",
        endereco_destino: "",
      });
      setIsLoading(false);
    },
    onError: (err) => {
      toast({
        title: "Erro ao agendar coleta",
        description: err.message,
        variant: "destructive"
      });
      setIsLoading(false);
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (newClient: ClientInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para cadastrar clientes.");
      }
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...newClient, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      toast({
        title: "Cliente cadastrado!",
        description: `${newClient.name} foi adicionado com sucesso.`
      });
      // Preenche o formulário de coleta com os dados do novo cliente
      setFormData(prev => ({ 
        ...prev, 
        parceiro: newClient.name,
        telefone: newClient.phone || '',
        email: newClient.email || '',
        cnpj: newClient.cnpj || '',
        contato: newClient.contact_person || '',
        client_id: newClient.id,
      }));
      // Reset client form
      setClientData({
        name: "", phone: "", email: "", address: "", cnpj: "", contact_person: "", user_id: user?.id || '',
      });
      setIsClientDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Erro ao cadastrar cliente",
        description: err.message,
        variant: "destructive"
      });
    },
  });

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchAddressFromCEP = async (cep: string, tipo: 'origem' | 'destino') => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado e tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
      
      if (tipo === 'origem') {
        setFormData(prev => ({ ...prev, endereco_origem: endereco }));
      } else {
        setFormData(prev => ({ ...prev, endereco_destino: endereco }));
      }

      toast({
        title: "Endereço encontrado!",
        description: endereco,
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCEPChange = (tipo: 'origem' | 'destino', value: string) => {
    const field = tipo === 'origem' ? 'cep_origem' : 'cep_destino';
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (value.replace(/\D/g, '').length === 8) {
      fetchAddressFromCEP(value, tipo);
    }
  };

  const handleClientInputChange = (field: keyof ClientInsert, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClient = () => {
    if (!clientData.name || !clientData.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o nome e telefone do cliente.",
        variant: "destructive"
      });
      return;
    }
    addClientMutation.mutate(clientData);
  };

  const handleClientComboboxSelect = (client: Client | null) => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        parceiro: client.name,
        telefone: client.phone || '',
        email: client.email || '',
        cnpj: client.cnpj || '',
        contato: client.contact_person || '',
        client_id: client.id,
      }));
    } else {
      // Se o usuário digitou um novo nome ou limpou a seleção
      setFormData(prev => ({
        ...prev,
        parceiro: formData.parceiro,
        telefone: "",
        email: "",
        cnpj: "",
        contato: "",
        client_id: undefined,
      }));
    }
  };

  const handleProductComboboxSelect = (product: Product | null) => {
    if (product) {
      setFormData(prev => ({
        ...prev,
        modelo_aparelho: product.code, // Armazena o código do produto
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        modelo_aparelho: "", // Limpa o modelo se nada for selecionado
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para agendar uma coleta.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.parceiro || !formData.telefone || !formData.endereco_origem || !formData.endereco_destino || !formData.previsao_coleta || formData.qtd_aparelhos_solicitado === 0 || !formData.modelo_aparelho) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios (Cliente, Telefone, Endereço de Origem, Endereço de Destino, Data, Quantidade de Aparelhos e Tipo de Material).",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Verifica se o cliente já existe ou se é um novo cliente a ser cadastrado
    let finalClientId = formData.client_id;
    if (!finalClientId) {
      // Tenta encontrar o cliente pelo nome digitado
      const { data: existingClients, error: searchError } = await supabase
        .from('clients')
        .select('id, name, phone, email, address, cnpj, contact_person')
        .eq('user_id', user.id)
        .eq('name', formData.parceiro)
        .limit(1);

      if (searchError) {
        toast({ title: "Erro ao buscar cliente", description: searchError.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (existingClients && existingClients.length > 0) {
        finalClientId = existingClients[0].id;
      } else {
        // Se não encontrou, cadastra um novo cliente
        const { data: newClient, error: insertClientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: formData.parceiro,
            phone: formData.telefone,
            email: formData.email || null,
            address: formData.endereco_origem, // Usar endereço de origem como endereço do cliente
            cnpj: formData.cnpj || null,
            contact_person: formData.contato || null,
          })
          .select()
          .single();

        if (insertClientError) {
          toast({ title: "Erro ao cadastrar novo cliente", description: insertClientError.message, variant: "destructive" });
          setIsLoading(false);
          return;
        }
        finalClientId = newClient.id;
        queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      }
    }

    // Agora, agende a coleta com o client_id e os dados adicionais
    addColetaMutation.mutate({ 
      ...formData, 
      user_id: user.id, 
      client_id: finalClientId,
      email: formData.email || null,
      cnpj: formData.cnpj || null,
      contato: formData.contato || null,
      responsavel: formData.responsavel || null, // Garante que o campo 'responsavel' seja enviado
      responsible_user_id: formData.responsible_user_id || null, // Garante que o campo 'responsible_user_id' seja enviado
      type: 'coleta', // Garante que o tipo seja 'coleta'
      endereco: formData.endereco_origem, // Usar o endereço de origem para o campo 'endereco' da coleta
      cep: formData.cep_origem, // Adicionado o CEP de origem para o campo 'cep' da coleta
    });
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
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
              Agendar Coleta
            </h1>
            <p className="text-muted-foreground">
              Configure uma nova coleta com otimização inteligente de rota
            </p>
          </div>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Dados da Coleta
              </CardTitle>
              <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 glow-effect rounded-full"
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Cadastrar Novo Cliente
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-name">Nome *</Label>
                        <Input 
                          id="client-name"
                          placeholder="Nome do cliente"
                          value={clientData.name || ''}
                          onChange={(e) => handleClientInputChange("name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-phone">Telefone *</Label>
                        <Input 
                          id="client-phone"
                          placeholder="(11) 99999-9999"
                          value={clientData.phone || ''}
                          onChange={(e) => handleClientInputChange("phone", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-email">Email</Label>
                      <Input 
                        id="client-email"
                        type="email"
                        placeholder="cliente@email.com"
                        value={clientData.email || ''}
                        onChange={(e) => handleClientInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-address">Endereço</Label>
                      <Input 
                        id="client-address"
                        placeholder="Endereço completo"
                        value={clientData.address || ''}
                        onChange={(e) => handleClientInputChange("address", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-cnpj">CNPJ</Label>
                        <Input 
                          id="client-cnpj"
                          placeholder="00.000.000/0000-00"
                          value={clientData.cnpj || ''}
                          onChange={(e) => handleClientInputChange("cnpj", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-contact_person">Contato</Label>
                        <Input 
                          id="client-contact_person"
                          placeholder="Pessoa de contato"
                          value={clientData.contact_person || ''}
                          onChange={(e) => handleClientInputChange("contact_person", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleSaveClient}
                        className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80"
                        disabled={addClientMutation.isPending}
                      >
                        {addClientMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        Cadastrar Cliente
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsClientDialogOpen(false)}
                        className="border-accent text-accent hover:bg-accent/10"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="parceiro">Cliente</Label>
                    <ClientCombobox
                      value={formData.parceiro || ''}
                      onValueChange={(name) => handleInputChange("parceiro", name)}
                      onClientSelect={handleClientComboboxSelect}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input 
                      id="telefone" 
                      placeholder="(11) 99999-9999"
                      value={formData.telefone || ''}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="cliente@email.com"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input 
                      id="cnpj" 
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj || ''}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep_origem">CEP de Origem</Label>
                    <Input 
                      id="cep_origem" 
                      placeholder="00000-000"
                      value={formData.cep_origem || ''}
                      onChange={(e) => handleCEPChange('origem', e.target.value)}
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep_destino">CEP de Destino</Label>
                    <Input 
                      id="cep_destino" 
                      placeholder="00000-000"
                      value={formData.cep_destino || ''}
                      onChange={(e) => handleCEPChange('destino', e.target.value)}
                      maxLength={9}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco-origem">Endereço de Origem</Label>
                    <Input 
                      id="endereco-origem" 
                      placeholder="Endereço completo de origem"
                      value={formData.endereco_origem || ''}
                      onChange={(e) => handleInputChange("endereco_origem", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco-destino">Endereço de Destino</Label>
                    <Input 
                      id="endereco-destino" 
                      placeholder="Endereço completo de destino"
                      value={formData.endereco_destino || ''}
                      onChange={(e) => handleInputChange("endereco_destino", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="contato">Pessoa de Contato</Label>
                  <Input 
                    id="contato" 
                    placeholder="Nome da pessoa de contato"
                    value={formData.contato || ''}
                    onChange={(e) => handleInputChange("contato", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="previsao_coleta">Data da Coleta *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.previsao_coleta && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.previsao_coleta ? (
                            format(parse(formData.previsao_coleta, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.previsao_coleta ? parse(formData.previsao_coleta, "yyyy-MM-dd", new Date()) : undefined}
                          onSelect={(date) => handleInputChange("previsao_coleta", date ? format(date, "yyyy-MM-dd") : "")}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos *</Label>
                    <Input 
                      id="qtd_aparelhos_solicitado" 
                      type="number"
                      placeholder="0"
                      value={formData.qtd_aparelhos_solicitado || 0}
                      onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="modelo_aparelho">Tipo de Material *</Label>
                  <ProductCombobox
                    value={formData.modelo_aparelho || ''}
                    onValueChange={(code) => handleInputChange("modelo_aparelho", code)}
                    onProductSelect={handleProductComboboxSelect}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="responsible_user">Responsável pela Coleta</Label>
                  <ResponsibleUserCombobox
                    value={formData.responsible_user_id || null}
                    onValueChange={(id) => handleInputChange("responsible_user_id", id)}
                    onUserSelect={handleResponsibleUserSelect}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="observacao">Observações</Label>
                  <Textarea 
                    id="observacao" 
                    placeholder="Informações adicionais sobre a coleta..."
                    rows={3}
                    value={formData.observacao || ''}
                    onChange={(e) => handleInputChange("observacao", e.target.value)}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                    disabled={isLoading || addColetaMutation.isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isLoading || addColetaMutation.isPending ? "Agendando..." : "Agendar Coleta"}
                  </Button>
                  {/* Removido o botão "Rota IA" */}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};