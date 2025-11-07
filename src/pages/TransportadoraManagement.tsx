import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Building, Search, Phone, Mail, MapPin, Hash, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { TransportadoraForm } from "@/components/TransportadoraForm";

type Transportadora = Tables<'transportadoras'>;
type TransportadoraInsert = TablesInsert<'transportadoras'>;
type TransportadoraUpdate = TablesUpdate<'transportadoras'>;

export const TransportadoraManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransportadora, setEditingTransportadora] = useState<Transportadora | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transportadoras, isLoading: isLoadingTransportadoras, error: transportadorasError } = useQuery<Transportadora[], Error>({
    queryKey: ['transportadoras', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transportadoras')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const addTransportadoraMutation = useMutation({
    mutationFn: async (newTransportadora: TransportadoraInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar transportadoras.");
      }
      const { data, error } = await supabase
        .from('transportadoras')
        .insert({ ...newTransportadora, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras', user?.id] });
      toast({ title: "Transportadora adicionada!", description: "Nova transportadora criada com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar transportadora", description: err.message, variant: "destructive" });
    },
  });

  const updateTransportadoraMutation = useMutation({
    mutationFn: async (updatedTransportadora: TransportadoraUpdate) => {
      const { data, error } = await supabase
        .from('transportadoras')
        .update(updatedTransportadora)
        .eq('id', updatedTransportadora.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras', user?.id] });
      toast({ title: "Transportadora atualizada!", description: "Transportadora salva com sucesso." });
      setIsEditDialogOpen(false);
      setEditingTransportadora(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar transportadora", description: err.message, variant: "destructive" });
    },
  });

  const deleteTransportadoraMutation = useMutation({
    mutationFn: async (transportadoraId: string) => {
      const { error } = await supabase
        .from('transportadoras')
        .delete()
        .eq('id', transportadoraId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras', user?.id] });
      toast({ title: "Transportadora excluída!", description: "Transportadora removida com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir transportadora", description: err.message, variant: "destructive" });
    },
  });

  const handleAddTransportadora = (data: TransportadoraInsert) => {
    addTransportadoraMutation.mutate(data);
  };

  const handleUpdateTransportadora = (data: TransportadoraUpdate) => {
    updateTransportadoraMutation.mutate(data);
  };

  const handleDeleteTransportadora = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transportadora?")) {
      deleteTransportadoraMutation.mutate(id);
    }
  };

  const filteredTransportadoras = transportadoras?.filter(transportadora =>
    transportadora.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportadora.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportadora.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportadora.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportadora.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingTransportadoras) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando transportadoras...</p>
        </div>
      </div>
    );
  }

  if (transportadorasError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar transportadoras: {transportadorasError.message}</p>
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
              Gerenciar Transportadoras
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova as transportadoras parceiras.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, contato, email, telefone ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Minhas Transportadoras
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Transportadora
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <Building className="h-5 w-5" />
                      Adicionar Nova Transportadora
                    </DialogTitle>
                  </DialogHeader>
                  <TransportadoraForm
                    onSave={handleAddTransportadora}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isPending={addTransportadoraMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredTransportadoras && filteredTransportadoras.length > 0 ? (
                filteredTransportadoras.map((transportadora, index) => (
                  <div
                    key={transportadora.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg">{transportadora.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        {transportadora.contact_person && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" /> {transportadora.contact_person}
                          </div>
                        )}
                        {transportadora.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {transportadora.phone}
                          </div>
                        )}
                        {transportadora.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {transportadora.email}
                          </div>
                        )}
                        {transportadora.cnpj && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" /> {transportadora.cnpj}
                          </div>
                        )}
                        {transportadora.address && (
                          <div className="flex items-center gap-1 col-span-full">
                            <MapPin className="h-3 w-3" /> {transportadora.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isEditDialogOpen && editingTransportadora?.id === transportadora.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingTransportadora(transportadora);
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
                              <Building className="h-5 w-5" />
                              Editar Transportadora
                            </DialogTitle>
                          </DialogHeader>
                          {editingTransportadora && editingTransportadora.id === transportadora.id && (
                            <TransportadoraForm
                              initialData={editingTransportadora}
                              onSave={handleUpdateTransportadora}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingTransportadora(null);
                              }}
                              isPending={updateTransportadoraMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTransportadora(transportadora.id)}
                        disabled={deleteTransportadoraMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma transportadora cadastrada. Clique em "Nova Transportadora" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};