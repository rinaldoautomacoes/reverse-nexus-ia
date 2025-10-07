import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { MapPin, Truck, Package, Settings, Home, Flag, Clock, Gauge, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios"; // Import Card and CardContent

interface RouteMapProps {
  selectedRouteId: string | null;
  filters: {
    date: string;
    driverId: string;
    status: string;
  };
}

export default function RouteMap({ selectedRouteId, filters }: RouteMapProps) {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  // const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false); // Removido
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("mapbox_token");
    if (savedToken) {
      setMapboxToken(savedToken);
      setIsTokenSet(true);
    }
  }, []);

  // Initialize map when token is set and container is ready
  useEffect(() => {
    if (!isTokenSet || !mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-46.6333, -23.5505], // São Paulo
      zoom: 11
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on('load', () => {
      // Add a source for the route line
      map.current?.addSource("route-line", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: []
          }
        }
      });

      // Add a layer for the route line
      map.current?.addLayer({
        id: "route-line",
        type: "line",
        source: "route-line",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#00f5ff", // Neon Cyan
          "line-width": 5,
          "line-opacity": 0.8
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isTokenSet, mapboxToken]);

  const { data: routes, isLoading: isLoadingRoutes } = useQuery({
    queryKey: ["routes", user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("routes")
        .select(`
          *,
          driver:drivers(name),
          stops:route_stops(*)
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
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id && isTokenSet
  });

  const selectedRouteDetails = routes?.find(r => r.id === selectedRouteId);

  // Query para buscar as direções do Mapbox Directions API
  const { data: directionsData, isLoading: isLoadingDirections } = useQuery({
    queryKey: ['mapboxDirections', selectedRouteId, mapboxToken],
    queryFn: async () => {
      if (!selectedRouteDetails || !mapboxToken || !selectedRouteDetails.origin_lat || !selectedRouteDetails.origin_lng || !selectedRouteDetails.destination_lat || !selectedRouteDetails.destination_lng) {
        return null;
      }

      const coordinates = [];
      coordinates.push(`${selectedRouteDetails.origin_lng},${selectedRouteDetails.origin_lat}`);

      // Adicionar paradas intermediárias se existirem e estiverem ordenadas
      if (selectedRouteDetails.stops && selectedRouteDetails.stops.length > 0) {
        selectedRouteDetails.stops
          .sort((a: any, b: any) => a.stop_order - b.stop_order)
          .forEach((stop: any) => {
            if (stop.latitude && stop.longitude) {
              coordinates.push(`${stop.longitude},${stop.latitude}`);
            }
          });
      }
      
      coordinates.push(`${selectedRouteDetails.destination_lng},${selectedRouteDetails.destination_lat}`);

      const coordinatesString = coordinates.join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxToken}`;

      const response = await axios.get(url);
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          geometry: route.geometry,
          distance: route.distance / 1000, // Convert meters to kilometers
          duration: route.duration / 60, // Convert seconds to minutes
        };
      }
      return null;
    },
    enabled: !!selectedRouteDetails && !!mapboxToken, // Só executa se houver rota selecionada e token
  });

  const updateMapWithRoutes = useCallback(() => {
    if (!map.current || !routes) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Clear existing route line
    if (map.current.getSource("route-line")) {
      (map.current.getSource("route-line") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: []
        }
      });
    }

    let allCoordinates: [number, number][] = [];

    routes.forEach(route => {
      // Add origin and destination markers for each route
      if (route.origin_lat && route.origin_lng) {
        const el = document.createElement("div");
        el.className = "marker-origin";
        el.style.backgroundColor = "#00f5ff"; // Neon Cyan for origin
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.color = "white";
        el.style.fontWeight = "bold";
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([route.origin_lng, route.origin_lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<div class="p-2 bg-card text-foreground rounded-lg shadow-md">
                  <h3 class="font-semibold text-lg flex items-center gap-2 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Origem: ${route.name}
                  </h3>
                  <p class="text-sm text-muted-foreground mt-1">${route.origin_address}</p>
                </div>`
              )
          )
          .addTo(map.current!);
        markers.current.push(marker);
        allCoordinates.push([route.origin_lng, route.origin_lat]);
      }

      if (route.destination_lat && route.destination_lng) {
        const el = document.createElement("div");
        el.className = "marker-destination";
        el.style.backgroundColor = "#7c3aed"; // AI Purple for destination
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.color = "white";
        el.style.fontWeight = "bold";
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flag"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([route.destination_lng, route.destination_lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<div class="p-2 bg-card text-foreground rounded-lg shadow-md">
                  <h3 class="font-semibold text-lg flex items-center gap-2 text-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flag"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                    Destino: ${route.name}
                  </h3>
                  <p class="text-sm text-muted-foreground mt-1">${route.destination_address}</p>
                </div>`
              )
          )
          .addTo(map.current!);
        markers.current.push(marker);
        allCoordinates.push([route.destination_lng, route.destination_lat]);
      }

      // Add markers for stops (coletas/entregas)
      route.stops?.forEach((stop: any) => {
        if (stop.latitude && stop.longitude) {
          const el = document.createElement("div");
          el.className = "marker-stop";
          el.style.backgroundColor = stop.type === "coleta" ? "#22c55e" : "#3b82f6"; // Green for coleta, blue for entrega
          el.style.width = "20px";
          el.style.height = "20px";
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.cursor = "pointer";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.color = "white";
          el.style.fontWeight = "bold";
          el.textContent = stop.stop_order.toString(); // Display stop order

          const marker = new mapboxgl.Marker(el)
            .setLngLat([stop.longitude, stop.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(
                  `<div class="p-2 bg-card text-foreground rounded-lg shadow-md">
                    <h3 class="font-semibold text-lg flex items-center gap-2 ${stop.type === "coleta" ? "text-success-green" : "text-neural"}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M18 8c0 4.5-6 9-6 9s-6-4.5-6-9a6 6 0 0 1 12 0Z"/><circle cx="12" cy="8" r="2"/></svg>
                      ${stop.type === "coleta" ? "Coleta" : "Entrega"} #${stop.stop_order}
                    </h3>
                    <p class="text-sm text-muted-foreground mt-1">${stop.address}</p>
                    <p class="text-xs text-muted-foreground">Status: ${stop.status}</p>
                    <p class="text-xs text-muted-foreground">Rota: ${route.name}</p>
                  </div>`
                )
            )
            .addTo(map.current!);

          markers.current.push(marker);
          allCoordinates.push([stop.longitude, stop.latitude]);
        }
      });
    });

    // Draw route line for the selected route using directionsData
    if (selectedRouteId && directionsData && map.current.getSource("route-line")) {
      (map.current.getSource("route-line") as mapboxgl.GeoJSONSource).setData(directionsData.geometry);

      // Fit map to route bounds
      const bounds = new mapboxgl.LngLatBounds();
      directionsData.geometry.coordinates.forEach((coord: [number, number]) => bounds.extend(coord as mapboxgl.LngLatLike));
      map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    } else if (allCoordinates.length > 0) {
      // If no specific route is selected or directions not loaded, fit to all markers
      const bounds = new mapboxgl.LngLatBounds();
      allCoordinates.forEach(coord => bounds.extend(coord as mapboxgl.LngLatLike));
      map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  }, [routes, selectedRouteId, directionsData]); // Adicionado directionsData como dependência

  useEffect(() => {
    updateMapWithRoutes();
  }, [routes, selectedRouteId, updateMapWithRoutes]);

  const handleTokenSubmit = () => {
    if (!mapboxToken) {
      toast({
        title: "Token Mapbox Vazio",
        description: "Por favor, insira seu token público do Mapbox.",
        variant: "destructive"
      });
      return;
    }
    localStorage.setItem("mapbox_token", mapboxToken);
    setIsTokenSet(true);
    // setIsConfigDialogOpen(false); // Removido
    toast({
      title: "Token Mapbox Salvo",
      description: "O token foi salvo e o mapa será inicializado.",
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {!isTokenSet && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Configurar Mapbox</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Para visualizar o mapa, insira seu token público do Mapbox.
              Obtenha em:{" "}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                mapbox.com
              </a>
            </p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <Button
                onClick={handleTokenSubmit}
                className="w-full"
                disabled={!mapboxToken}
              >
                Inicializar Mapa
              </Button>
            </div>
          </div>
        </div>
      )}

      {isTokenSet && (
        <>
          {/* Removido o botão de configuração */}
          {/* <div className="absolute top-4 right-4 z-10">
            <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="bg-card/80 hover:bg-card border border-border/50 rounded-full shadow-lg">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
                <DialogHeader>
                  <DialogTitle>Configurações do Mapa</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="mapbox-token">Token Público do Mapbox</Label>
                    <Input
                      id="mapbox-token"
                      type="text"
                      value={mapboxToken}
                      onChange={(e) => setMapboxToken(e.target.value)}
                      placeholder="pk.eyJ1Ijoi..."
                    />
                  </div>
                  <Button onClick={handleTokenSubmit}>Salvar Token</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div> */}

          {selectedRouteDetails && (
            <Card className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">{selectedRouteDetails.name}</h3>
                {isLoadingDirections ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Calculando rota...</span>
                  </div>
                ) : directionsData ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Gauge className="h-4 w-4" />
                      <span>Distância: {directionsData.distance.toFixed(2)} km</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duração: {Math.round(directionsData.duration)} min</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-destructive">Não foi possível calcular a rota.</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}