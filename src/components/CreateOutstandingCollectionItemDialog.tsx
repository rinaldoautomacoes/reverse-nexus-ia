import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/use-auth";
import { OutstandingCollectionItemForm } from "./OutstandingCollectionItemForm";

type OutstandingCollectionItemInsert = TablesInsert<'outstanding_collection_items'>;

export const CreateOutstandingCollectionItemDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addOutstandingCollectionItemMutation = useMutation({
    mutationFn: async (newItem: OutstandingCollectionItemInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar itens pendentes.");
      }
      const { data, error } = await supabase
        .from('outstanding_collection_items')
        .insert({ ...newItem, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingCollectionItems', user?.id] });
      toast({ title: "Item Pendente Adicionado!", description: "Novo item pendente de coleta criado com sucesso." });
      setOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar item pendente", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: OutstandingCollectionItemInsert) => {
    addOutstandingCollectionItemMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Item Pendente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Package className="h-5 w-5" />
            Adicionar Novo Item Pendente
          </DialogTitle>
        </DialogHeader>
        <OutstandingCollectionItemForm
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          isPending={addOutstandingCollectionItemMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};