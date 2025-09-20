import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Package, MapPin, Calendar, Truck, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";

type ColetaInsert = TablesInsert<'coletas'>;

export const AgendarColeta = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ColetaInsert>({
    parceiro: "",
    telefone: "",
    endereco: "",
    previsao_coleta: "",
    modelo_aparelho: "",
    qtd_aparelhos_solicitado: 0, // Adicionado o campo de quantidade
    status_coleta: "agendada", // Status inicial
    observacao: "",
    user_id: user?.id || '', // Será preenchido com o ID do usuário logado
  });
  const [clientData, setClientData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    cnpj: "",
    contato: ""
  });

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
      toast({
        title: "Coleta agendada com sucesso!",
        description: `Coleta para ${formData.parceiro} agendada para ${new Date(formData.previsao_coleta || '').toLocaleDateString()}.`
      });
      // Reset form
      setFormData({
        parceiro: "",
        telefone: "",
        endereco: "",
        previsao_coleta: "",
        modelo_aparelho: "",
        qtd_aparelhos_solicitado: 0,
        status_coleta: "agendada",
        observacao: "",
        user_id: user?.id || '',
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

  const handleInputChange = (field: keyof ColetaInsert, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientInputChange = (field: string, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClient = () => {
    if (!clientData.nome || !clientData.telefone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o nome e telefone do cliente.",
        variant: "destructive"
      });
      return;
    }

    // Adiciona o novo cliente ao formulário de coleta
    setFormData(prev => ({ 
      ...prev, 
      parceiro: clientData.nome,
      telefone: clientData.telefone,
      endereco: clientData.endereco || prev.endereco
    }));

    // Reset client form
    setClientData({
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      cnpj: "",
      contato: ""
    });

    setIsClientDialogOpen(false);

    toast({
      title: "Cliente cadastrado!",
      description: `${clientData.nome} foi adicionado com sucesso.`
    });
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

    if (!formData.parceiro || !formData.telefone || !formData.endereco || !formData.previsao_coleta || formData.qtd_aparelhos_solicitado === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios (Cliente, Telefone, Endereço, Data e Quantidade de Aparelhos).",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    addColetaMutation.mutate(formData);
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Dados da Coleta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="parceiro">Cliente *</Label>
                      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="border-primary text-primary hover:bg-primary/10"
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
                                <Label htmlFor="client-nome">Nome *</Label>
                                <Input 
                                  id="client-nome"
                                  placeholder="Nome do cliente"
                                  value={clientData.nome}
                                  onChange={(e) => handleClientInputChange("nome", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="client-telefone">Telefone *</Label>
                                <Input 
                                  id="client-telefone"
                                  placeholder="(11) 99999-9999"
                                  value={clientData.telefone}
                                  onChange={(e) => handleClientInputChange("telefone", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="client-email">Email</Label>
                              <Input 
                                id="client-email"
                                type="email"
                                placeholder="cliente@email.com"
                                value={clientData.email}
                                onChange={(e) => handleClientInputChange("email", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="client-endereco">Endereço</Label>
                              <Input 
                                id="client-endereco"
                                placeholder="Endereço completo"
                                value={clientData.endereco}
                                onChange={(e) => handleClientInputChange("endereco", e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="client-cnpj">CNPJ</Label>
                                <Input 
                                  id="client-cnpj"
                                  placeholder="00.000.000/0000-00"
                                  value={clientData.cnpj}
                                  onChange={(e) => handleClientInputChange("cnpj", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="client-contato">Contato</Label>
                                <Input 
                                  id="client-contato"
                                  placeholder="Pessoa de contato"
                                  value={clientData.contato}
                                  onChange={(e) => handleClientInputChange("contato", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                              <Button 
                                onClick={handleSaveClient}
                                className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Cadastrar Cliente
                              </Button>
                              <Button 
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
                    </div>
                    <Input 
                      id="parceiro" 
                      placeholder="Nome do cliente" 
                      value={formData.parceiro || ''}
                      onChange={(e) => handleInputChange("parceiro", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input 
                      id="telefone" 
                      placeholder="(11) 99999-9999"
                      value={formData.telefone || ''}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input 
                    id="endereco" 
                    placeholder="Endereço completo para coleta"
                    value={formData.endereco || ''}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="previsao_coleta">Data da Coleta *</Label>
                    <Input 
                      id="previsao_coleta" 
                      type="date"
                      value={formData.previsao_coleta || ''}
                      onChange={(e) => handleInputChange("previsao_coleta", e.target.value)}
                    />
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
                  <Label htmlFor="modelo_aparelho">Tipo de Material</Label>
                  <Select value={formData.modelo_aparelho || ''} onValueChange={(value) => handleInputChange("modelo_aparelho", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                      <SelectItem value="Eletrodomésticos">Eletrodomésticos</SelectItem>
                      <SelectItem value="Móveis">Móveis</SelectItem>
                      <SelectItem value="Vestuário">Vestuário</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
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
                    disabled={isLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {isLoading ? "Agendando..." : "Agendar Coleta"}
                  </Button>
                  <Button type="button" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                    <Truck className="mr-2 h-4 w-4" />
                    Rota IA
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};