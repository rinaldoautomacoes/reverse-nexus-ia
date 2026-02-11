// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, User, Search, Phone, Mail, MapPin, Building, Briefcase, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ClientForm } from "@/components/ClientForm";

type Client = Tables<'clients'>;
type ClientInsert = TablesInsert<'clients'>;
type ClientUpdate = TablesUpdate<'clients'>;

export const ClientManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients, isLoading: isLoadingClients, error: clientsError } = useQuery<Client[], Error>({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const addClientMutation = useMutation({
    mutationFn: async (newClient: ClientInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar clientes.");
      }
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...newClient, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      toast({ title: "Cliente adicionado!", description: "Novo cliente criado com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar cliente", description: err.message, variant: "destructive" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (updatedClient: ClientUpdate) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('id', updatedClient.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      toast({ title: "Cliente atualizado!", description: "Cliente salvo com sucesso." });
      setIsEditDialogOpen(false);
      setEditingClient(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar cliente", description: err.message, variant: "destructive" });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      toast({ title: "Cliente excluído!", description: "Cliente removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir cliente", description: err.message, variant: "destructive" });
    },
  });

  const handleAddClient = (data: ClientInsert) => {
    addClientMutation.mutate(data);
  };

  const handleUpdateClient = (data: ClientUpdate) => {
    updateClientMutation.mutate(data);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteClientMutation.mutate(id);
    }
  };

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cep?.toLowerCase().includes(searchTerm.toLowerCase()) // Incluído o novo campo na busca
  ) || [];

  if (isLoadingClients) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar clientes: {clientsError.message}</p>
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
              Gerenciar Clientes
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova os clientes da sua base.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, contato, email, telefone, CNPJ, Número do Endereço ou CEP..."
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
                <User className="h-5 w-5 text-primary" />
                Meus Clientes
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <User className="h-5 w-5" />
                      Adicionar Novo Cliente
                    </DialogTitle>
                  </DialogHeader>
                  <ClientForm
                    onSave={handleAddClient}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isPending={addClientMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredClients && filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <div
                    key={client.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        {client.contact_person && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {client.contact_person}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {client.email}
                          </div>
                        )}
                        {client.cnpj && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" /> {client.cnpj}
                          </div>
                        )}
                        {client.registration_number && ( // Exibindo o novo campo
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Reg.: {client.registration_number}
                          </div>
                        )}
                        {client.address_number && ( // Exibindo o novo campo
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Nº: {client.address_number}
                          </div>
                        )}
                        {client.cep && ( // Exibindo o novo campo
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> CEP: {client.cep}
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center gap-1 col-span-full">
                            <MapPin className="h-3 w-3" /> Endereço: {client.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isEditDialogOpen && editingClient?.id === client.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingClient(client);
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
                              Editar Cliente
                            </DialogTitle>
                          </DialogHeader>
                          {editingClient && editingClient.id === client.id && (
                            <ClientForm
                              initialData={editingClient}
                              onSave={handleUpdateClient}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingClient(null);
                              }}
                              isPending={updateClientMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClient(client.id)}
                        disabled={deleteClientMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum cliente cadastrado. Clique em "Novo Cliente" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};