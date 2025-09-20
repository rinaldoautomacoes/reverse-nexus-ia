import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Warehouse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import React, { useEffect } from "react";

type Item = Tables<'items'>;

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Truck,
  Clock,
  CheckCircle,
  Warehouse,
};

export const CollectionStatus = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: items, isLoading, error } = useQuery<Item[], Error>({
    queryKey: ['collectionStatusItems', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      const { data, error } = await supabase
        .from('items')
        .select('quantity, status')
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar situação dos itens",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const calculateStatusMetrics = (itemsData: Item[] | undefined) => {
    if (!itemsData || itemsData.length === 0) {
      return [];
    }

    let pendenteCount = 0;
    let emTransitoCount = 0; // Mapeado para 'coletado'
    let entregueUnidadeCount = 0; // Mapeado para 'processado'

    itemsData.forEach(item => {
      if (item.status === 'pendente') {
        pendenteCount += item.quantity;
      } else if (item.status === 'coletado') {
        emTransitoCount += item.quantity;
      } else if (item.status === 'processado') {
        entregueUnidadeCount += item.quantity;
      }
    });

    return [
      {
        id: 'pendente',
        title: 'Pendente',
        value: pendenteCount.toString(),
        description: 'Aguardando coleta',
        icon_name: 'Clock',
        color: 'text-destructive',
        bg_color: 'bg-destructive/10',
      },
      {
        id: 'em-transito',
        title: 'Em Trânsito',
        value: emTransitoCount.toString(),
        description: 'Em transporte para a unidade',
        icon_name: 'Truck',
        color: 'text-warning-yellow',
        bg_color: 'bg-warning-yellow/10',
      },
      {
        id: 'entregue-unidade',
        title: 'Entregue na Unidade',
        value: entregueUnidadeCount.toString(),
        description: 'Processamento iniciado',
        icon_name: 'Warehouse',
        color: 'text-primary',
        bg_color: 'bg-primary/10',
      },
    ];
  };

  const statusMetrics = calculateStatusMetrics(items);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando situação das coletas...</p>
        </div>
      </div>
    );
  }

  if (!statusMetrics || statusMetrics.length === 0) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-6 text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <Card className="card-futuristic border-0">
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma situação de coleta encontrada. Cadastre itens para ver os dados.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Situação da Coleta
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o status dos itens em cada etapa da logística reversa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statusMetrics.map((metric, index) => {
              const Icon = iconMap[metric.icon_name];
              if (!Icon) {
                console.warn(`Ícone não encontrado para: ${metric.icon_name}`);
                return null;
              }
              return (
                <Card 
                  key={metric.id} 
                  className="card-futuristic border-0 animate-slide-up" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${metric.bg_color}`}>
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-orbitron gradient-text mb-1">
                      {metric.value}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};