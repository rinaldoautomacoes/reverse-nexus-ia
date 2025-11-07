import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { DriverCombobox } from "@/components/DriverCombobox";
import { TransportadoraCombobox } from "@/components/TransportadoraCombobox";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;

interface ColetaLogisticsDetailsProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  handleDriverSelect: (driver: Driver | null) => void;
  handleTransportadoraSelect: (transportadora: Transportadora | null) => void;
  isPending: boolean;
}

export const ColetaLogisticsDetails: React.FC<ColetaLogisticsDetailsProps> = ({
  formData,
  handleInputChange,
  handleDriverSelect,
  handleTransportadoraSelect,
  isPending,
}) => {
  const { user } = useAuth(); // Use useAuth to ensure user is loaded

  if (!user) {
    // Optionally, render a loading state or redirect if user is not available
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Carregando detalhes de logística...</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driver">Motorista</Label>
          <DriverCombobox
            value={formData.driver_id}
            onValueChange={(id) => handleInputChange("driver_id", id)}
            onDriverSelect={handleDriverSelect}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transportadora">Transportadora</Label>
          <TransportadoraCombobox
            value={formData.transportadora_id}
            onValueChange={(id) => handleInputChange("transportadora_id", id)}
            onTransportadoraSelect={handleTransportadoraSelect}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="freight_value">Valor do Frete</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="freight_value"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="pl-10"
            value={formData.freight_value || ''}
            onChange={(e) => handleInputChange("freight_value", parseFloat(e.target.value) || null)}
            disabled={isPending}
          />
        </div>
      </div>
    </>
  );
};