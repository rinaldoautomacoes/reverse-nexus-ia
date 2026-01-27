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
    if (!isTokenSet || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-46.6333, -23.5505], // São Paulo
      zoom: 11
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current.on('load', () => {
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
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapInitialized(false);
    };
  }, [isTokenSet, mapboxToken, mapContainerRef]);

  return { map: mapRef.current, isMapInitialized };
};