import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types_generated';

type Route = Tables<'routes'> & {
  driver?: { name: string } | null;
  stops?: Array<{ latitude: number; longitude: number; stop_order: number }> | null;
};

type TransportMode = 'driving' | 'walking' | 'cycling' | 'public_transport';

interface UseDirectionsDataProps {
  selectedRouteDetails: Route | undefined;
  mapboxToken: string;
  selectedTransportMode: TransportMode;
}

export const useDirectionsData = ({ selectedRouteDetails, mapboxToken, selectedTransportMode }: UseDirectionsDataProps) => {
  const { toast } = useToast();
  const [modeDurations, setModeDurations] = useState<Partial<Record<TransportMode, number>>>({});

  // Effect to fetch durations for all modes when selectedRouteDetails changes
  useEffect(() => {
    const fetchAllModeDurations = async () => {
      if (!selectedRouteDetails || !mapboxToken || !selectedRouteDetails.origin_lat || !selectedRouteDetails.origin_lng || !selectedRouteDetails.destination_lat || !selectedRouteDetails.destination_lng) {
        setModeDurations({});
        return;
      }

      const coordinates = [];
      coordinates.push(`${selectedRouteDetails.origin_lng},${selectedRouteDetails.origin_lat}`);
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

      const modesToFetch: Array<'driving' | 'walking' | 'cycling'> = ['driving', 'walking', 'cycling'];
      const fetchedDurations: Partial<Record<TransportMode, number>> = {};

      for (const mode of modesToFetch) {
        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${coordinatesString}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxToken}`;
          const response = await axios.get(url);
          if (response.data.routes && response.data.routes.length > 0) {
            fetchedDurations[mode] = response.data.routes[0].duration; // duration in seconds
          }
        } catch (error) {
          console.error(`Error fetching directions for ${mode}:`, error);
        }
      }

      // Simulate public transport duration (e.g., 2x driving time, or a fixed value)
      if (fetchedDurations.driving) {
        fetchedDurations.public_transport = fetchedDurations.driving * 2; // Example: 2x driving time
      } else {
        fetchedDurations.public_transport = 2 * 86400; // 2 days in seconds
      }
      
      setModeDurations(fetchedDurations);
    };

    fetchAllModeDurations();
  }, [selectedRouteDetails, mapboxToken]);

  // Query to fetch directions for the *selected* mode
  const { data: directionsData, isLoading: isLoadingDirections } = useQuery({
    queryKey: ['mapboxDirections', selectedRouteDetails?.id, mapboxToken, selectedTransportMode],
    queryFn: async () => {
      if (!selectedRouteDetails || !mapboxToken || !selectedRouteDetails.origin_lat || !selectedRouteDetails.origin_lng || !selectedRouteDetails.destination_lat || !selectedRouteDetails.destination_lng) {
        return null;
      }

      // Handle public_transport as a special case (no direct Mapbox API profile)
      if (selectedTransportMode === 'public_transport') {
        return {
          geometry: { type: "LineString", coordinates: [] }, // Empty geometry
          distance: 0,
          duration: modeDurations.public_transport || 0, // Use the pre-calculated/simulated duration
        };
      }

      const coordinates = [];
      coordinates.push(`${selectedRouteDetails.origin_lng},${selectedRouteDetails.origin_lat}`);
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
      const url = `https://api.mapbox.com/directions/v5/mapbox/${selectedTransportMode}/${coordinatesString}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxToken}`;
      
      const response = await axios.get(url);
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          geometry: route.geometry,
          distance: route.distance / 1000, // Convert meters to kilometers
          duration: route.duration, // Keep duration in seconds
        };
      }
      return null;
    },
    enabled: !!selectedRouteDetails && !!mapboxToken,
  });

  return { directionsData, isLoadingDirections, modeDurations };
};