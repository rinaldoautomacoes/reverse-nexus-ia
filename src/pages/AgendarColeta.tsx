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

export const AgendarColeta = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    cliente: "",
    telefone: "",
    endereco: "",
    data: "",
    periodo: "",
    tipo: "",
    observacoes: ""
  });
  const [clientData, setClientData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    cnpj: "",
    contato: ""
  });

  const handleInputChange = (field: string, value: string) => {
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
      cliente: clientData.nome,
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

  const handleSubmit = async () => {
    if (!formData.cliente || !formData.telefone || !formData.endereco || !formData.data) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para agendar a coleta.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simular processamento
    setTimeout(() => {
      toast({
        title: "Coleta agendada com sucesso!",
        description: `Coleta para ${formData.cliente} agendada para ${new Date(formData.data).toLocaleDateString()}.`
      });
      
      // Reset form
      setFormData({
        cliente: "",
        telefone: "",
        endereco: "",
        data: "",
        periodo: "",
        tipo: "",
        observacoes: ""
      });
      
      setIsLoading(false);
    }, 1500);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cliente">Cliente *</Label>
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
                    id="cliente" 
                    placeholder="Nome do cliente" 
                    value={formData.cliente}
                    onChange={(e) => handleInputChange("cliente", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input 
                    id="telefone" 
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input 
                  id="endereco" 
                  placeholder="Endereço completo para coleta"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange("endereco", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data da Coleta *</Label>
                  <Input 
                    id="data" 
                    type="date"
                    value={formData.data}
                    onChange={(e) => handleInputChange("data", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodo">Período</Label>
                  <Select value={formData.periodo} onValueChange={(value) => handleInputChange("periodo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã (08h - 12h)</SelectItem>
                      <SelectItem value="tarde">Tarde (13h - 17h)</SelectItem>
                      <SelectItem value="integral">Integral (08h - 17h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Material</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                    <SelectItem value="eletrodomesticos">Eletrodomésticos</SelectItem>
                    <SelectItem value="moveis">Móveis</SelectItem>
                    <SelectItem value="vestuario">Vestuário</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  placeholder="Informações adicionais sobre a coleta..."
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {isLoading ? "Agendando..." : "Agendar Coleta"}
                </Button>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  <Truck className="mr-2 h-4 w-4" />
                  Rota IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};