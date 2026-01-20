import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, Calendar as CalendarIcon, User, Phone, Mail, MapPin, Building, Briefcase, Loader2, Hash, Package, DollarSign, Tag, Home, Flag, ClipboardList, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";
import { format, isValid } from "date-fns"; // Importar isValid
import { ptBR } from "date-fns/locale";
import { ClientCombobox } from "@/components/ClientCombobox";
import { ProductCombobox } from "@/components/ProductCombobox"; // Mantido para compatibilidade, mas não usado diretamente para o modelo_aparelho principal
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { DriverCombobox } from "@/components/DriverCombobox";
import { TransportadoraCombobox } from "@/components/TransportadoraCombobox";
import axios from "axios";
import { ColetaItemsSection } from "./coleta-form-sections/ColetaItemsSection"; // Importa a seção de itens
import { ItemData } from "./coleta-form-sections/ColetaItemRow"; // Importa a interface ItemData

// Import modular components
import { ColetaClientDetails } from "./coleta-form-sections/ColetaClientDetails";
import { ColetaOriginAddress } from "./coleta-form-sections/ColetaOriginAddress";
import { ColetaDestinationAddress } from "./coleta-form-sections/ColetaDestinationAddress";
import { ColetaLogisticsDetails } from "./coleta-form-sections/ColetaLogisticsDetails";
import { ColetaResponsibleUser } from "./coleta-form-sections/ColetaResponsibleUser";
import { ColetaObservation } from "./coleta-form-sections/ColetaObservation";
import { FileUploadField } from "@/components/FileUploadField"; // Adicionado: Importação do componente FileUploadField


