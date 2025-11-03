import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Route, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MapRoute {
  id: number;
  name: string;
  stops: number;
  coordinates: [number, number][];
  status: 'ativa' | 'otimizando' | 'pendente';
  color: string;
  eta: string;
}

interface InteractiveMapProps {
  routes?: MapRoute[];
  height?: string;
  showTokenInput?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  routes = [], 
  height = "h-96",
  showTokenInput = true 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapInitialized, setMapInitialized] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Default routes for demonstration
  const defaultRoutes: MapRoute[] = [
    {
      id: 1,
      name: "Zona Norte",
      stops: 12,
      coordinates: [
        [-43.2075, -22.9035], // Rio de Janeiro center
        [-43.1800, -22.8900], // Tijuca
        [-43.1500, -22.8700], // Maracanã
        [-43.1200, -22.8500]  // Zona Norte
      ],
      status: 'ativa',
      color: '#00f5ff',
      eta: "14:30"
    },
    {
      id: 2,
      name: "Centro",
      stops: 8,
      coordinates: [
        [-43.2075, -22.9035], // Rio center
        [-43.1900, -22.9100], // Downtown
        [-43.1750, -22.9200], // Historic center
        [-43.1650, -22.9150]  // Business district
      ],
      status: 'otimizando',
      color: '#7c3aed',
      eta: "15:45"
    },
    {
      id: 3,
      name: "Zona Sul",
      stops: 15,
      coordinates: [
        [-43.2075, -22.9035], // Rio center
        [-43.1900, -22.9300], // Copacabana direction
        [-43.1700, -22.9500], // Ipanema
        [-43.1500, -22.9700]  // Barra direction
      ],
      status: 'pendente',
      color: '#10b981',
      eta: "16:20"
    }
  ];

  const routesToDisplay = routes.length > 0 ? routes : defaultRoutes;

  const initializeMap = (token: string) => {
    if (!mapContainer.current || mapInitialized) return;

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-43.2075, -22.9035], // Rio de Janeiro
        zoom: 11,
        pitch: 45,
        bearing: 0
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        addRoutesToMap();
        setMapInitialized(true);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const addRoutesToMap = () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    routesToDisplay.forEach((route, routeIndex) => {
      // Add route line
      const routeId = `route-${route.id}`;
      
      if (!map.current!.getSource(routeId)) {
        map.current!.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          }
        });

        map.current!.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': route.color,
            'line-width': 4,
            'line-opacity': route.status === 'ativa' ? 1 : 0.6
          }
        });

        // Add animated line for active routes
        if (route.status === 'ativa') {
          map.current!.addLayer({
            id: `${routeId}-animated`,
            type: 'line',
            source: routeId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': route.color,
              'line-width': 6,
              'line-opacity': 0.4,
              'line-blur': 2
            }
          });
        }
      }

      // Add markers for stops
      route.coordinates.forEach((coord, index) => {
        const markerElement = document.createElement('div');
        markerElement.className = 'w-4 h-4 rounded-full animate-pulse-glow';
        markerElement.style.backgroundColor = route.color;
        markerElement.style.boxShadow = `0 0 10px ${route.color}`;

        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat(coord)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="text-sm">
                  <strong>${route.name}</strong><br/>
                  Parada ${index + 1} de ${route.stops}<br/>
                  Status: ${route.status}<br/>
                  ETA: ${route.eta}
                </div>
              `)
          )
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    });
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken.trim());
    }
  };

  // Auto-initialize if token is provided
  useEffect(() => {
    if (mapboxToken && !mapInitialized) {
      initializeMap(mapboxToken);
    }
  }, [mapboxToken, mapInitialized]);

  // Update routes when they change
  useEffect(() => {
    if (mapInitialized && map.current) {
      addRoutesToMap();
    }
  }, [routes, mapInitialized]);

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  if (!mapInitialized && showTokenInput) {
    return (
      <Card className="card-futuristic border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mx-auto animate-float">
              <MapPin className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Configurar Mapbox</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Para ativar o mapa interativo, insira seu token público do Mapbox.
                <br />
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Obtenha seu token aqui →
                </a>
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  type="password"
                  placeholder="Cole seu token público do Mapbox..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleTokenSubmit} className="glow-effect">
                  <Zap className="w-4 h-4 mr-2" />
                  Ativar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`relative ${height} rounded-lg overflow-hidden border border-primary/20`}>
        <div ref={mapContainer} className="absolute inset-0" />
        
        {!mapInitialized && (
          <div className="absolute inset-0 bg-gradient-dark flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando mapa...</p>
            </div>
          </div>
        )}
      </div>

      {mapInitialized && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {routesToDisplay.map((route) => (
            <Card key={route.id} className="bg-secondary/20 border-border/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full animate-pulse-glow" 
                      style={{ backgroundColor: route.color }}
                    />
                    <div>
                      <p className="font-medium text-sm">{route.name}</p>
                      <p className="text-xs text-muted-foreground">{route.stops} paradas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={route.status === 'ativa' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {route.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{route.eta}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};