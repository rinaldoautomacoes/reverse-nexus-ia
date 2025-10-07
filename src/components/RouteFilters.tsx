import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface RouteFiltersProps {
  filters: {
    date: string;
    driverId: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function RouteFilters({ filters, onFiltersChange }: RouteFiltersProps) {
  const { user } = useAuth();

  const { data: drivers } = useQuery({
    queryKey: ["drivers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          type="date"
          value={filters.date}
          onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="driver">Motorista</Label>
        <Select
          value={filters.driverId}
          onValueChange={(value) => onFiltersChange({ ...filters, driverId: value })}
        >
          <SelectTrigger id="driver">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {drivers?.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="planejada">Planejada</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
