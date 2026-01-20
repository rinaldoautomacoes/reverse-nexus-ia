"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/use-auth";
import { UserForm } from "./UserForm";

type ProfileInsert = TablesInsert<'profiles'>;

interface CreateProfileDialogProps {
  profileType?: 'technician' | 'supervisor'; // Novo prop para definir o tipo de perfil
}

export const CreateProfileDialog: React.FC<CreateProfileDialogProps> = ({ profileType = 'technician' }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const addProfileMutation = useMutation({
    mutationFn: async (newProfileData: ProfileInsert) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar perfis.");
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({ 
          ...newProfileData, 
          id: newProfileData.id || crypto.randomUUID(),
          role: newProfileData.role || 'standard', // Permite que a role seja definida pelo formulário, mas padrão é 'standard'
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || `Falha ao criar ${profileType}.`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] });
      toast({ title: `${profileType === 'technician' ? 'Técnico' : 'Supervisor'} adicionado!`, description: `Novo ${profileType} criado com sucesso.` });
      setOpen(false);
    },
    onError: (err) => {
      toast({ title: `Erro ao adicionar ${profileType}`, description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: ProfileInsert) => {
    addProfileMutation.mutate(data);
  };

  const dialogTitle = profileType === 'technician' ? 'Adicionar Novo Técnico' : 'Adicionar Novo Supervisor';
  const buttonText = profileType === 'technician' ? 'Novo Técnico' : 'Novo Supervisor';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <UserCog className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <UserForm
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          isPending={addProfileMutation.isPending}
          showAuthFields={false}
          defaultRole={profileType === 'supervisor' ? 'standard' : 'standard'}
          profileType={profileType} // Passando o novo prop
        />
      </DialogContent>
    </Dialog>
  );
};