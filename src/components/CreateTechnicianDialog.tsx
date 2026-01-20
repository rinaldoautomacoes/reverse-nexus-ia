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
import { UserForm } from "./UserForm"; // Reutilizando UserForm

type ProfileInsert = TablesInsert<'profiles'>;

export const CreateTechnicianDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const addTechnicianMutation = useMutation({
    mutationFn: async (newTechnicianData: ProfileInsert) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar técnicos.");
      }

      // Inserir diretamente na tabela 'profiles'
      const { data, error } = await supabase
        .from('profiles')
        .insert({ 
          ...newTechnicianData, 
          id: newTechnicianData.id || crypto.randomUUID(), // Garante um ID se não for fornecido
          role: 'standard', // Força a role para 'standard' para técnicos
          // user_id não é mais necessário aqui, pois o perfil é o próprio técnico
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || "Falha ao criar técnico.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] });
      toast({ title: "Técnico adicionado!", description: "Novo técnico criado com sucesso." });
      setOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar técnico", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: ProfileInsert) => {
    addTechnicianMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Técnico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <UserCog className="h-5 w-5" />
            Adicionar Novo Técnico
          </DialogTitle>
        </DialogHeader>
        <UserForm
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          isPending={addTechnicianMutation.isPending}
          showAuthFields={false} // Não mostra campos de autenticação
        />
      </DialogContent>
    </Dialog>
  );
};