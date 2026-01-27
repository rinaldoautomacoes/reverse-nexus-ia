import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface UseMapInitializationProps {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  mapboxToken: string;
  isTokenSet: boolean;
}

export const useMapInitialization = ({ mapContainerRef, mapboxToken, isTokenSet }: UseMapInitializationProps) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    // Only proceed if token is set, container ref is available, and map hasn't been initialized yet
    if (!isTokenSet || !mapContainerRef.current || mapRef.current) {
      console.log("[useMapInitialization] Skipping map initialization:", { isTokenSet, mapContainerCurrent: mapContainerRef.current, mapRefCurrent: mapRef.current });
      return;
    }

    console.log("[useMapInitialization] Initializing Mapbox map...");
    mapboxgl.accessToken = mapboxToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-46.6333, -23.5505], // São Paulo
      zoom: 11
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current.on('load', () => {
      console.log("[useMapInitialization] Map loaded. Adding sources and layers.");
      mapRef.current?.addSource("route-line", {
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

      mapRef.current?.addLayer({
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
      setIsMapInitialized(true);
      console.log("[useMapInitialization] Map initialized successfully.");
    });

    mapRef.current.on('error', (e) => {
      console.error("[useMapInitialization] Mapbox GL JS Error:", e.error);
    });

    return () => {
      console.log("[useMapInitialization] Cleaning up map...");
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapInitialized(false);
    };
  }, [isTokenSet, mapboxToken, mapContainerRef.current]); // Added mapContainerRef.current as dependency

  return { map: mapRef.current, isMapInitialized };
};