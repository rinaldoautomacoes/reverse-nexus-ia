import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Home, Flag, Truck, Route as RouteIcon, Calendar as CalendarIcon } from "lucide-react";
import axios from "axios";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { format, isValid } from "date-fns"; // Importar isValid
import { ptBR } from "date-fns/locale"; // Importar locale

type RouteInsert = TablesInsert<'routes'>;

interface CreateRouteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRouteDialog: React.FC<CreateRouteDialogProps> = ({ isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RouteInsert>({
    name: "",
    driver_id: null,
    date: format(new Date(), 'yyyy-MM-dd'),
    origin_address: "",
    origin_lat: null,
    origin_lng: null,
    destination_address: "",
    destination_lat: null,
    destination_lng: null,
    optimization_type: "distance",
    status: "planejada",
    user_id: user?.id || "",
    total_distance: null,
    estimated_duration: null,
  });
  const [originCep, setOriginCep] = useState("");
  const [destinationCep, setDestinationCep] = useState("");
  const [isFetchingOriginAddress, setIsFetchingOriginAddress] = useState(false);
  const [isFetchingDestinationAddress, setIsFetchingDestinationAddress] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

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
    enabled: !!user?.id && isOpen
  });

  const fetchAddressByCep = async (cep: string, isOrigin: boolean) => {
    const setFetching = isOrigin ? setIsFetchingOriginAddress : setIsFetchingDestinationAddress;
    const setAddress = isOrigin ? (addr: string) => setFormData(prev => ({ ...prev, origin_address: addr })) : (addr: string) => setFormData(prev => ({ ...prev, destination_address: addr }));
    const setLat = isOrigin ? (lat: number | null) => setFormData(prev => ({ ...prev, origin_lat: lat })) : (lat: number | null) => setFormData(prev => ({ ...prev, destination_lat: lat }));
    const setLng = isOrigin ? (lng: number | null) => setFormData(prev => ({ ...prev, origin_lng: lng })) : (lng: number | null) => setFormData(prev => ({ ...prev, destination_lng: lng }));

    setFetching(true);
    setAddress(""); // Clear previous address
    setLat(null);
    setLng(null);

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
      setAddress(fullAddress);

      // Geocodificação do endereço para obter latitude e longitude
      const mapboxAccessToken = localStorage.getItem("mapbox_token");
      if (mapboxAccessToken) {
        const geoResponse = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxAccessToken}`
        );
        if (geoResponse.data.features && geoResponse.data.features.length > 0) {
          const [lng, lat] = geoResponse.data.features[0].center;
          setLat(lat);
          setLng(lng);
        } else {
          toast({ title: "Geocodificação Falhou", description: "Não foi possível obter as coordenadas para o endereço.", variant: "destructive" });
        }
      } else {
        toast({ title: "Token Mapbox Ausente", description: "Insira seu token Mapbox para geocodificação.", variant: "destructive" });
      }

    } catch (error) {
      console.error("Erro ao buscar endereço ou geocodificar:", error);
      toast({ title: "Erro na Busca de Endereço", description: "Ocorreu um erro ao buscar o endereço. Tente novamente.", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const createRouteMutation = useMutation({
    mutationFn: async (data: RouteInsert) => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!data.origin_lat || !data.origin_lng || !data.destination_lat || !data.destination_lng) {
        throw new Error("Coordenadas de origem ou destino ausentes. Por favor, preencha os CEPs e aguarde o preenchimento automático.");
      }

      setIsCalculatingRoute(true);
      const mapboxAccessToken = localStorage.getItem("mapbox_token");
      let totalDistance = null;
      let estimatedDuration = null;

      if (mapboxAccessToken) {
        const coordinatesString = `${data.origin_lng},${data.origin_lat};${data.destination_lng},${data.destination_lat}`;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxAccessToken}`;
        
        try {
          const response = await axios.get(url);
          if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            totalDistance = route.distance / 1000; // meters to km
            estimatedDuration = Math.round(route.duration / 60); // seconds to minutes, rounded to integer
          }
        } catch (directionsError) {
          console.error("Erro ao calcular direções:", directionsError);
          toast({ title: "Erro no cálculo da rota", description: "Não foi possível calcular a distância e duração da rota.", variant: "destructive" });
        }
      } else {
        toast({ title: "Token Mapbox Ausente", description: "Insira seu token Mapbox para calcular a distância e duração da rota.", variant: "destructive" });
      }
      setIsCalculatingRoute(false);

      const { data: route, error } = await supabase
        .from("routes")
        .insert({
          user_id: user.id,
          driver_id: data.driver_id,
          name: data.name,
          date: data.date,
          origin_address: data.origin_address,
          origin_lat: data.origin_lat,
          origin_lng: data.origin_lng,
          destination_address: data.destination_address,
          destination_lat: data.destination_lat,
          destination_lng: data.destination_lng,
          optimization_type: data.optimization_type,
          status: "planejada",
          total_distance: totalDistance, // Salvar distância
          estimated_duration: estimatedDuration, // Salvar duração
        })
        .select()
        .single();

      if (error) throw error;
      return route;
    },
    onSuccess: () => {
      toast({
        title: "Rota criada com sucesso!",
        description: "A rota foi planejada e está pronta para ser otimizada."
      });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
      onOpenChange(false);
      setFormData({
        name: "",
        driver_id: null,
        date: format(new Date(), 'yyyy-MM-dd'),
        origin_address: "",
        origin_lat: null,
        origin_lng: null,
        destination_address: "",
        destination_lat: null,
        destination_lng: null,
        optimization_type: "distance",
        status: "planejada",
        user_id: user?.id || "",
        total_distance: null,
        estimated_duration: null,
      });
      setOriginCep("");
      setDestinationCep("");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar rota",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.origin_lat || !formData.origin_lng || !formData.destination_lat || !formData.destination_lng) {
      toast({
        title: "Coordenadas Ausentes",
        description: "Por favor, preencha os CEPs e aguarde o preenchimento automático dos endereços e coordenadas.",
        variant: "destructive"
      });
      return;
    }
    createRouteMutation.mutate(formData);
  };

  const isFormDisabled = createRouteMutation.isPending || isFetchingOriginAddress || isFetchingDestinationAddress || isCalculatingRoute;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <RouteIcon className="h-5 w-5" />
            Gerar Nova Rota
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Rota *</Label>
            <div className="relative">
              <RouteIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Rota SP Centro"
                className="pl-10"
                disabled={isFormDisabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver">Motorista</Label>
            <Select
              value={formData.driver_id || ''}
              onValueChange={(value) => setFormData({ ...formData, driver_id: value || null })}
              disabled={isFormDisabled}
            >
              <SelectTrigger id="driver" className="pl-10">
                <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecione um motorista" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                required
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="pl-10"
                disabled={isFormDisabled}
              />
            </div>
          </div>

          {/* Origem */}
          <div className="space-y-2 border-t border-border/30 pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Home className="h-5 w-5" /> Origem
            </h3>
            <div className="space-y-2">
              <Label htmlFor="origin-cep">CEP de Origem *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="origin-cep"
                  required
                  value={originCep}
                  onChange={(e) => setOriginCep(e.target.value)}
                  onBlur={() => fetchAddressByCep(originCep, true)}
                  placeholder="Ex: 01000-000"
                  className="pl-10"
                  disabled={isFormDisabled}
                />
                {isFetchingOriginAddress && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin-address">Endereço de Origem *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="origin-address"
                  required
                  value={formData.origin_address || ''}
                  onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                  placeholder="Endereço de partida"
                  className="pl-10"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </div>

          {/* Destino */}
          <div className="space-y-2 border-t border-border/30 pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-accent">
              <Flag className="h-5 w-5" /> Destino
            </h3>
            <div className="space-y-2">
              <Label htmlFor="destination-cep">CEP de Destino *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination-cep"
                  required
                  value={destinationCep}
                  onChange={(e) => setDestinationCep(e.target.value)}
                  onBlur={() => fetchAddressByCep(destinationCep, false)}
                  placeholder="Ex: 02000-000"
                  className="pl-10"
                  disabled={isFormDisabled}
                />
                {isFetchingDestinationAddress && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-accent" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination-address">Endereço de Destino *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination-address"
                  required
                  value={formData.destination_address || ''}
                  onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                  placeholder="Endereço de chegada"
                  className="pl-10"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/30 pt-4">
            <Label htmlFor="optimization">Tipo de Otimização</Label>
            <Select
              value={formData.optimization_type || 'distance'}
              onValueChange={(value) => setFormData({ ...formData, optimization_type: value })}
              disabled={isFormDisabled}
            >
              <SelectTrigger id="optimization" className="pl-10">
                <RouteIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Menor Distância</SelectItem>
                <SelectItem value="time">Menor Tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isFormDisabled}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isFormDisabled}>
              {(createRouteMutation.isPending || isCalculatingRoute) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Rota
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}