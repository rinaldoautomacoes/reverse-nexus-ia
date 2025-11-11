import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Flag, Loader2 } from 'lucide-react';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types_generated';
import { CepInputWithRecents } from '@/components/CepInputWithRecents';
import { useAddressLookup } from '@/hooks/useAddressLookup';

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;

interface DestinationAddressSectionProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  isFormDisabled: boolean;
  setIsGeocoding: (value: boolean) => void;
  title?: string;
  cepLabel?: string;
  addressLabel?: string;
}

export const DestinationAddressSection: React.FC<DestinationAddressSectionProps> = ({
  formData,
  handleInputChange,
  isFormDisabled,
  setIsGeocoding,
  title = 'Destino da Coleta',
  cepLabel = 'CEP de Destino',
  addressLabel = 'Endereço de Destino',
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
    setIsGeocoding(false); // Ensure geocoding state is reset
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

  // Update parent's isGeocoding state
  React.useEffect(() => {
    setIsGeocoding(isFetching);
  }, [isFetching, setIsGeocoding]);

  return (
    <div className="space-y-2 border-t border-border/30 pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-accent">
        <Flag className="h-5 w-5" /> {title}
      </h3>
      <div className="space-y-2">
        <Label>{cepLabel}</Label>
        <div className="relative">
          <CepInputWithRecents
            id="cep_destino"
            placeholder="Ex: 02000-000"
            value={cepInput}
            onChange={(value) => setCepInput(value)}
            onBlur={fetchAddress}
            disabled={isFormDisabled || isFetching}
            isOrigin={false}
          />
          {isFetching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-accent" />}
        </div>
      </div>
      <div className="space-y-2">
        <Label>{addressLabel}</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="endereco_destino"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              handleInputChange('endereco_destino', e.target.value);
            }}
            placeholder="Endereço completo de destino"
            className="pl-10"
            disabled={isFormDisabled || isFetching}
          />
        </div>
      </div>
    </div>
  );
};