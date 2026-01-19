import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/use-auth";
import { CreateTechnicianForm } from "./CreateTechnicianForm";

type ProfileInsert = TablesInsert<'profiles'>;

interface CreateTechnicianData extends ProfileInsert {
  email: string;
  password: string;
}

export const CreateTechnicianDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const addTechnicianMutation = useMutation({
    mutationFn: async (newTechnicianData: CreateTechnicianData) => {
      if (!currentUser?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar técnicos.");
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error("Sessão de autenticação ausente. Faça login novamente.");
      }

      const { email, password, first_name, last_name, phone_number, avatar_url, role, supervisor_id } = newTechnicianData;

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
          role: role || 'standard', // Ensure role is 'standard' for technicians
          phone_number,
          avatar_url,
          supervisor_id, // Pass supervisor_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar usuário técnico.");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] }); // Invalidate supervisor list
      toast({ title: "Técnico adicionado!", description: "Novo técnico criado com sucesso." });
      setOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar técnico", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: CreateTechnicianData) => {
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
        <CreateTechnicianForm
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          isPending={addTechnicianMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};