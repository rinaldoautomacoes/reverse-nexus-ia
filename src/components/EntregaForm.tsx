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
import { cn, generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientCombobox } from "@/components/ClientCombobox";
import { ProductCombobox } from "@/components/ProductCombobox"; // Mantido para compatibilidade, mas não usado diretamente para o modelo_aparelho principal
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { DriverCombobox } from "@/components/DriverCombobox";
import { TransportadoraCombobox } from "@/components/TransportadoraCombobox";
import axios from "axios";
import { ColetaItemsSection } from "./coleta-form-sections/ColetaItemsSection"; // Importa a seção de itens
import { ItemData } from "./coleta-form-sections/ColetaItemRow"; // Importa a interface ItemData

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
  initialData?: ColetaUpdate & { items?: ItemData[] }; // Adicionado items ao initialData
  onSave: (data: ColetaInsert | ColetaUpdate, items: ItemData[]) => void; // onSave agora recebe os itens
  onCancel: () => void;
  isPending: boolean;
}

export const EntregaForm: React.FC<EntregaFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ColetaInsert | ColetaUpdate>(initialData || {
    parceiro: "",
    endereco: "", // Mapeado para endereco_destino para entregas
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
    qtd_aparelhos_solicitado: null, // Removido valor padrão, será derivado dos itens
    modelo_aparelho: null, // Removido valor padrão, será derivado dos itens
    status_coleta: "pendente",
    observacao: "",
    telefone: "",
    email: "",
    contato: "",
    responsavel: "",
    responsible_user_id: null,
    client_id: null,
    type: "entrega",
    user_id: user?.id || "",
    cep: "", // Mapeado para cep_destino para entregas
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

  const [deliveryItems, setDeliveryItems] = useState<ItemData[]>(initialData?.items || []);

  const [cepOrigemInput, setCepOrigemInput] = useState(initialData?.cep_origem || '');
  const [enderecoOrigemInput, setEnderecoOrigemInput] = useState(initialData?.endereco_origem || '');
  const [cepDestinoInput, setCepDestinoInput] = useState(initialData?.cep_destino || '');
  const [enderecoDestinoInput, setEnderecoDestinoInput] = useState(initialData?.endereco_destino || '');

  const [isFetchingOriginAddress, setIsFetchingOriginAddress] = useState(false);
  const [isFetchingDestinationAddress, setIsFetchingDestinationAddress] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { items, ...restOfEntregaData } = initialData;
      setFormData(restOfEntregaData);
      setDeliveryItems(items || []);
      setCepOrigemInput(initialData.cep_origem || '');
      setEnderecoOrigemInput(initialData.endereco_origem || '');
      setCepDestinoInput(initialData.cep_destino || '');
      setEnderecoDestinoInput(initialData.endereco_destino || '');
    } else {
      setFormData({
        parceiro: "",
        endereco: "",
        previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
        qtd_aparelhos_solicitado: null,
        modelo_aparelho: null,
        status_coleta: "pendente",
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
        client_control: "",
      });
      setDeliveryItems([]);
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
      if (client.address) {
        setEnderecoDestinoInput(client.address);
        handleInputChange("endereco_destino", client.address);
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

  // Removido handleProductComboboxSelect pois o modelo_aparelho principal será um resumo

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

    if (!formData.parceiro || formData.parceiro.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Cliente' é obrigatório.", variant: "destructive" });
      return;
    }
    if (!formData.endereco_destino || formData.endereco_destino.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Endereço de Destino' é obrigatório.", variant: "destructive" });
      return;
    }
    if (!formData.previsao_coleta || formData.previsao_coleta.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Data da Entrega' é obrigatório.", variant: "destructive" });
      return;
    }
    
    if (deliveryItems.length === 0) {
      toast({ title: "Campo Obrigatório", description: "Adicione pelo menos um item de material.", variant: "destructive" });
      return;
    }

    for (const item of deliveryItems) {
      if (!item.modelo_aparelho || item.modelo_aparelho.trim() === '') {
        toast({ title: "Campo Obrigatório", description: `O 'Código do Material' do item #${deliveryItems.indexOf(item) + 1} é obrigatório.`, variant: "destructive" });
        return;
      }
      if (item.qtd_aparelhos_solicitado === null || item.qtd_aparelhos_solicitado <= 0) {
        toast({ title: "Campo Obrigatório", description: `A 'Quantidade' do item #${deliveryItems.indexOf(item) + 1} deve ser maior que zero.`, variant: "destructive" });
        return;
      }
    }

    const dataToSave = {
      ...formData,
      cep_origem: cepOrigemInput,
      endereco_origem: enderecoOrigemInput,
      cep_destino: cepDestinoInput,
      endereco_destino: enderecoDestinoInput,
      endereco: enderecoDestinoInput,
      cep: cepDestinoInput,
      user_id: user.id,
      modelo_aparelho: formatItemsForColetaModeloAparelho(deliveryItems), // Resumo dos itens
      qtd_aparelhos_solicitado: getTotalQuantityOfItems(deliveryItems), // Quantidade total
    };

    onSave(dataToSave, deliveryItems);
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
        {/* Removido o campo de quantidade de aparelhos, pois agora é gerenciado pela ColetaItemsSection */}
      </div>

      <ColetaItemsSection
        onItemsUpdate={setDeliveryItems}
        isPending={isPending}
        initialItems={deliveryItems}
      />

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
        <Label htmlFor="status_coleta">Status</Label>
        <Select
          value={formData.status_coleta || 'pendente'}
          onValueChange={(value) => handleInputChange("status_coleta", value)}
          disabled={isPending || !initialData}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="agendada">Em Trânsito</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
          </SelectContent>
        </Select>
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