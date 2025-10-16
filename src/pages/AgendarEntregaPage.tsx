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

type EntregaInsert = TablesInsert<'coletas'>; // Reutilizando o tipo 'coletas' para entregas

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
      const { data, error } = await supabase
        .from('coletas') // Usar a tabela 'coletas' para entregas também
        .insert({ ...newEntrega, user_id: user.id, type: 'entrega' }) // Garantir que o tipo é 'entrega'
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
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