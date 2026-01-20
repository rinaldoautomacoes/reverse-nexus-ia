import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Home, Loader2, Hash } from 'lucide-react';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types_generated';
import { CepInputWithRecents } from '@/components/CepInputWithRecents';
import { useAddressLookup } from '@/hooks/useAddressLookup';

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;

interface OriginAddressSectionProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  isFormDisabled: boolean;
  setIsGeocoding: (value: boolean) => void;
  title?: string;
  cepLabel?: string;
  addressLabel?: string;
}

export const OriginAddressSection: React.FC<OriginAddressSectionProps> = ({
  formData,
  handleInputChange,
  isFormDisabled,
  setIsGeocoding,
  title = 'Origem da Coleta',
  cepLabel = 'CEP de Origem',
  addressLabel = 'Endereço de Origem',
}) => {
  const onAddressFound = (
    fullAddress: string,
    cep: string,
    lat: number | null,
    lng: number | null,
    isOrigin: boolean
  ) => {
    console.log("OriginAddressSection: onAddressFound called with:", { fullAddress, cep, lat, lng, isOrigin });
    if (isOrigin) {
      handleInputChange("endereco_origem", fullAddress);
      handleInputChange("cep_origem", cep);
      handleInputChange("origin_lat", lat);
      handleInputChange("origin_lng", lng);
      // For backward compatibility/display, update the main 'endereco' and 'cep' fields
      handleInputChange("endereco", fullAddress);
      handleInputChange("cep", cep);
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

  // Update parent's isGeocoding state
  React.useEffect(() => {
    setIsGeocoding(isFetching);
  }, [isFetching, setIsGeocoding]);

  return (
    <div className="space-y-2 border-t border-border/30 pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
        <Home className="h-5 w-5" /> {title}
      </h3>
      <div className="space-y-2">
        <Label>{cepLabel} *</Label>
        <div className="relative">
          <CepInputWithRecents
            id="cep_origem"
            placeholder="Ex: 01000-000"
            value={cepInput}
            onChange={(value) => {
              setCepInput(value);
              handleInputChange('cep_origem', value);
            }}
            onBlur={fetchAddress}
            disabled={isFormDisabled || isFetching}
            isOrigin={true}
          />
          {isFetching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4"> {/* Usar grid para endereço e número */}
        <div className="space-y-2 col-span-2">
          <Label>{addressLabel} *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="endereco_origem"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                handleInputChange('endereco_origem', e.target.value);
                handleInputChange('endereco', e.target.value); // For backward compatibility/display
              }}
              placeholder="Endereço completo para coleta"
              className="pl-10"
              disabled={isFormDisabled || isFetching}
              required
            />
          </div>
        </div>
        <div className="space-y-2 col-span-1">
          <Label htmlFor="origin_address_number">Número</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="origin_address_number"
              value={formData.origin_address_number || ''}
              onChange={(e) => handleInputChange("origin_address_number", e.target.value)}
              placeholder="Nº"
              className="pl-10"
              disabled={isFormDisabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};