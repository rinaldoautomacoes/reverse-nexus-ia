import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { EntregaForm } from "@/components/EntregaForm";
import { generateUniqueNumber } from "@/lib/utils"; // Importar a função de geração

type EntregaInsert = TablesInsert<'coletas'>; // Reutilizando o tipo 'coletas' para entregas
type ItemInsert = TablesInsert<'items'>;

export const AgendarEntregaPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const addEntregaMutation = useMutation({
    mutationFn: async (newEntrega: EntregaInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar entregas.");
      }
      
      // 1. Insert the new entrega
      const { data: insertedEntrega, error: entregaError } = await supabase
        .from('coletas') // Usar a tabela 'coletas' para entregas também
        .insert({ ...newEntrega, user_id: user.id, type: 'entrega' }) // Garantir que o tipo é 'entrega'
        .select()
        .single();
      
      if (entregaError) throw new Error(entregaError.message);

      // 2. If a product model and quantity are provided, insert into 'items' table
      if (insertedEntrega.modelo_aparelho && insertedEntrega.qtd_aparelhos_solicitado && insertedEntrega.qtd_aparelhos_solicitado > 0) {
        const newItem: ItemInsert = {
          user_id: user.id,
          collection_id: insertedEntrega.id,
          name: insertedEntrega.modelo_aparelho, // Using modelo_aparelho as item name/code
          quantity: insertedEntrega.qtd_aparelhos_solicitado,
          status: insertedEntrega.status_coleta || 'agendada', // Inherit status from entrega
          // description: 'Item da entrega', // Optional: add a default description
          // model: insertedEntrega.modelo_aparelho, // Optional: if item model is different from name
        };
        const { error: itemError } = await supabase.from('items').insert(newItem);
        if (itemError) {
          console.error("Erro ao inserir item na tabela 'items':", itemError.message);
          // Decide whether to throw this error or just log it.
          // For now, we'll let the entrega creation succeed even if item creation fails.
          // toast({ title: "Aviso", description: `Entrega agendada, mas houve um erro ao registrar o item: ${itemError.message}`, variant: "warning" });
        }
      }

      return insertedEntrega;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['itemsForEntregasMetrics', user?.id] }); // Invalidate items query
      toast({ title: "Entrega Agendada!", description: "Nova entrega criada com sucesso." });
      navigate('/entregas-ativas'); // Redireciona para a lista de entregas ativas
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar entrega", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate('/dashboard-entregas')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard de Entregas
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Agendar Nova Entrega
            </h1>
            <p className="text-muted-foreground">
              Preencha os detalhes para agendar uma nova entrega de materiais.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Detalhes da Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EntregaForm
                onSave={addEntregaMutation.mutate}
                onCancel={() => navigate('/dashboard-entregas')}
                isPending={addEntregaMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};