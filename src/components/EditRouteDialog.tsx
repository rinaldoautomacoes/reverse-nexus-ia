import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPin, Home, Flag, Truck, Route as RouteIcon, Calendar as CalendarIcon, Clock, Gauge, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import RouteMap from "./RouteMap"; // Import the map component
import axios from "axios"; // Import axios

type Route = Tables<'routes'>;
type RouteUpdate = TablesUpdate<'routes'>;
type Driver = Tables<'drivers'>;

interface EditRouteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  route: Route | null; // The route to edit
  onRouteUpdated: () => void; // Callback after successful update
}

export const EditRouteDialog: React.FC<EditRouteDialogProps> = ({ isOpen, onOpenChange, route, onRouteUpdated }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RouteUpdate | null>(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false); // For address geocoding
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false); // State for route calculation

  useEffect(() => {
    if (route) {
      setFormData({
        id: route.id,
        name: route.name,
        driver_id: route.driver_id,
        date: route.date,
        origin_address: route.origin_address,
        origin_lat: route.origin_lat,
        origin_lng: route.origin_lng,
        destination_address: route.destination_address,
        destination_lat: route.destination_lat,
        destination_lng: route.destination_lng,
        optimization_type: route.optimization_type,
        status: route.status,
        total_distance: route.total_distance,
        estimated_duration: route.estimated_duration,
      });
    } else {
      setFormData(null);
    }
  }, [route]);

  const { data: drivers } = useQuery<Driver[], Error>({
    queryKey: ["drivers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id && isOpen,
  });

  const updateRouteMutation = useMutation({
    mutationFn: async (updatedRoute: RouteUpdate) => {
      if (!user?.id) throw new Error("User not authenticated");

      setIsCalculatingRoute(true);
      const mapboxAccessToken = localStorage.getItem("mapbox_token");
      let totalDistance = updatedRoute.total_distance;
      let estimatedDuration = updatedRoute.estimated_duration;

      // Recalcular distância e duração se as coordenadas mudaram ou se não existiam
      if (mapboxAccessToken && updatedRoute.origin_lat && updatedRoute.origin_lng && updatedRoute.destination_lat && updatedRoute.destination_lng) {
        const coordinatesString = `${updatedRoute.origin_lng},${updatedRoute.origin_lat};${updatedRoute.destination_lng},${updatedRoute.destination_lat}`;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxAccessToken}`;
        
        try {
          const response = await axios.get(url);
          if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            totalDistance = route.distance / 1000; // meters to km
            estimatedDuration = Math.round(route.duration / 60); // seconds to minutes, rounded to integer
          }
        } catch (directionsError) {
          console.error("Erro ao recalcular direções:", directionsError);
          toast({ title: "Erro no cálculo da rota", description: "Não foi possível recalcular a distância e duração da rota.", variant: "destructive" });
        }
      } else if (!mapboxAccessToken) {
        toast({ title: "Token Mapbox Ausente", description: "Insira seu token Mapbox para calcular a distância e duração da rota.", variant: "destructive" });
      }
      setIsCalculatingRoute(false);

      const { data, error } = await supabase
        .from("routes")
        .update({
          ...updatedRoute,
          total_distance: totalDistance,
          estimated_duration: estimatedDuration,
        })
        .eq("id", updatedRoute.id as string)
        .eq("user_id", user.id) // RLS check
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Rota atualizada!", description: "As informações da rota foram salvas com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
      onRouteUpdated(); // Call the callback
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar rota", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      updateRouteMutation.mutate(formData);
    }
  };

  if (!route || !formData) {
    return null; // Or a loading spinner
  }

  const isFormDisabled = updateRouteMutation.isPending || isFetchingAddress || isCalculatingRoute;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Rota: {route.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Rota</Label>
              <div className="relative">
                <RouteIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da Rota"
                  className="pl-10"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Motorista</Label>
              <Select
                value={formData.driver_id || ''}
                onValueChange={(value) => setFormData({ ...formData, driver_id: value || null })}
                disabled={isFormDisabled}
              >
                <SelectTrigger id="driver" className="pl-10">
                  <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecione um motorista" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="pl-10"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'planejada'}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={isFormDisabled}
              >
                <SelectTrigger id="status" className="pl-10">
                  <RouteIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejada">Planejada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin-address">Endereço de Origem</Label>
              <div className="relative">
                <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="origin-address"
                  value={formData.origin_address || ''}
                  onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                  placeholder="Endereço de partida"
                  className="pl-10"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination-address">Endereço de Destino</Label>
              <div className="relative">
                <Flag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination-address"
                  value={formData.destination_address || ''}
                  onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                  placeholder="Endereço de chegada"
                  className="pl-10"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </div>

          {/* Display Estimated Duration and Total Distance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/30 pt-4">
            <div className="space-y-2">
              <Label>Distância Total</Label>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="h-4 w-4" />
                <p>{formData.total_distance ? `${formData.total_distance.toFixed(2)} km` : 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duração Estimada</Label>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <p>{formData.estimated_duration ? `${Math.round(formData.estimated_duration)} min` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Mini Map Preview */}
          <div className="space-y-2 border-t border-border/30 pt-4">
            <Label>Visualização da Rota</Label>
            <div className="h-64 w-full rounded-lg overflow-hidden border border-border/50">
              {/* Ensure RouteMap receives correct props and is enabled */}
              {route.id && <RouteMap selectedRouteId={route.id} filters={{ date: route.date, driverId: route.driver_id || 'all', status: route.status }} />}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isFormDisabled}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isFormDisabled}>
              {(updateRouteMutation.isPending || isCalculatingRoute) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Edit className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};