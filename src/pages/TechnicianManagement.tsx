import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Trash2, Users, Search, User as UserIcon, Phone, Briefcase, Loader2, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CreateTechnicianDialog } from "@/components/CreateTechnicianDialog";
import { EditTechnicianDialog } from "@/components/EditTechnicianDialog";

type Profile = Tables<'profiles'>;

export const TechnicianManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: technicians, isLoading: isLoadingTechnicians, error: techniciansError } = useQuery<Profile[], Error>({
    queryKey: ['technicians', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'standard') // Filter for 'standard' role (assuming technicians are standard users)
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (technicianId: string) => {
      // Note: Deleting a profile does not delete the associated auth.users entry.
      // For a full user deletion, you'd need auth.admin.deleteUser (service role key needed).
      // For now, we only delete the profile.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', technicianId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] }); // Invalidate supervisor list
      toast({ title: "Técnico excluído!", description: "Técnico removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir técnico", description: err.message, variant: "destructive" });
    },
  });

  const handleEditTechnician = (technician: Profile) => {
    setEditingTechnician(technician);
    setIsEditDialogOpen(true);
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
    (technician.supervisor_id && technicians.find(s => s.id === technician.supervisor_id)?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()))
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
                <UserCog className="h-5 w-5 text-primary" />
                Meus Técnicos
              </CardTitle>
              <CreateTechnicianDialog />
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
                          <Briefcase className="h-3 w-3" /> Role: {technician.role === 'standard' ? 'Técnico' : technician.role}
                        </div>
                        {technician.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {technician.phone_number}
                          </div>
                        )}
                        {technician.supervisor_id && (
                          <div className="flex items-center gap-1">
                            <UserCog className="h-3 w-3" /> Supervisor: {technicians.find(s => s.id === technician.supervisor_id)?.first_name || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <EditTechnicianDialog
                        technician={technician}
                        isOpen={isEditDialogOpen && editingTechnician?.id === technician.id}
                        onClose={() => {
                          setIsEditDialogOpen(false);
                          setEditingTechnician(null);
                        }}
                      />
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
                  <UserCog className="h-12 w-12 mx-auto mb-4" />
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