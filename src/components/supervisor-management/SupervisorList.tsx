import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Users, User as UserIcon, Phone, Briefcase, Loader2, UserCog } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Tables } from '@/integrations/supabase/types_generated';

type Profile = Tables<'profiles'>;

interface SupervisorListProps {
  supervisors: Profile[];
  searchTerm: string;
  onEditSupervisor: (supervisor: Profile) => void;
  onManageTeam: (supervisor: Profile) => void;
  isLoadingTechnicians: boolean; // Pass this down to show loading state for team count
  allTechnicians: Profile[] | undefined; // Pass all technicians to count team members
}

export const SupervisorList: React.FC<SupervisorListProps> = ({
  supervisors,
  searchTerm,
  onEditSupervisor,
  onManageTeam,
  isLoadingTechnicians,
  allTechnicians,
}) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deleteSupervisorMutation = useMutation({
    mutationFn: async (supervisorId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', supervisorId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allTechnicians', currentUser?.id] }); // Invalidate technicians list
      toast({ title: "Supervisor excluído!", description: "Supervisor removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir supervisor", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteSupervisor = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este supervisor? Esta ação não pode ser desfeita.")) {
      deleteSupervisorMutation.mutate(id);
    }
  };

  const filteredSupervisors = supervisors?.filter(supervisor =>
    supervisor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Card className="card-futuristic">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Meus Supervisores
        </CardTitle>
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
                    <Briefcase className="h-3 w-3" /> Função: {supervisor.role === 'supervisor' ? 'Supervisor Técnico' : supervisor.role}
                  </div>
                  {supervisor.phone_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {supervisor.phone_number}
                    </div>
                  )}
                  {/* Display assigned technicians count */}
                  {isLoadingTechnicians ? (
                    <div className="flex items-center gap-1 col-span-full">
                      <Loader2 className="h-3 w-3 animate-spin" /> Carregando equipe...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 col-span-full">
                      <UserCog className="h-3 w-3" /> Técnicos na Equipe: {allTechnicians?.filter(tech => tech.supervisor_id === supervisor.id).length || 0}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-accent text-accent hover:bg-accent/10"
                  onClick={() => onEditSupervisor(supervisor)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => onManageTeam(supervisor)}
                >
                  <UserCog className="mr-1 h-3 w-3" />
                  Gerenciar Equipe
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
            <Users className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhum supervisor técnico cadastrado. Clique em "Novo Supervisor" para adicionar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};