type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;
type ItemInsert = TablesInsert<'items'>;
type ItemUpdate = TablesUpdate<'items'>;

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface EntregaFormProps {
  initialData?: ColetaUpdate & { items?: ItemData[] }; // Adicionado items ao initialData
  onSave: (data: ColetaInsert | ColetaUpdate, items: ItemData[], attachments: FileAttachment[]) => void; // onSave agora recebe os itens e anexos
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
    modelo_aparelho: null, // Será preenchido do resumo dos itens
    qtd_aparelhos_solicitado: null, // Será preenchido da quantidade total dos itens
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
    contrato: null, // Novo campo
    nf_glbl: null, // Novo campo
    partner_code: null, // Novo campo
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
    attachments: [], // Novo campo para anexos
    created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"), // Initialize created_at for new forms
    origin_address_number: "", // Novo campo
    destination_address_number: "", // Novo campo
  });

  const [deliveryItems, setDeliveryItems] = useState<ItemData[]>(initialData?.items || []);
  
  const [attachments, setAttachments] = useState<FileAttachment[]>(() => {
    const initial = initialData?.attachments;
    if (Array.isArray(initial)) {
      return initial.filter((file): file is FileAttachment => 
        file !== null && typeof file === 'object' && 
        typeof (file as FileAttachment).size === 'number' && 
        typeof (file as FileAttachment).name === 'string' && 
        typeof (file as FileAttachment).url === 'string' && 
        typeof (file as FileAttachment).type === 'string'
      );
    }
    return [];
  });

  const [isFetchingOriginAddress, setIsFetchingOriginAddress] = useState(false);
  const [isFetchingDestinationAddress, setIsFetchingDestinationAddress] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { items, attachments: initialAttachments, ...restOfEntregaData } = initialData;
      setFormData(restOfEntregaData);
      setDeliveryItems(items || []);
      if (Array.isArray(initialAttachments)) {
        setAttachments(initialAttachments.filter((file): file is FileAttachment => 
          file !== null && typeof file === 'object' && 
          typeof (file as FileAttachment).size === 'number' && 
          typeof (file as FileAttachment).name === 'string' && 
          typeof (file as FileAttachment).url === 'string' && 
          typeof (file as FileAttachment).type === 'string'
        ));
      } else {
        setAttachments([]);
      }
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
        contrato: null, // Novo campo
        nf_glbl: null, // Novo campo
        partner_code: null, // Novo campo
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
        client_control: null, // Alterado para null
        attachments: [], // Initialize attachments for new forms
        created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"), // Ensure created_at is set for new forms
        origin_address_number: "", // Novo campo
        destination_address_number: "", // Novo campo
      });
      setDeliveryItems([]);
      setAttachments([]);
    }
  }, [initialData, user?.id]);

  const handleInputChange = useCallback((field: keyof (ColetaInsert | ColetaUpdate), value: string | number | null | FileAttachment[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

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
      endereco: formData.endereco_destino,
      cep: formData.cep_destino,
      user_id: user.id,
      modelo_aparelho: formatItemsForColetaModeloAparelho(deliveryItems), // Resumo dos itens
      qtd_aparelhos_solicitado: getTotalQuantityOfItems(deliveryItems), // Quantidade total
    };

    console.log("EntregaForm: Submitting dataToSave:", dataToSave);
    console.log("EntregaForm: Submitting deliveryItems:", deliveryItems);
    console.log("EntregaForm: Submitting attachments:", attachments);

    onSave(dataToSave, deliveryItems, attachments);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unique_number">Código da Entrega</Label>
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

      {/* Novos campos adicionados aqui */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contrato">Nr. Contrato</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="contrato"
              placeholder="Ex: VMC10703/22"
              className="pl-10"
              value={formData.contrato || ''}
              onChange={(e) => handleInputChange("contrato", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nf_glbl">CONTRATO SANKHYA</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="nf_glbl"
              placeholder="Ex: 26192"
              className="pl-10"
              value={formData.nf_glbl || ''}
              onChange={(e) => handleInputChange("nf_glbl", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner_code">CÓD. PARC</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="partner_code"
              placeholder="Ex: 53039"
              className="pl-10"
              value={formData.partner_code || ''}
              onChange={(e) => handleInputChange("partner_code", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <ColetaClientDetails
        formData={formData}
        handleInputChange={handleInputChange}
        handleClientComboboxSelect={handleClientComboboxSelect}
        isPending={isPending}
      />

      <ColetaOriginAddress
        formData={formData}
        handleInputChange={handleInputChange} // Passa o handleInputChange diretamente
        isFormDisabled={isPending}
        setIsGeocoding={setIsFetchingOriginAddress} // Passa o setter de estado diretamente
      />

      <ColetaDestinationAddress
        formData={formData}
        handleInputChange={handleInputChange} // Passa o handleInputChange diretamente
        isFormDisabled={isPending}
        setIsGeocoding={setIsFetchingDestinationAddress} // Passa o setter de estado diretamente
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_solicitacao">Data da Solicitação</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal pl-10",
                  !formData.created_at && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {formData.created_at ? (isValid(new Date(formData.created_at)) ? format(new Date(formData.created_at), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.created_at ? new Date(formData.created_at) : undefined}
                onSelect={(date) => handleInputChange("created_at", date ? format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX") : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="previsao_coleta">Previsão de Entrega *</Label>
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
                {formData.previsao_coleta ? (isValid(new Date(formData.previsao_coleta)) ? format(new Date(formData.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Selecionar data"}
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
      </div>

      <ColetaItemsSection
        onItemsUpdate={setDeliveryItems}
        isPending={isPending}
        initialItems={deliveryItems}
      />

      <ColetaLogisticsDetails
        formData={formData}
        handleInputChange={handleInputChange}
        handleDriverSelect={handleDriverSelect}
        handleTransportadoraSelect={handleTransportadoraSelect}
        isPending={isPending}
      />

      <ColetaResponsibleUser
        formData={formData}
        handleInputChange={handleInputChange}
        handleResponsibleUserSelect={handleResponsibleUserSelect}
        isPending={isPending}
      />

      <ColetaObservation
        formData={formData}
        handleInputChange={handleInputChange}
        isPending={isPending}
      />

      <FileUploadField
        label="Anexos da Entrega"
        initialFiles={attachments}
        onFilesChange={setAttachments}
        disabled={isPending}
      />

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