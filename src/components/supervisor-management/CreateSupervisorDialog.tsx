import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";
import { UserForm } from "@/components/UserForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface CreateSupervisorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateSupervisorDialog: React.FC<CreateSupervisorDialogProps> = ({ isOpen, onOpenChange }) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const addSupervisorMutation = useMutation({
    mutationFn: async (newSupervisor: ProfileInsert & { email?: string; password?: string }) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar supervisores.");
      }

      if (!newSupervisor.email || !newSupervisor.password) {
        throw new Error("Email e senha são obrigatórios para criar um novo supervisor.");
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error("Sessão de autenticação ausente. Faça login novamente.");
      }

      const { email, password, first_name, last_name, phone_number, avatar_url } = newSupervisor;

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
          role: 'supervisor', // Always 'supervisor' for this page
          phone_number,
          avatar_url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn(`Failed to create user ${email}: ${errorData.error}`);
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
              role: 'supervisor',
            })
            .eq('id', existingUser.user.id);
          if (updateProfileError) {
            console.error(`Failed to update profile for ${email}: ${updateProfileError.message}`);
            throw new Error(`Usuário ${email} já existe, mas falha ao atualizar o perfil.`);
          } else {
            return { message: 'User profile updated successfully', user: existingUser.user.id };
          }
        }
        throw new Error(errorData.error || "Falha ao criar usuário supervisor.");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allTechnicians', currentUser?.id] }); // Invalidate technicians list
      toast({ title: "Supervisor adicionado!", description: "Novo supervisor criado com sucesso." });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar supervisor", description: err.message, variant: "destructive" });
    },
  });

  const handleAddSupervisor = (data: ProfileInsert & { email?: string; password?: string }) => {
    addSupervisorMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Supervisor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Users className="h-5 w-5" />
            Adicionar Novo Supervisor
          </DialogTitle>
        </DialogHeader>
        <UserForm
          onSave={handleAddSupervisor}
          onCancel={() => onOpenChange(false)}
          isPending={addSupervisorMutation.isPending}
          initialData={{ role: 'supervisor' }} // Pre-fill role for supervisors
        />
      </DialogContent>
    </Dialog>
  );
};