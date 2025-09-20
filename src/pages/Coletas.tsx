import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, MapPin, Calendar, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const EditColetaForm = ({ coleta, onUpdate, onCancel }: { coleta: any, onUpdate: (coleta: any) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState({
    cliente: coleta.cliente,
    endereco: coleta.endereco,
    data: coleta.data,
    periodo: coleta.periodo,
    produtos: coleta.produtos,
    tipo: coleta.tipo,
    observacoes: coleta.observacoes
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...coleta,
      ...formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Input 
            id="cliente"
            value={formData.cliente}
            onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="data">Data</Label>
          <Input 
            id="data"
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="periodo">Período</Label>
          <Select value={formData.periodo} onValueChange={(value) => setFormData({ ...formData, periodo: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Manhã (08h - 12h)">Manhã (08h - 12h)</SelectItem>
              <SelectItem value="Tarde (13h - 17h)">Tarde (13h - 17h)</SelectItem>
              <SelectItem value="Integral (08h - 17h)">Integral (08h - 17h)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="produtos">Quantidade de Produtos</Label>
          <Input 
            id="produtos"
            type="number"
            value={formData.produtos}
            onChange={(e) => setFormData({ ...formData, produtos: parseInt(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue />
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
      </div>
      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input 
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea 
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/80">
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};

const Coletas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedColeta, setSelectedColeta] = useState<any>(null);
  const [editingColeta, setEditingColeta] = useState<any>(null);
  const [coletasData, setColetasData] = useState([
    {
      id: 1,
      cliente: "TechCorp",
      endereco: "Av. Paulista, 1000 - Zona Norte",
      data: "2024-08-15",
      periodo: "Manhã (08h - 12h)",
      produtos: 50,
      tipo: "Eletrônicos",
      status: "agendada",
      observacoes: "Cliente preferencial"
    },
    {
      id: 2,
      cliente: "EcoSolutions",
      endereco: "Rua Verde, 250 - Zona Sul",
      data: "2024-08-14",
      periodo: "Tarde (13h - 17h)",
      produtos: 120,
      tipo: "Eletrodomésticos",
      status: "concluida",
      observacoes: "Coleta realizada com sucesso"
    },
    {
      id: 3,
      cliente: "GreenTech",
      endereco: "Rua Sustentável, 500 - Zona Oeste",
      data: "2024-08-16",
      periodo: "Integral (08h - 17h)",
      produtos: 80,
      tipo: "Móveis",
      status: "pendente",
      observacoes: "Prioridade alta"
    },
    {
      id: 4,
      cliente: "SustainableCorp",
      endereco: "Av. Ambiental, 750 - Centro",
      data: "2024-08-13",
      periodo: "Manhã (08h - 12h)",
      produtos: 200,
      tipo: "Vestuário",
      status: "concluida",
      observacoes: "Coleta mensal"
    },
    {
      id: 5,
      cliente: "RecyclePro",
      endereco: "Rua Circular, 300 - Zona Norte",
      data: "2024-08-17",
      periodo: "Tarde (13h - 17h)",
      produtos: 95,
      tipo: "Eletrônicos",
      status: "agendada",
      observacoes: "Novo cliente"
    }
  ]);

  const handleUpdateColeta = (updatedColeta: any) => {
    setColetasData(coletas => 
      coletas.map(coleta => 
        coleta.id === updatedColeta.id ? updatedColeta : coleta
      )
    );
    setEditingColeta(null);
    toast({
      title: "Coleta atualizada!",
      description: "As informações da coleta foram atualizadas com sucesso.",
    });
  };

  const handleDeleteColeta = (coletaId: number) => {
    setColetasData(coletas => coletas.filter(coleta => coleta.id !== coletaId));
    toast({
      title: "Coleta excluída!",
      description: "A coleta foi removida com sucesso.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-primary/20 text-primary';
      case 'agendada':
        return 'bg-accent/20 text-accent';
      case 'pendente':
        return 'bg-neural/20 text-neural';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'agendada':
        return 'Agendada';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const filteredColetas = coletasData.filter(coleta => {
    const matchesSearch = coleta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coleta.endereco.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || coleta.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
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
              Consultar Coletas
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todas as coletas realizadas
            </p>
          </div>

          {/* Filtros */}
          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="agendada">Agendadas</SelectItem>
                      <SelectItem value="concluida">Concluídas</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Coletas */}
          <div className="grid gap-4">
            {filteredColetas.map((coleta, index) => (
              <Card 
                key={coleta.id} 
                className="card-futuristic border-0 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{coleta.cliente}</h3>
                        <Badge className={getStatusColor(coleta.status)}>
                          {getStatusText(coleta.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {coleta.endereco}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(coleta.data).toLocaleDateString()} - {coleta.periodo}
                        </div>
                        <div>
                          <strong>{coleta.produtos}</strong> produtos - {coleta.tipo}
                        </div>
                      </div>
                      
                      {coleta.observacoes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {coleta.observacoes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10" onClick={() => setSelectedColeta(coleta)}>
                            <Eye className="mr-1 h-3 w-3" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Coleta</DialogTitle>
                          </DialogHeader>
                          {selectedColeta && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Cliente</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.cliente}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <Badge className={getStatusColor(selectedColeta.status)}>
                                    {getStatusText(selectedColeta.status)}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Data</Label>
                                  <p className="text-sm text-muted-foreground">{new Date(selectedColeta.data).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Período</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.periodo}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Quantidade de Produtos</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.produtos} produtos</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Tipo</Label>
                                  <p className="text-sm text-muted-foreground">{selectedColeta.tipo}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Endereço</Label>
                                <p className="text-sm text-muted-foreground">{selectedColeta.endereco}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Observações</Label>
                                <p className="text-sm text-muted-foreground">{selectedColeta.observacoes || "Nenhuma observação"}</p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {coleta.status === 'agendada' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80" onClick={() => setEditingColeta({...coleta})}>
                              <Edit className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Coleta</DialogTitle>
                            </DialogHeader>
                            {editingColeta && (
                              <EditColetaForm 
                                coleta={editingColeta} 
                                onUpdate={handleUpdateColeta}
                                onCancel={() => setEditingColeta(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteColeta(coleta.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredColetas.length === 0 && (
            <Card className="card-futuristic">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma coleta encontrada</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou realizar uma nova busca.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export { Coletas };