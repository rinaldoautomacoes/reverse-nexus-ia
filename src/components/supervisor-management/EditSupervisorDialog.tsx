import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Users } from "lucide-react";
import { UserForm } from "@/components/UserForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface EditSupervisorDialogProps {
  supervisor: Profile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSupervisorDialog: React.FC<EditSupervisorDialogProps> = ({ supervisor, isOpen, onOpenChange }) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const updateSupervisorMutation = useMutation({
    mutationFn: async (updatedSupervisor: ProfileUpdate) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedSupervisor)
        .eq('id', updatedSupervisor.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allTechnicians', currentUser?.id] }); // Invalidate technicians list
      toast({ title: "Supervisor atualizado!", description: "Supervisor salvo com sucesso." });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar supervisor", description: err.message, variant: "destructive" });
    },
  });

  const handleUpdateSupervisor = (data: ProfileUpdate) => {
    updateSupervisorMutation.mutate(data);
  };

  if (!supervisor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Users className="h-5 w-5" />
            Editar Supervisor
          </DialogTitle>
        </DialogHeader>
        <UserForm
          initialData={supervisor}
          onSave={handleUpdateSupervisor}
          onCancel={() => onOpenChange(false)}
          isPending={updateSupervisorMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};