import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, User, Search, Filter, Phone, Car, Truck as TruckIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DriverForm } from "@/components/DriverForm"; // Importar o novo formulário

type Driver = Tables<'drivers'>;
type DriverInsert = TablesInsert<'drivers'>;
type DriverUpdate = TablesUpdate<'drivers'>;

export const DriverManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: drivers, isLoading: isLoadingDrivers, error: driversError } = useQuery<Driver[], Error>({
    queryKey: ['drivers', user?.id, statusFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (statusFilter !== "todos") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const addDriverMutation = useMutation({
    mutationFn: async (newDriver: DriverInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar motoristas.");
      }
      const { data, error } = await supabase
        .from('drivers')
        .insert({ ...newDriver, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['routes', user?.id] }); // Invalida rotas que podem usar este motorista
      queryClient.invalidateQueries({ queryKey: ['routes-list', user?.id] }); // Invalida a lista de rotas
      toast({ title: "Motorista adicionado!", description: "Novo motorista cadastrado com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar motorista", description: err.message, variant: "destructive" });
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: async (updatedDriver: DriverUpdate) => {
      const { data, error } = await supabase
        .from('drivers')
        .update(updatedDriver)
        .eq('id', updatedDriver.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['routes', user?.id] }); // Invalida rotas que podem usar este motorista
      queryClient.invalidateQueries({ queryKey: ['routes-list', user?.id] }); // Invalida a lista de rotas
      toast({ title: "Motorista atualizado!", description: "Motorista salvo com sucesso." });
      setIsEditDialogOpen(false);
      setEditingDriver(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar motorista", description: err.message, variant: "destructive" });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['routes', user?.id] }); // Invalida rotas que podem usar este motorista
      queryClient.invalidateQueries({ queryKey: ['routes-list', user?.id] }); // Invalida a lista de rotas
      toast({ title: "Motorista excluído!", description: "Motorista removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir motorista", description: err.message, variant: "destructive" });
    },
  });

  const handleAddDriver = (data: DriverInsert) => {
    addDriverMutation.mutate(data);
  };

  const handleUpdateDriver = (data: DriverUpdate) => {
    updateDriverMutation.mutate(data);
  };

  const handleDeleteDriver = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este motorista? Rotas associadas podem ser afetadas.")) {
      deleteDriverMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    let colorClass = "bg-muted/20 text-muted-foreground";
    let label = status;
    switch (status) {
      case 'disponivel':
        colorClass = "bg-success-green/20 text-success-green";
        label = "Disponível";
        break;
      case 'em_rota':
        colorClass = "bg-warning-yellow/20 text-warning-yellow";
        label = "Em Rota";
        break;
      case 'manutencao':
        colorClass = "bg-destructive/20 text-destructive";
        label = "Em Manutenção";
        break;
      case 'indisponivel':
        colorClass = "bg-ai/20 text-ai"; // Usando ai-purple para indisponível
        label = "Indisponível";
        break;
    }
    return <Badge className={colorClass}>{label}</Badge>;
  };

  const filteredDrivers = drivers?.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingDrivers) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando motoristas...</p>
        </div>
      </div>
    );
  }

  if (driversError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar motoristas: {driversError.message}</p>
        </div>
      </div>
    );
  }

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
              Gerenciar Motoristas
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova os motoristas da sua equipe de transporte.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, telefone ou placa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="em_rota">Em Rota</SelectItem>
                      <SelectItem value="manutencao">Em Manutenção</SelectItem>
                      <SelectItem value="indisponivel">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-primary" />
                Motoristas Cadastrados
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Motorista
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <UserPlus className="h-5 w-5" />
                      Adicionar Novo Motorista
                    </DialogTitle>
                  </DialogHeader>
                  <DriverForm 
                    onSave={handleAddDriver} 
                    onCancel={() => setIsAddDialogOpen(false)} 
                    isPending={addDriverMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredDrivers && filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver, index) => (
                  <div
                    key={driver.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{driver.name}</h3>
                        {getStatusBadge(driver.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        {driver.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {driver.phone}
                          </div>
                        )}
                        {driver.vehicle_type && (
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3" /> {driver.vehicle_type}
                          </div>
                        )}
                        {driver.license_plate && (
                          <div className="flex items-center gap-1 col-span-full">
                            <TruckIcon className="h-3 w-3" /> {driver.license_plate}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isEditDialogOpen && editingDriver?.id === driver.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingDriver(driver);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 gradient-text">
                              <User className="h-5 w-5" />
                              Editar Motorista
                            </DialogTitle>
                          </DialogHeader>
                          {editingDriver && editingDriver.id === driver.id && (
                            <DriverForm
                              initialData={editingDriver}
                              onSave={handleUpdateDriver}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingDriver(null);
                              }}
                              isPending={updateDriverMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteDriver(driver.id)}
                        disabled={deleteDriverMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <TruckIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum motorista cadastrado. Clique em "Novo Motorista" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};