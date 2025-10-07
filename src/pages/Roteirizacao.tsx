import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import RouteMap from "@/components/RouteMap";
import RouteList from "@/components/RouteList";
import RouteFilters from "@/components/RouteFilters";
import GenerateRouteDialog from "@/components/GenerateRouteDialog";
import { EditRouteDialog } from "@/components/EditRouteDialog";
import type { Tables } from "@/integrations/supabase/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast"; // Importação corrigida para o hook useToast

type Route = Tables<'routes'>;

export default function Roteirizacao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Usando o hook useToast

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    driverId: "all",
    status: "all"
  });
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRouteData, setEditingRouteData] = useState<Route | null>(null);

  const handleEditRoute = (route: Route) => {
    setEditingRouteData(route);
    setIsEditDialogOpen(true);
  };

  const deleteRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("routes")
        .delete()
        .eq("id", routeId)
        .eq("user_id", user.id); // RLS check
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Rota excluída!", description: "A rota foi removida com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
      setSelectedRoute(null); // Desseleciona a rota após a exclusão
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir rota", description: error.message, variant: "destructive" });
    }
  });

  const handleDeleteRoute = (routeId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta rota? Esta ação é irreversível.")) {
      deleteRouteMutation.mutate(routeId);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Roteirização de Rotas
            </h1>
          </div>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            Gerar Rota
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 relative">
          <RouteMap 
            selectedRouteId={selectedRoute}
            filters={filters}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-96 border-l bg-card overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <RouteFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <RouteList 
              filters={filters}
              selectedRouteId={selectedRoute}
              onSelectRoute={setSelectedRoute}
              onEditRoute={handleEditRoute}
              onDeleteRoute={handleDeleteRoute}
              isDeleting={deleteRouteMutation.isPending}
            />
          </div>
        </aside>
      </div>

      {/* Generate Route Dialog */}
      <GenerateRouteDialog 
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
      />

      {/* Edit Route Dialog */}
      {editingRouteData && (
        <EditRouteDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          route={editingRouteData}
        />
      )}
    </div>
  );
}