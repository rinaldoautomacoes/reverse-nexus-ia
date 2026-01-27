import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Tables } from '@/integrations/supabase/types_generated';

type Route = Tables<'routes'> & {
  driver?: { name: string } | null;
  stops?: Array<{ latitude: number; longitude: number; stop_order: number; type: string; address: string }> | null;
};

interface MapMarkersAndLinesProps {
  map: mapboxgl.Map | null;
  routes: Route[] | undefined;
  selectedRouteId: string | null;
  selectedRouteDetails: Route | undefined;
  directionsData: any; // Use a more specific type if available
}

export const MapMarkersAndLines: React.FC<MapMarkersAndLinesProps> = ({
  map,
  routes,
  selectedRouteId,
  selectedRouteDetails,
  directionsData,
}) => {
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !routes) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Clear existing route line
    if (map.getSource("route-line")) {
      (map.getSource("route-line") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: []
        }
      });
    }

    let allCoordinates: [number, number][] = [];

    // Draw the selected route line
    if (selectedRouteId && directionsData && directionsData.geometry && map.getSource("route-line")) {
      (map.getSource("route-line") as mapboxgl.GeoJSONSource).setData(directionsData.geometry);
      allCoordinates.push(...directionsData.geometry.coordinates);
    }

    // Add markers for all routes (or just the selected one if preferred)
    const routesToMark = selectedRouteDetails ? [selectedRouteDetails] : routes;

    routesToMark.forEach(route => {
      // Add origin and destination markers
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
          .addTo(map);
        markers.current.push(marker);
        if (!selectedRouteId) allCoordinates.push([route.origin_lng, route.origin_lat]);
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
          .addTo(map);
        markers.current.push(marker);
        if (!selectedRouteId) allCoordinates.push([route.destination_lng, route.destination_lat]);
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
            .addTo(map);

          markers.current.push(marker);
          if (!selectedRouteId) allCoordinates.push([stop.longitude, stop.latitude]);
        }
      });
    });

    // Fit map to bounds
    if (allCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      allCoordinates.forEach(coord => bounds.extend(coord as mapboxgl.LngLatLike));
      map.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  }, [map, routes, selectedRouteId, selectedRouteDetails, directionsData]);

  return null; // This component only manages side effects on the map
};