import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Users, Search, User as UserIcon, Mail, Phone, Briefcase, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserForm } from "@/components/UserForm"; // Reusing the UserForm component

type Profile = Tables<'profiles'> & { supervisor?: { first_name: string | null, last_name: string | null } | null }; // Adicionado supervisor relation
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

export const TechnicianManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: technicians, isLoading: isLoadingTechnicians, error: techniciansError } = useQuery<Profile[], Error>({
    queryKey: ['technicians', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          supervisor:profiles(first_name, last_name)
        `) // Fetch supervisor's name
        .eq('role', 'standard') // Filter for 'standard' role (assuming technicians are standard users)
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Profile[];
    },
    enabled: !!currentUser?.id,
  });

  const addTechnicianMutation = useMutation({
    mutationFn: async (newTechnician: ProfileInsert & { email?: string; password?: string }) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar técnicos.");
      }

      if (!newTechnician.email || !newTechnician.password) {
        throw new Error("Email e senha são obrigatórios para criar um novo técnico.");
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error("Sessão de autenticação ausente. Faça login novamente.");
      }

      const { email, password, first_name, last_name, phone_number, avatar_url, supervisor_id } = newTechnician;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name,
          last_name,
          role: 'standard', // Always 'standard' for technicians
          phone_number,
          avatar_url,
          supervisor_id, // Pass supervisor_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn(`Failed to create user ${email}: ${errorData.error}`);
        // If user already exists, try to update profile directly
        if (errorData.error?.includes('User already registered')) {
          const { data: existingUser, error: fetchUserError } = await supabase.auth.admin.getUserByEmail(email);
          if (fetchUserError || !existingUser?.user) {
            console.error(`Could not fetch existing user ${email}: ${fetchUserError?.message}`);
            throw new Error(`Usuário ${email} já existe, mas não foi possível atualizar o perfil.`);
          }
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({
              first_name: first_name,
              last_name: last_name,
              phone_number: phone_number,
              role: 'standard',
              supervisor_id: supervisor_id, // Update supervisor_id
            })
            .eq('id', existingUser.user.id);
          if (updateProfileError) {
            console.error(`Failed to update profile for ${email}: ${updateProfileError.message}`);
            throw new Error(`Usuário ${email} já existe, mas falha ao atualizar o perfil.`);
          } else {
            return { message: 'User profile updated successfully', user: existingUser.user.id };
          }
        }
        throw new Error(errorData.error || "Falha ao criar usuário técnico.");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['supervisorsList', currentUser?.id] }); // Invalidate supervisor list as well
      toast({ title: "Técnico adicionado!", description: "Novo técnico criado com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar técnico", description: err.message, variant: "destructive" });
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: async (updatedTechnician: ProfileUpdate) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedTechnician)
        .eq('id', updatedTechnician.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['supervisorsList', currentUser?.id] }); // Invalidate supervisor list as well
      toast({ title: "Técnico atualizado!", description: "Técnico salvo com sucesso." });
      setIsEditDialogOpen(false);
      setEditingTechnician(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar técnico", description: err.message, variant: "destructive" });
    },
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (technicianId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', technicianId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['supervisorsList', currentUser?.id] }); // Invalidate supervisor list as well
      toast({ title: "Técnico excluído!", description: "Técnico removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir técnico", description: err.message, variant: "destructive" });
    },
  });

  const handleAddTechnician = (data: ProfileInsert & { email?: string; password?: string }) => {
    addTechnicianMutation.mutate({
      ...data,
      role: 'standard', // Ensure role is 'standard' for technicians
    });
  };

  const handleUpdateTechnician = (data: ProfileUpdate) => {
    updateTechnicianMutation.mutate(data);
  };

  const handleDeleteTechnician = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este técnico? Esta ação não pode ser desfeita.")) {
      deleteTechnicianMutation.mutate(id);
    }
  };

  const filteredTechnicians = technicians?.filter(technician =>
    technician.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.supervisor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.supervisor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingTechnicians) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando técnicos...</p>
        </div>
      </div>
    );
  }

  if (techniciansError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar técnicos: {techniciansError.message}</p>
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
              Gerenciar Técnicos
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova os técnicos da sua equipe.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, sobrenome, telefone ou supervisor..."
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
                <Users className="h-5 w-5 text-primary" />
                Meus Técnicos
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Técnico
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <Users className="h-5 w-5" />
                      Adicionar Novo Técnico
                    </DialogTitle>
                  </DialogHeader>
                  <UserForm
                    onSave={handleAddTechnician}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isPending={addTechnicianMutation.isPending}
                    initialData={{ role: 'standard' }} // Pre-fill role for technicians
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredTechnicians && filteredTechnicians.length > 0 ? (
                filteredTechnicians.map((technician, index) => (
                  <div
                    key={technician.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        {technician.first_name} {technician.last_name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> Função: {technician.role === 'standard' ? 'Técnico' : technician.role}
                        </div>
                        {technician.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {technician.phone_number}
                          </div>
                        )}
                        {technician.supervisor && (
                          <div className="flex items-center gap-1 col-span-full">
                            <UserIcon className="h-3 w-3" /> Supervisor: {technician.supervisor.first_name} {technician.supervisor.last_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isEditDialogOpen && editingTechnician?.id === technician.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingTechnician(technician);
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
                              <Users className="h-5 w-5" />
                              Editar Técnico
                            </DialogTitle>
                          </DialogHeader>
                          {editingTechnician && editingTechnician.id === technician.id && (
                            <UserForm
                              initialData={editingTechnician}
                              onSave={handleUpdateTechnician}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingTechnician(null);
                              }}
                              isPending={updateTechnicianMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTechnician(technician.id)}
                        disabled={deleteTechnicianMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum técnico cadastrado. Clique em "Novo Técnico" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};