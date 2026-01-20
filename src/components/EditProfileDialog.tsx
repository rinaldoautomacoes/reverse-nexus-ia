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

interface EditProfileDialogProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  profileType?: 'technician' | 'supervisor'; // Novo prop para definir o tipo de perfil
}

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ profile, isOpen, onClose, profileType = 'technician' }) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: ProfileUpdate) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar perfis.");
      }
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', updatedProfile.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] });
      toast({ title: `${profileType === 'technician' ? 'Técnico' : 'Supervisor'} atualizado!`, description: `${profileType === 'technician' ? 'Técnico' : 'Supervisor'} salvo com sucesso.` });
      onClose();
    },
    onError: (err) => {
      toast({ title: `Erro ao atualizar ${profileType}`, description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: ProfileUpdate) => {
    updateProfileMutation.mutate(data);
  };

  if (!profile) return null;

  const dialogTitle = profileType === 'technician' ? `Editar Técnico: ${profile.first_name} ${profile.last_name}` : `Editar Supervisor: ${profile.first_name} ${profile.last_name}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <UserForm
          initialData={profile}
          onSave={handleSave}
          onCancel={onClose}
          isPending={updateProfileMutation.isPending}
          showAuthFields={false}
          profileType={profileType} // Passando o novo prop
        />
      </DialogContent>
    </Dialog>
  );
};