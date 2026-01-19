import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserCog } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types_generated";

type Profile = Tables<'profiles'>;

interface ManageSupervisorTeamDialogProps {
  supervisor: Profile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageSupervisorTeamDialog: React.FC<ManageSupervisorTeamDialogProps> = ({ supervisor, isOpen, onOpenChange }) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<Set<string>>(new Set());

  const { data: allTechnicians, isLoading: isLoadingTechnicians, error: techniciansError } = useQuery<Profile[], Error>({
    queryKey: ['allTechnicians', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'standard') // Only standard users are technicians
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id && isOpen, // Only fetch when dialog is open
  });

  useEffect(() => {
    if (supervisor && allTechnicians) {
      const assignedTechnicians = allTechnicians.filter(tech => tech.supervisor_id === supervisor.id).map(tech => tech.id);
      setSelectedTechnicianIds(new Set(assignedTechnicians));
    } else {
      setSelectedTechnicianIds(new Set());
    }
  }, [supervisor, allTechnicians]);

  const updateTechnicianTeamMutation = useMutation({
    mutationFn: async ({ supervisorId, technicianIds }: { supervisorId: string | null; technicianIds: string[] }) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado.");
      }

      // First, unassign all technicians from this supervisor
      const { error: unassignError } = await supabase
        .from('profiles')
        .update({ supervisor_id: null })
        .eq('supervisor_id', supervisorId);
      if (unassignError) throw new Error(`Erro ao desatribuir técnicos: ${unassignError.message}`);

      // Then, assign selected technicians to this supervisor
      if (technicianIds.length > 0) {
        const { error: assignError } = await supabase
          .from('profiles')
          .update({ supervisor_id: supervisorId })
          .in('id', technicianIds);
        if (assignError) throw new Error(`Erro ao atribuir técnicos: ${assignError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allTechnicians', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['technicians', currentUser?.id] }); // Invalidate technician list in TechnicianManagement
      toast({ title: "Equipe atualizada!", description: "A equipe do supervisor foi salva com sucesso." });
      onOpenChange(false);
      setSelectedTechnicianIds(new Set());
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar equipe", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveTeam = () => {
    if (supervisor) {
      updateTechnicianTeamMutation.mutate({
        supervisorId: supervisor.id,
        technicianIds: Array.from(selectedTechnicianIds),
      });
    }
  };

  const handleToggleTechnician = (technicianId: string) => {
    setSelectedTechnicianIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(technicianId)) {
        newSet.delete(technicianId);
      } else {
        newSet.add(technicianId);
      }
      return newSet;
    });
  };

  if (!supervisor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <UserCog className="h-5 w-5" />
            Gerenciar Equipe de {supervisor.first_name} {supervisor.last_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Selecione os técnicos que farão parte da equipe de {supervisor.first_name}.
          </p>
          {isLoadingTechnicians ? (
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Carregando técnicos...</p>
            </div>
          ) : techniciansError ? (
            <p className="text-destructive">Erro ao carregar técnicos: {techniciansError.message}</p>
          ) : allTechnicians && allTechnicians.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {allTechnicians.map(tech => (
                <div key={tech.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tech-${tech.id}`}
                    checked={selectedTechnicianIds.has(tech.id)}
                    onCheckedChange={() => handleToggleTechnician(tech.id)}
                    disabled={updateTechnicianTeamMutation.isPending}
                  />
                  <label
                    htmlFor={`tech-${tech.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tech.first_name} {tech.last_name} ({tech.email})
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum técnico disponível para atribuição.</p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateTechnicianTeamMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
              onClick={handleSaveTeam}
              disabled={updateTechnicianTeamMutation.isPending}
            >
              {updateTechnicianTeamMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCog className="mr-2 h-4 w-4" />
              )}
              Salvar Equipe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};