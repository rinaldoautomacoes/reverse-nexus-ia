import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Map, Route as RouteIcon, Loader2, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import RouteFilters from "@/components/RouteFilters";
import RouteList from "@/components/RouteList";
import { CreateRouteDialog } from "@/components/CreateRouteDialog"; // Assuming this component exists
import { EditRouteDialog } from "@/components/EditRouteDialog"; // Assuming this component exists

type Route = Tables<'routes'> & {
  driver?: { name: string } | null;
  stops?: Array<{ count: number }> | null;
};
type RouteInsert = TablesInsert<'routes'>;
type RouteUpdate = TablesUpdate<'routes'>;

export default function Roteirizacao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    driverId: "all",
    status: "all",
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('user_id', user?.id); // RLS check
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes-list', user?.id] });
      toast({ title: "Rota Excluída!", description: "Rota removida com sucesso." });
      setSelectedRouteId(null); // Clear selected route after deletion
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir rota", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteRoute = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta rota? Esta ação não pode ser desfeita.")) {
      deleteRouteMutation.mutate(id);
    }
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-7xl mx-auto">
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
              Roteirização Inteligente
            </h1>
            <p className="text-muted-foreground">
              Crie, otimize e gerencie suas rotas de coleta e entrega.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna de Filtros e Lista de Rotas */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="card-futuristic">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <RouteIcon className="h-5 w-5 text-primary" />
                    Filtros de Rotas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RouteFilters filters={filters} onFiltersChange={setFilters} />
                </CardContent>
              </Card>

              <Card className="card-futuristic">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <RouteIcon className="h-5 w-5 text-primary" />
                    Minhas Rotas
                  </CardTitle>
                  <CreateRouteDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
                </CardHeader>
                <CardContent className="p-0">
                  <RouteList
                    filters={filters}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={setSelectedRouteId}
                    onEditRoute={handleEditRoute}
                    onDeleteRoute={handleDeleteRoute}
                    isDeleting={deleteRouteMutation.isPending}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Coluna do Mapa (Placeholder) */}
            <div className="lg:col-span-2">
              <Card className="card-futuristic h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Map className="h-5 w-5 text-primary" />
                    Visualização do Mapa
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Map className="h-24 w-24 mx-auto mb-4" />
                    <p>Mapa interativo da rota selecionada.</p>
                    <p className="text-sm">Selecione uma rota na lista para visualizar.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {editingRoute && (
        <EditRouteDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          route={editingRoute}
          onRouteUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['routes-list', user?.id] });
            setEditingRoute(null);
          }}
        />
      )}
    </div>
  );
}