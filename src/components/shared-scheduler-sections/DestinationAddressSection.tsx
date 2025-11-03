import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Flag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types_generated';
import { CepInputWithRecents } from '@/components/CepInputWithRecents'; // Import the new component

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
  const { toast } = useToast();

  const fetchAddressByCep = async (cep: string) => {
    setIsGeocoding(true);
    handleInputChange('endereco_destino', '');
    handleInputChange('destination_lat', null);
    handleInputChange('destination_lng', null);

    try {
      const cleanedCep = cep.replace(/\D/g, '');
      if (cleanedCep.length !== 8) {
        toast({ title: "CEP Inválido", description: "Por favor, insira um CEP com 8 dígitos.", variant: "destructive" });
        return;
      }

      const { data } = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`);

      if (data.erro) {
        toast({ title: "CEP Não Encontrado", description: "Não foi possível encontrar o endereço para o CEP informado.", variant: "destructive" });
        return;
      }

      const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
      handleInputChange('endereco_destino', fullAddress);
      handleInputChange('cep_destino', cleanedCep);

      const mapboxAccessToken = localStorage.getItem("mapbox_token");
      if (mapboxAccessToken) {
        const geoResponse = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxAccessToken}`
        );
        if (geoResponse.data.features && geoResponse.data.features.length > 0) {
          const [lng, lat] = geoResponse.data.features[0].center;
          handleInputChange('destination_lat', lat);
          handleInputChange('destination_lng', lng);
        } else {
          toast({ title: "Geocodificação Falhou", description: "Não foi possível obter as coordenadas para o endereço.", variant: "warning" });
        }
      } else {
        toast({ title: "Token Mapbox Ausente", description: "Insira seu token Mapbox para geocodificação.", variant: "warning" });
      }

    } catch (error) {
      console.error("Erro ao buscar endereço ou geocodificar:", error);
      toast({ title: "Erro na Busca de Endereço", description: "Ocorreu um erro ao buscar o endereço. Tente novamente.", variant: "destructive" });
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-border/30 pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-accent">
        <Flag className="h-5 w-5" /> {title}
      </h3>
      <div className="space-y-2">
        <Label>{cepLabel}</Label>
        <div className="relative">
          <CepInputWithRecents // Using the new component
            id="cep_destino"
            placeholder="Ex: 02000-000"
            value={formData.cep_destino || ''}
            onChange={(value) => handleInputChange('cep_destino', value)}
            onBlur={() => fetchAddressByCep(formData.cep_destino || '')}
            disabled={isFormDisabled}
            isOrigin={false}
          />
          {isFormDisabled && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-accent" />}
        </div>
      </div>
      <div className="space-y-2">
        <Label>{addressLabel}</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={formData.endereco_destino || ''}
            onChange={(e) => handleInputChange('endereco_destino', e.target.value)}
            placeholder="Endereço completo de destino"
            className="pl-10"
            disabled={isFormDisabled}
          />
        </div>
      </div>
    </div>
  );
};