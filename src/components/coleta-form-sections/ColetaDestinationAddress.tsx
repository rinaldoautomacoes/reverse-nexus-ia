import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Flag, Loader2 } from "lucide-react";
import { useAddressLookup } from "@/hooks/useAddressLookup";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { CepInputWithRecents } from '@/components/CepInputWithRecents'; // Import the new component

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;

interface ColetaDestinationAddressProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  isPending: boolean;
}

export const ColetaDestinationAddress: React.FC<ColetaDestinationAddressProps> = ({
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
    if (!isOrigin) {
      handleInputChange("endereco_destino", fullAddress);
      handleInputChange("cep_destino", cep);
      handleInputChange("destination_lat", lat);
      handleInputChange("destination_lng", lng);
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
    isOrigin: false,
    initialCep: formData.cep_destino,
    initialAddress: formData.endereco_destino,
    onAddressFound,
  });

  // Keep local state in sync with formData if it changes externally (e.g., initialData load)
  React.useEffect(() => {
    setCepInput(formData.cep_destino || '');
    setAddressInput(formData.endereco_destino || '');
  }, [formData.cep_destino, formData.endereco_destino, setCepInput, setAddressInput]);

  return (
    <div className="space-y-2 border-t border-border/30 pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-accent">
        <Flag className="h-5 w-5" /> Destino da Coleta
      </h3>
      <div className="space-y-2">
        <Label htmlFor="cep_destino">CEP de Destino</Label>
        <div className="relative">
          <CepInputWithRecents // Using the new component
            id="cep_destino"
            placeholder="Ex: 02000-000"
            value={cepInput}
            onChange={(value) => setCepInput(value)}
            onBlur={fetchAddress}
            disabled={isPending || isFetching}
            isOrigin={false}
          />
          {isFetching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-accent" />}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endereco_destino">Endereço de Destino</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="endereco_destino"
            placeholder="Endereço completo de destino"
            className="pl-10"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              handleInputChange("endereco_destino", e.target.value);
            }}
            disabled={isPending || isFetching}
          />
        </div>
      </div>
    </div>
  );
};