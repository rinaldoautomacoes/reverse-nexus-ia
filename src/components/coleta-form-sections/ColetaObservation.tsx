import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;

interface ColetaObservationProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  isPending: boolean;
}

export const ColetaObservation: React.FC<ColetaObservationProps> = ({
  formData,
  handleInputChange,
  isPending,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="observacao">Observações</Label>
      <Textarea
        id="observacao"
        placeholder="Informações adicionais sobre a coleta..."
        value={formData.observacao || ''}
        onChange={(e) => handleInputChange("observacao", e.target.value)}
        rows={4}
        disabled={isPending}
      />
    </div>
  );
};