import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, User } from "lucide-react"; // Adicionado User para ícone de cliente
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type Coleta = Tables<'coletas'>;

export const PerformanceChart = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: coletas, isLoading, error } = useQuery<Coleta[], Error>({
    queryKey: ['coletasForChart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('coletas')
        .select('parceiro, qtd_aparelhos_solicitado')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Ordenar para mostrar as mais recentes primeiro
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados das coletas",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Agrupar coletas por cliente e somar a quantidade de aparelhos
  const aggregatedData = coletas?.reduce((acc, coleta) => {
    if (coleta.parceiro && coleta.qtd_aparelhos_solicitado !== null) {
      const existingClient = acc.find(item => item.parceiro === coleta.parceiro);
      if (existingClient) {
        existingClient.qtd_aparelhos_solicitado += coleta.qtd_aparelhos_solicitado;
      } else {
        acc.push({
          parceiro: coleta.parceiro,
          qtd_aparelhos_solicitado: coleta.qtd_aparelhos_solicitado,
        });
      }
    }
    return acc;
  }, [] as { parceiro: string; qtd_aparelhos_solicitado: number }[]) || [];

  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-futuristic border-0">
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar dados: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-orbitron gradient-text">
              Coletas Agendadas por Cliente
            </CardTitle>
            <p className="text-sm text-muted-foreground">Quantidade de aparelhos por cliente</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-neural/20 text-neural">
              <TrendingUp className="w-3 h-3 mr-1" />
              Otimização IA
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {aggregatedData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggregatedData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="parceiro" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--primary))' }}
                    formatter={(value: number, name: string, props: any) => [`${value} aparelhos`, props.payload.parceiro]}
                  />
                  <Bar dataKey="qtd_aparelhos_solicitado" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--neural-blue))" stopOpacity={0.5}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gradient-dark rounded-lg border border-border/50">
              <div className="text-center space-y-2">
                <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Nenhuma coleta agendada encontrada.</p>
                <p className="text-sm text-muted-foreground">Agende sua primeira coleta para ver os dados aqui!</p>
              </div>
            </div>
          )}

          {/* Legend and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-gradient-primary rounded" />
              <div>
                <p className="text-sm font-medium">Quantidade de Aparelhos</p>
                <p className="text-xs text-muted-foreground">Total por cliente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-neural rounded" />
              <div>
                <p className="text-sm font-medium">Otimização IA</p>
                <p className="text-xs text-muted-foreground">Taxa de eficiência</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};