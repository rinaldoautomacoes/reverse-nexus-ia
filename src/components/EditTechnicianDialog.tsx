import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/use-auth";
import { UserForm } from "./UserForm";

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface EditTechnicianDialogProps {
  technician: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTechnicianDialog: React.FC<EditTechnicianDialogProps> = ({ technician, isOpen, onClose }) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const updateTechnicianMutation = useMutation({
    mutationFn: async (updatedTechnician: ProfileUpdate) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar técnicos.");
      }
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedTechnician)
        .eq('id', updatedTechnician.id as string)
        .eq('user_id', currentUser.id) // RLS check (assuming user_id is the profile ID)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] }); // Invalidate supervisor list
      toast({ title: "Técnico atualizado!", description: "Técnico salvo com sucesso." });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar técnico", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: ProfileUpdate) => {
    updateTechnicianMutation.mutate(data);
  };

  if (!technician) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Técnico: {technician.first_name} {technician.last_name}
          </DialogTitle>
        </DialogHeader>
        <UserForm
          initialData={technician}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateTechnicianMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};