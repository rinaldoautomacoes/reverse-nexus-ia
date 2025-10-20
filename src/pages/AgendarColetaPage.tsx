import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ColetaForm } from "@/components/ColetaForm";
import { generateUniqueNumber } from "@/lib/utils"; // Importar a função de geração

type ColetaInsert = TablesInsert<'coletas'>;
type ItemInsert = TablesInsert<'items'>;

export const AgendarColetaPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const addColetaMutation = useMutation({
    mutationFn: async (newColeta: ColetaInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar coletas.");
      }
      
      // 1. Insert the new coleta
      const { data: insertedColeta, error: coletaError } = await supabase
        .from('coletas')
        .insert({ ...newColeta, user_id: user.id, type: 'coleta' })
        .select()
        .single();
      
      if (coletaError) throw new Error(coletaError.message);

      // 2. If a product model and quantity are provided, insert into 'items' table
      if (insertedColeta.modelo_aparelho && insertedColeta.qtd_aparelhos_solicitado && insertedColeta.qtd_aparelhos_solicitado > 0) {
        const newItem: ItemInsert = {
          user_id: user.id,
          collection_id: insertedColeta.id,
          name: insertedColeta.modelo_aparelho, // Using modelo_aparelho as item name/code
          quantity: insertedColeta.qtd_aparelhos_solicitado,
          status: insertedColeta.status_coleta || 'pendente', // Inherit status from coleta
          // description: 'Item da coleta', // Optional: add a default description
          // model: insertedColeta.modelo_aparelho, // Optional: if item model is different from name
        };
        const { error: itemError } = await supabase.from('items').insert(newItem);
        if (itemError) {
          console.error("Erro ao inserir item na tabela 'items':", itemError.message);
          // Decide whether to throw this error or just log it.
          // For now, we'll let the coleta creation succeed even if item creation fails.
          // toast({ title: "Aviso", description: `Coleta agendada, mas houve um erro ao registrar o item: ${itemError.message}`, variant: "warning" });
        }
      }

      return insertedColeta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['itemsForColetasMetrics', user?.id] }); // Invalidate items query
      toast({ title: "Coleta Agendada!", description: "Nova coleta criada com sucesso." });
      navigate('/coletas-ativas'); // Redireciona para a lista de coletas ativas
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar coleta", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate('/coletas-dashboard')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard de Coletas
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Agendar Nova Coleta
            </h1>
            <p className="text-muted-foreground">
              Preencha os detalhes para agendar uma nova coleta de materiais.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Detalhes da Coleta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ColetaForm
                onSave={addColetaMutation.mutate}
                onCancel={() => navigate('/coletas-dashboard')}
                isPending={addColetaMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};