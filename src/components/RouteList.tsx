import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Clock, Home, Flag, Edit, Gauge, Trash2, Loader2 } from "lucide-react"; // Added Trash2 and Loader2
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types_generated";
import { format, isValid } from "date-fns"; // Importar isValid
import { ptBR } from "date-fns/locale"; // Importar locale

type Route = Tables<'routes'> & {
  driver?: { name: string } | null;
  stops?: Array<{ count: number }> | null;
};

interface RouteListProps {
  filters: {
    date: string;
    driverId: string;
    status: string;
  };
  selectedRouteId: string | null;
  onSelectRoute: (id: string | null) => void;
  onEditRoute: (route: Route) => void;
  onDeleteRoute: (routeId: string) => void; // New prop for deleting
  isDeleting: boolean; // New prop to indicate if a deletion is in progress
}

export default function RouteList({ filters, selectedRouteId, onSelectRoute, onEditRoute, onDeleteRoute, isDeleting }: RouteListProps) {
  const { user } = useAuth();

  const { data: routes, isLoading } = useQuery<Route[], Error>({
    queryKey: ["routes-list", user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("routes")
        .select(`
          *,
          driver:drivers(name),
          stops:route_stops(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filters.date) {
        query = query.eq("date", filters.date);
      }
      if (filters.driverId && filters.driverId !== "all") {
        query = query.eq("driver_id", filters.driverId);
      }
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Route[];
    },
    enabled: !!user?.id
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
      planejada: { label: "Planejada", variant: "outline" },
      em_andamento: { label: "Em Andamento", variant: "warning" },
      concluida: { label: "Concluída", variant: "success" }
    };
    
    const config = variants[status] || { label: status, variant: "outline" };
    
    let className = "";
    if (status === "em_andamento") {
      className = "bg-warning-yellow/20 text-warning-yellow";
    } else if (status === "concluida") {
      className = "bg-success-green/20 text-success-green";
    } else if (status === "planejada") {
      className = "bg-primary/20 text-primary";
    }

    return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div>
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma rota encontrada</p>
          <p className="text-sm text-muted-foreground">
            Clique em "Gerar Rota" para criar uma nova
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {routes.map((route) => (
        <Card
          key={route.id}
          className={cn(
            "p-4 cursor-pointer transition-all hover:shadow-md card-futuristic",
            selectedRouteId === route.id && "ring-2 ring-primary border-primary"
          )}
          onClick={() => onSelectRoute(selectedRouteId === route.id ? null : route.id)}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg">{route.name}</h3>
            {getStatusBadge(route.status)}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>{route.driver?.name || "Sem motorista"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span>{route.stops?.[0]?.count || 0} paradas</span>
            </div>
            {route.origin_address && (
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-neon-cyan" />
                <span>Origem: {route.origin_address}</span>
              </div>
            )}
            {route.destination_address && (
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-ai-purple" />
                <span>Destino: {route.destination_address}</span>
              </div>
            )}
            {route.total_distance && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-success-green" />
                <span>Distância: {route.total_distance.toFixed(2)} km</span>
              </div>
            )}
            {route.estimated_duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning-yellow" />
                <span>Duração Estimada: {isValid(new Date(route.estimated_duration * 1000)) ? format(new Date(route.estimated_duration * 1000), 'mm', { locale: ptBR }) : 'N/A'} min</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click from triggering
                onEditRoute(route);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click from triggering
                onDeleteRoute(route.id);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}