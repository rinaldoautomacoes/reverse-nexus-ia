import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, Calendar as CalendarIcon, User, Phone, Mail, MapPin, Building, Briefcase, Loader2, Hash, Package, DollarSign, Tag, Home, Flag, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, generateUniqueNumber } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientCombobox } from "@/components/ClientCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { DriverCombobox } from "@/components/DriverCombobox";
import { TransportadoraCombobox } from "@/components/TransportadoraCombobox";
import axios from "axios";

type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;
type ItemInsert = TablesInsert<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

interface EntregaFormProps {
  initialData?: ColetaUpdate;
  onSave: (data: ColetaInsert | ColetaUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const EntregaForm: React.FC<EntregaFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ColetaInsert | ColetaUpdate>(initialData || {
    parceiro: "",
    endereco: "", // This will be mapped to endereco_destino for display purposes
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
    qtd_aparelhos_solicitado: 1,
    modelo_aparelho: "",
    status_coleta: "agendada",
    observacao: "",
    telefone: "",
    email: "",
    contato: "",
    responsavel: "",
    responsible_user_id: null,
    client_id: null,
    type: "entrega",
    user_id: user?.id || "",
    cep: "", // This will be mapped to cep_destino for display purposes
    bairro: "",
    cidade: "",
    uf: "",
    localidade: "",
    cnpj: "",
    contrato: "",
    nf_glbl: "",
    nf_metodo: "",
    cep_origem: "",
    endereco_origem: "",
    cep_destino: "",
    endereco_destino: "",
    driver_id: null,
    transportadora_id: null,
    freight_value: null,
    unique_number: generateUniqueNumber('ENT'),
    origin_lat: null,
    origin_lng: null,
    destination_lat: null,
    destination_lng: null,
    client_control: "", // Novo campo
  });

  const [cepOrigemInput, setCepOrigemInput] = useState(initialData?.cep_origem || '');
  const [enderecoOrigemInput, setEnderecoOrigemInput] = useState(initialData?.endereco_origem || '');
  const [cepDestinoInput, setCepDestinoInput] = useState(initialData?.cep_destino || '');
  const [enderecoDestinoInput, setEnderecoDestinoInput] = useState(initialData?.endereco_destino || '');

  const [isFetchingOriginAddress, setIsFetchingOriginAddress] = useState(false);
  const [isFetchingDestinationAddress, setIsFetchingDestinationAddress] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Destructure initialData to separate direct columns from joined relations
      const { driver, transportadora, ...restOfEntregaData } = initialData;
      setFormData(restOfEntregaData); // Only set direct columns
      setCepOrigemInput(initialData.cep_origem || '');
      setEnderecoOrigemInput(initialData.endereco_origem || '');
      setCepDestinoInput(initialData.cep_destino || '');
      setEnderecoDestinoInput(initialData.endereco_destino || '');
    } else {
      setFormData({
        parceiro: "",
        endereco: "",
        previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
        qtd_aparelhos_solicitado: 1,
        modelo_aparelho: "",
        status_coleta: "agendada",
        observacao: "",
        telefone: "",
        email: "",
        contato: "",
        responsavel: "",
        responsible_user_id: null,
        client_id: null,
        type: "entrega",
        user_id: user?.id || "",
        cep: "",
        bairro: "",
        cidade: "",
        uf: "",
        localidade: "",
        cnpj: "",
        contrato: "",
        nf_glbl: "",
        nf_metodo: "",
        cep_origem: "",
        endereco_origem: "",
        cep_destino: "",
        endereco_destino: "",
        driver_id: null,
        transportadora_id: null,
        freight_value: null,
        unique_number: generateUniqueNumber('ENT'),
        origin_lat: null,
        origin_lng: null,
        destination_lat: null,
        destination_lng: null,
        client_control: "", // Novo campo
      });
      setCepOrigemInput('');
      setEnderecoOrigemInput('');
      setCepDestinoInput('');
      setEnderecoDestinoInput('');
    }
  }, [initialData, user?.id]);

  const handleInputChange = useCallback((field: keyof (ColetaInsert | ColetaUpdate), value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const fetchAddressByCep = async (cep: string, isOrigin: boolean) => {
    const setFetching = isOrigin ? setIsFetchingOriginAddress : setIsFetchingDestinationAddress;
    const setCepInput = isOrigin ? setCepOrigemInput : setCepDestinoInput;
    const setAddressInput = isOrigin ? setEnderecoOrigemInput : setEnderecoDestinoInput;
    const setAddressFormData = isOrigin ? (addr: string) => handleInputChange("endereco_origem", addr) : (addr: string) => handleInputChange("endereco_destino", addr);
    const setLatFormData = isOrigin ? (lat: number | null) => handleInputChange("origin_lat", lat) : (lat: number | null) => handleInputChange("destination_lat", lat);
    const setLngFormData = isOrigin ? (lng: number | null) => handleInputChange("origin_lng", lng) : (lng: number | null) => handleInputChange("destination_lng", lng);

    setFetching(true);
    setAddressInput("");
    setAddressFormData("");
    setLatFormData(null);
    setLngFormData(null);

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
      setAddressInput(fullAddress);
      setAddressFormData(fullAddress);

      // Update the main 'endereco' field for backward compatibility/display if it's the destination
      if (!isOrigin) {
        handleInputChange("endereco", fullAddress);
        handleInputChange("cep", cleanedCep);
      }

      const mapboxAccessToken = localStorage.getItem("mapbox_token");
      if (mapboxAccessToken) {
        const geoResponse = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxAccessToken}`
        );
        if (geoResponse.data.features && geoResponse.data.features.length > 0) {
          const [lng, lat] = geoResponse.data.features[0].center;
          setLatFormData(lat);
          setLngFormData(lng);
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

  const handleClientComboboxSelect = useCallback((client: Client | null) => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        parceiro: client.name,
        telefone: client.phone || '',
        email: client.email || '',
        cnpj: client.cnpj || '',
        contato: client.contact_person || '',
        client_id: client.id,
      }));
      // If client has an address, pre-fill destination address and CEP
      if (client.address) {
        setEnderecoDestinoInput(client.address);
        handleInputChange("endereco_destino", client.address);
        // Attempt to reverse geocode address to get CEP if needed, or leave CEP blank for manual entry
        // For now, just set the address. User can manually enter CEP to trigger lookup.
      }
    } else {
      setFormData(prev => ({
        ...prev,
        client_id: null,
        telefone: '',
        email: '',
        cnpj: '',
        contato: '',
      }));
    }
  }, [handleInputChange]);

  const handleProductComboboxSelect = useCallback((product: Product | null) => {
    if (product) {
      handleInputChange("modelo_aparelho", product.code);
    } else {
      handleInputChange("modelo_aparelho", "");
    }
  }, [handleInputChange]);

  const handleResponsibleUserSelect = useCallback((userProfile: Profile | null) => {
    handleInputChange("responsible_user_id", userProfile?.id || null);
    handleInputChange("responsavel", userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : null);
  }, [handleInputChange]);

  const handleDriverSelect = useCallback((driver: Driver | null) => {
    handleInputChange("driver_id", driver?.id || null);
  }, [handleInputChange]);

  const handleTransportadoraSelect = useCallback((transportadora: Transportadora | null) => {
    handleInputChange("transportadora_id", transportadora?.id || null);
  }, [handleInputChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({ title: "Erro de autenticação", description: "Usuário não logado.", variant: "destructive" });
      return;
    }

    const dataToSave = {
      ...formData,
      cep_origem: cepOrigemInput,
      endereco_origem: enderecoOrigemInput,
      cep_destino: cepDestinoInput,
      endereco_destino: enderecoDestinoInput,
      // Ensure the main 'endereco' and 'cep' fields are consistent with destination for entregas
      endereco: enderecoDestinoInput,
      cep: cepDestinoInput,
      user_id: user.id, // Ensure user_id is always set
    };

    // Call the parent onSave, which will handle the actual Supabase insert/update for 'coletas'
    // The parent mutation will then invalidate queries, including those for 'items'.
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unique_number">Número Único da Entrega</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="unique_number"
              value={formData.unique_number || ''}
              readOnly
              className="pl-10 bg-muted/50"
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_control">Controle do Cliente</Label>
          <div className="relative">
            <ClipboardList className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="client_control"
              placeholder="Ex: OS-12345, Pedido-987"
              className="pl-10"
              value={formData.client_control || ''}
              onChange={(e) => handleInputChange("client_control", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parceiro">Cliente *</Label>
          <ClientCombobox
            value={formData.parceiro || ''}
            onValueChange={(name) => handleInputChange("parceiro", name)}
            onClientSelect={handleClientComboboxSelect}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contato">Pessoa de Contato</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="contato"
              placeholder="Nome do contato"
              className="pl-10"
              value={formData.contato || ''}
              onChange={(e) => handleInputChange("contato", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="telefone"
              placeholder="(XX) XXXXX-XXXX"
              className="pl-10"
              value={formData.telefone || ''}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="contato@cliente.com"
              className="pl-10"
              value={formData.email || ''}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Campos de Origem */}
      <div className="space-y-2 border-t border-border/30 pt-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <Home className="h-5 w-5" /> Origem da Entrega
        </h3>
        <div className="space-y-2">
          <Label htmlFor="cep_origem">CEP de Origem</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="cep_origem"
              placeholder="Ex: 01000-000"
              className="pl-10"
              value={cepOrigemInput}
              onChange={(e) => setCepOrigemInput(e.target.value)}
              onBlur={() => fetchAddressByCep(cepOrigemInput, true)}
              disabled={isPending || isFetchingOriginAddress}
            />
            {isFetchingOriginAddress && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endereco_origem">Endereço de Origem</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="endereco_origem"
              placeholder="Endereço completo de origem"
              className="pl-10"
              value={enderecoOrigemInput}
              onChange={(e) => {
                setEnderecoOrigemInput(e.target.value);
                handleInputChange("endereco_origem", e.target.value);
              }}
              disabled={isPending || isFetchingOriginAddress}
            />
          </div>
        </div>
      </div>

      {/* Campos de Destino */}
      <div className="space-y-2 border-t border-border/30 pt-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-accent">
          <Flag className="h-5 w-5" /> Destino da Entrega
        </h3>
        <div className="space-y-2">
          <Label htmlFor="cep_destino">CEP de Destino *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="cep_destino"
              placeholder="Ex: 02000-000"
              className="pl-10"
              value={cepDestinoInput}
              onChange={(e) => setCepDestinoInput(e.target.value)}
              onBlur={() => fetchAddressByCep(cepDestinoInput, false)}
              required
              disabled={isPending || isFetchingDestinationAddress}
            />
            {isFetchingDestinationAddress && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-accent" />}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endereco_destino">Endereço de Destino *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="endereco_destino"
              placeholder="Endereço completo para entrega"
              className="pl-10"
              value={enderecoDestinoInput}
              onChange={(e) => {
                setEnderecoDestinoInput(e.target.value);
                handleInputChange("endereco_destino", e.target.value);
              }}
              required
              disabled={isPending || isFetchingDestinationAddress}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="previsao_coleta">Data da Entrega *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal pl-10",
                  !formData.previsao_coleta && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {formData.previsao_coleta ? format(new Date(formData.previsao_coleta), "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.previsao_coleta ? new Date(formData.previsao_coleta) : undefined}
                onSelect={(date) => handleInputChange("previsao_coleta", date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos *</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="qtd_aparelhos_solicitado"
              type="number"
              placeholder="1"
              className="pl-10"
              value={formData.qtd_aparelhos_solicitado || 0}
              onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || 0)}
              required
              min={1}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelo_aparelho">Tipo de Material *</Label>
        <ProductCombobox
          value={formData.modelo_aparelho || ''}
          onValueChange={(code) => handleInputChange("modelo_aparelho", code)}
          onProductSelect={handleProductComboboxSelect}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driver">Motorista</Label>
          <DriverCombobox
            value={formData.driver_id}
            onValueChange={(id) => handleInputChange("driver_id", id)}
            onDriverSelect={handleDriverSelect}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transportadora">Transportadora</Label>
          <TransportadoraCombobox
            value={formData.transportadora_id}
            onValueChange={(id) => handleInputChange("transportadora_id", id)}
            onTransportadoraSelect={handleTransportadoraSelect}
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

      <div className="space-y-2">
        <Label htmlFor="responsible_user">Responsável pela Entrega</Label>
        <ResponsibleUserCombobox
          value={formData.responsible_user_id || null}
          onValueChange={(id) => handleInputChange("responsible_user_id", id)}
          onUserSelect={handleResponsibleUserSelect}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observações</Label>
        <Textarea
          id="observacao"
          placeholder="Informações adicionais sobre a entrega..."
          value={formData.observacao || ''}
          onChange={(e) => handleInputChange("observacao", e.target.value)}
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          disabled={isPending || isFetchingOriginAddress || isFetchingDestinationAddress}
        >
          {isPending || isFetchingOriginAddress || isFetchingDestinationAddress ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Truck className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Agendar Entrega"}
        </Button>
      </div>
    </form>
  );
};