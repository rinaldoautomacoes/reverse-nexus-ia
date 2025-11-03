import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Home, Loader2 } from "lucide-react";
import { useAddressLookup } from "@/hooks/useAddressLookup";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { CepInputWithRecents } from '@/components/CepInputWithRecents'; // Import the new component

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;

interface ColetaOriginAddressProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  isPending: boolean;
}

export const ColetaOriginAddress: React.FC<ColetaOriginAddressProps> = ({
  formData,
  handleInputChange,
  isPending,
}) => {
  const onAddressFound = (
    fullAddress: string,
    cep: string,
    lat: number | null,
    lng: number | null,
    isOrigin: boolean
  ) => {
    if (isOrigin) {
      handleInputChange("endereco_origem", fullAddress);
      handleInputChange("cep_origem", cep);
      handleInputChange("origin_lat", lat);
      handleInputChange("origin_lng", lng);
      // For backward compatibility/display, update the main 'endereco' and 'cep' fields
      handleInputChange("endereco", fullAddress);
      handleInputChange("cep", cep);
    }
  };

  const {
    cepInput,
    setCepInput,
    addressInput,
    setAddressInput,
    isFetching,
    fetchAddress,
  } = useAddressLookup({
    isOrigin: true,
    initialCep: formData.cep_origem,
    initialAddress: formData.endereco_origem,
    onAddressFound,
  });

  // Keep local state in sync with formData if it changes externally (e.g., initialData load)
  React.useEffect(() => {
    setCepInput(formData.cep_origem || '');
    setAddressInput(formData.endereco_origem || '');
  }, [formData.cep_origem, formData.endereco_origem, setCepInput, setAddressInput]);

  return (
    <div className="space-y-2 border-t border-border/30 pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
        <Home className="h-5 w-5" /> Origem da Coleta
      </h3>
      <div className="space-y-2">
        <Label htmlFor="cep_origem">CEP de Origem *</Label>
        <div className="relative">
          <CepInputWithRecents // Using the new component
            id="cep_origem"
            placeholder="Ex: 01000-000"
            value={cepInput}
            onChange={(value) => setCepInput(value)}
            onBlur={fetchAddress}
            disabled={isPending || isFetching}
            isOrigin={true}
          />
          {isFetching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endereco_origem">Endereço de Origem *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="endereco_origem"
            placeholder="Endereço completo para coleta"
            className="pl-10"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              handleInputChange("endereco_origem", e.target.value);
              // Also update the main 'endereco' for backward compatibility/display
              handleInputChange("endereco", e.target.value);
            }}
            required
            disabled={isPending || isFetching}
          />
        </div>
      </div>
    </div>
  );
};