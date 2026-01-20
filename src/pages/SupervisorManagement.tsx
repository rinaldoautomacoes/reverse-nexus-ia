import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Trash2, Users, Search, User as UserIcon, Phone, Briefcase, Loader2, UserCheck, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CreateTechnicianDialog } from "@/components/CreateTechnicianDialog"; // Reusing for supervisors
import { EditTechnicianDialog } from "@/components/EditTechnicianDialog"; // Reusing for supervisors

type Profile = Tables<'profiles'>;

export const SupervisorManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch ALL profiles to correctly resolve supervisor names (who might be admins or other standard users)
  const { data: allProfiles, isLoading: isLoadingProfiles, error: profilesError } = useQuery<Profile[], Error>({
    queryKey: ['allProfiles', currentUser?.id],
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

  // Filter for supervisors (standard role, as per discussion)
  const supervisors = allProfiles?.filter(profile => profile.role === 'standard') || [];

  const deleteSupervisorMutation = useMutation({
    mutationFn: async (supervisorId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', supervisorId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] });
      toast({ title: "Supervisor excluído!", description: "Supervisor removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir supervisor", description: err.message, variant: "destructive" });
    },
  });

  const handleEditSupervisor = (supervisor: Profile) => {
    setEditingSupervisor(supervisor);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSupervisor = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este supervisor? Esta ação não pode ser desfeita.")) {
      deleteSupervisorMutation.mutate(id);
    }
  };

  const filteredSupervisors = supervisors?.filter(supervisor =>
    supervisor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.team_shift?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando supervisores...</p>
        </div>
      </div>
    );
  }

  if (profilesError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar supervisores: {profilesError.message}</p>
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
              Gerenciar Supervisores
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova os supervisores da sua equipe.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, sobrenome, telefone ou equipe..."
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
                <UserCheck className="h-5 w-5 text-primary" />
                Meus Supervisores
              </CardTitle>
              <CreateTechnicianDialog /> {/* Reusing the dialog for creating technicians/supervisors */}
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredSupervisors && filteredSupervisors.length > 0 ? (
                filteredSupervisors.map((supervisor, index) => (
                  <div
                    key={supervisor.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        {supervisor.first_name} {supervisor.last_name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> Função: {supervisor.role === 'standard' ? 'Supervisor' : supervisor.role}
                        </div>
                        {supervisor.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {supervisor.phone_number}
                          </div>
                        )}
                        {supervisor.team_shift && (
                          <div className="flex items-center gap-1">
                            {supervisor.team_shift === 'day' ? (
                              <Sun className="h-3 w-3" />
                            ) : (
                              <Moon className="h-3 w-3" />
                            )}
                            Equipe: {supervisor.team_shift === 'day' ? 'Dia' : 'Noite'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => {
                          handleEditSupervisor(supervisor);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSupervisor(supervisor.id)}
                        disabled={deleteSupervisorMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum supervisor cadastrado. Clique em "Novo Técnico" para adicionar um.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingSupervisor && (
        <EditTechnicianDialog
          technician={editingSupervisor}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingSupervisor(null);
          }}
        />
      )}
    </div>
  );
};