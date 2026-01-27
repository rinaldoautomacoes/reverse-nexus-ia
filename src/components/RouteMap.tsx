import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Import new modular components and hooks
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { MapboxTokenManager } from "@/components/mapbox-map/MapboxTokenManager";
import { useRouteData } from "@/hooks/useRouteData";
import { useDirectionsData } from "@/hooks/useDirectionsData";
import { MapControls } from "@/components/mapbox-map/MapControls";
import { MapMarkersAndLines } from "@/components/mapbox-map/MapMarkersAndLines"; // Caminho de importação corrigido

type TransportMode = 'driving' | 'walking' | 'cycling' | 'public_transport';

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
  const [mapboxToken, setMapboxToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [selectedTransportMode, setSelectedTransportMode] = useState<TransportMode>('driving');

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("mapbox_token");
    if (savedToken) {
      setMapboxToken(savedToken);
      setIsTokenSet(true);
    }
  }, []);

  // Map Initialization Hook
  const { map, isMapInitialized } = useMapInitialization({ mapContainerRef: mapContainer, mapboxToken, isTokenSet });

  // Route Data Hook
  const { routes, isLoadingRoutes, routesError } = useRouteData({ userId: user?.id, filters });

  const selectedRouteDetails = routes?.find(r => r.id === selectedRouteId);

  // Directions Data Hook
  const { directionsData, isLoadingDirections, modeDurations } = useDirectionsData({
    selectedRouteDetails,
    mapboxToken,
    selectedTransportMode,
  });

  const handleTokenSet = (token: string) => {
    setMapboxToken(token);
    setIsTokenSet(true);
  };

  if (isLoadingRoutes) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Carregando rotas...</p>
      </div>
    );
  }

  if (routesError) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center text-destructive">
        <p>Erro ao carregar rotas: {routesError.message}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {!isTokenSet && <MapboxTokenManager onTokenSet={handleTokenSet} />}

      {isTokenSet && isMapInitialized && (
        <>
          <MapControls
            selectedRouteDetails={selectedRouteDetails}
            directionsData={directionsData}
            isLoadingDirections={isLoadingDirections}
            selectedTransportMode={selectedTransportMode}
            setSelectedTransportMode={setSelectedTransportMode}
            modeDurations={modeDurations}
          />
          <MapMarkersAndLines
            map={map}
            routes={routes}
            selectedRouteId={selectedRouteId}
            selectedRouteDetails={selectedRouteDetails}
            directionsData={directionsData}
          />
        </>
      )}
    </div>
  );
}