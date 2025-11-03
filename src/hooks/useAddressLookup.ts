import { useState, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

interface UseAddressLookupProps {
  isOrigin: boolean;
  initialCep?: string | null;
  initialAddress?: string | null;
  onAddressFound: (
    fullAddress: string,
    cep: string,
    lat: number | null,
    lng: number | null,
    isOrigin: boolean
  ) => void;
}

export const useAddressLookup = ({
  isOrigin,
  initialCep,
  initialAddress,
  onAddressFound,
}: UseAddressLookupProps) => {
  const { toast } = useToast();
  const [cepInput, setCepInput] = useState(initialCep || '');
  const [addressInput, setAddressInput] = useState(initialAddress || '');
  const [isFetching, setIsFetching] = useState(false);

  const fetchAddress = useCallback(async () => {
    setIsFetching(true);
    setAddressInput(""); // Clear address while fetching
    onAddressFound("", "", null, null, isOrigin); // Clear parent form data too

    try {
      const cleanedCep = cepInput.replace(/\D/g, '');
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
      setAddressInput(fullAddress);
      
      let lat: number | null = null;
      let lng: number | null = null;

      const mapboxAccessToken = localStorage.getItem("mapbox_token");
      if (mapboxAccessToken) {
        const geoResponse = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxAccessToken}`
        );
        if (geoResponse.data.features && geoResponse.data.features.length > 0) {
          [lng, lat] = geoResponse.data.features[0].center;
        } else {
          toast({ title: "Geocodificação Falhou", description: "Não foi possível obter as coordenadas para o endereço.", variant: "destructive" });
        }
      } else {
        toast({ title: "Token Mapbox Ausente", description: "Insira seu token Mapbox para geocodificação.", variant: "destructive" });
      }

      onAddressFound(fullAddress, cleanedCep, lat, lng, isOrigin);

    } catch (error) {
      console.error("Erro ao buscar endereço ou geocodificar:", error);
      toast({ title: "Erro na Busca de Endereço", description: "Ocorreu um erro ao buscar o endereço. Tente novamente.", variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [cepInput, isOrigin, onAddressFound, toast]);

  return {
    cepInput,
    setCepInput,
    addressInput,
    setAddressInput,
    isFetching,
    fetchAddress,
  };
};