import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Users, Search, User as UserIcon, Mail, Phone, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserForm } from "@/components/UserForm"; // Assuming you have a UserForm component

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

export const UserManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); // Renamed to currentUser to avoid conflict

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery<Profile[], Error>({
    queryKey: ['users', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const addUserMutation = useMutation({
    mutationFn: async (newUser: ProfileInsert) => {
      // Note: Adding users via direct profile insert is generally not how Supabase auth works.
      // Typically, you'd invite a user via auth.admin.inviteUserByEmail or auth.signUp,
      // and then a trigger would create a profile. This simplified version assumes direct profile creation.
      // For a real app, consider the full auth flow.
      const { data, error } = await supabase
        .from('profiles')
        .insert(newUser)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUser?.id] });
      toast({ title: "Usuário adicionado!", description: "Novo usuário criado com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar usuário", description: err.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: ProfileUpdate) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedUser)
        .eq('id', updatedUser.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUser?.id] });
      toast({ title: "Usuário atualizado!", description: "Usuário salvo com sucesso." });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar usuário", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Note: Deleting a profile does not delete the associated auth.users entry.
      // For a full user deletion, you'd need auth.admin.deleteUser.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUser?.id] });
      toast({ title: "Usuário excluído!", description: "Usuário removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir usuário", description: err.message, variant: "destructive" });
    },
  });

  const handleAddUser = (data: ProfileInsert) => {
    addUserMutation.mutate(data);
  };

  const handleUpdateUser = (data: ProfileUpdate) => {
    updateUserMutation.mutate(data);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const filteredUsers = users?.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
    // Note: email is not directly in profiles table, would need a join or separate query
  ) || [];

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar usuários: {usersError.message}</p>
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
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova os usuários do sistema.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, sobrenome, role ou telefone..."
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
                Usuários do Sistema
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 gradient-text">
                      <Users className="h-5 w-5" />
                      Adicionar Novo Usuário
                    </DialogTitle>
                  </DialogHeader>
                  <UserForm
                    onSave={handleAddUser}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isPending={addUserMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        {user.first_name} {user.last_name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> Role: {user.role}
                        </div>
                        {user.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {user.phone_number}
                          </div>
                        )}
                        {/* Email is not directly in profile, would need to fetch from auth.users */}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingUser(user);
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
                              Editar Usuário
                            </DialogTitle>
                          </DialogHeader>
                          {editingUser && editingUser.id === user.id && (
                            <UserForm
                              initialData={editingUser}
                              onSave={handleUpdateUser}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingUser(null);
                              }}
                              isPending={updateUserMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isPending}
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
                  <p>Nenhum usuário cadastrado. Clique em "Novo Usuário" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};