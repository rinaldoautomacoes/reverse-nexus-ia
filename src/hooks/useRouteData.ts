import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";

type Route = Tables<'routes'> & {
  driver?: { name: string } | null;
  stops?: Array<any> | null;
};

interface UseRouteDataProps {
  userId: string | undefined;
  filters: {
    date: string;
    driverId: string;
    status: string;
  };
}

export const useRouteData = ({ userId, filters }: UseRouteDataProps) => {
  const { data: routes, isLoading: isLoadingRoutes, error: routesError } = useQuery<Route[], Error>({
    queryKey: ["routes", userId, filters],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("routes")
        .select(`
          *,
          driver:drivers(name),
          stops:route_stops(*)
        `) // Select all stop details
        .eq("user_id", userId)
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
      return data as Route[];
    },
    enabled: !!userId
  });

  return { routes, isLoadingRoutes, routesError };
};