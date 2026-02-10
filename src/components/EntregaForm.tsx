import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

// Import modular components
import { DeliveryDetailsSection } from "./delivery-form-sections/DeliveryDetailsSection";
import { ClientDetailsSection } from "@/components/shared-form-sections/ClientDetailsSection";
import { OriginAddressSection } from "@/components/shared-form-sections/OriginAddressSection";
import { DestinationAddressSection } from "@/components/shared-form-sections/DestinationAddressSection";
import { ItemsSection } from "@/components/shared-form-sections/ItemsSection";
import { ItemData } from "@/components/shared-form-sections/ItemRow";
import { LogisticsDetailsSection } from "@/components/shared-form-sections/LogisticsDetailsSection";
import { ResponsibleUserSection } from "@/components/shared-form-sections/ResponsibleUserSection";
import { ObservationSection } from "@/components/shared-form-sections/ObservationSection";
import { FileUploadField } from "@/components/FileUploadField";
import { DateSelectionSection } from "@/components/shared-form-sections/DateSelectionSection";

// Import types
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";

type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface EntregaFormProps {
  initialData?: ColetaUpdate & { items?: ItemData[] };
  onSave: (data: ColetaInsert | ColetaUpdate, items: ItemData[], attachments: FileAttachment[]) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const EntregaForm: React.FC<EntregaFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ColetaInsert | ColetaUpdate>(initialData || {
    parceiro: "",
    endereco: "", // Mapeado para endereco_destino para entregas
    previsao_coleta: null,
    modelo_aparelho: null,
    qtd_aparelhos_solicitado: null,
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
    contrato: null,
    nf_glbl: null,
    partner_code: null,
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
    client_control: null,
    attachments: [],
    created_at: new Date().toISOString(),
    origin_address_number: "",
    destination_address_number: "",
  });

  const [deliveryItems, setDeliveryItems] = useState<ItemData[]>(initialData?.items || []);
  
  const [attachments, setAttachments] = useState<FileAttachment[]>(() => {
    const initial = initialData?.attachments;
    if (Array.isArray(initial)) {
      return (initial as unknown as FileAttachment[]).filter((file) => 
        file !== null && typeof file === 'object' && 
        typeof file.size === 'number' && 
        typeof file.name === 'string' && 
        typeof file.url === 'string' && 
        typeof file.type === 'string'
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
        setAttachments((initialAttachments as unknown as FileAttachment[]).filter((file) => 
          file !== null && typeof file === 'object' && 
          typeof file.size === 'number' && 
          typeof file.name === 'string' && 
          typeof file.url === 'string' && 
          typeof file.type === 'string'
        ));
      } else {
        setAttachments([]);
      }
    } else {
      setFormData({
        parceiro: "",
        endereco: "",
        previsao_coleta: null,
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
        contrato: null,
        nf_glbl: null,
        partner_code: null,
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
        client_control: null,
        attachments: [],
        created_at: new Date().toISOString(),
        origin_address_number: "",
        destination_address_number: "",
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
      qtd_aparelhos_solicitado: getTotalQuantityOfItems(deliveryItems as unknown as Array<{ quantity: number }>), // Quantidade total
    };

    console.log("EntregaForm: Submitting dataToSave:", dataToSave);
    console.log("EntregaForm: Submitting deliveryItems:", deliveryItems);
    console.log("EntregaForm: Submitting attachments:", attachments);

    onSave(dataToSave, deliveryItems, attachments);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DeliveryDetailsSection
        formData={formData}
        handleInputChange={handleInputChange}
        isPending={isPending}
      />

      <ClientDetailsSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleClientComboboxSelect={handleClientComboboxSelect}
        isPending={isPending}
      />

      <OriginAddressSection
        formData={formData}
        handleInputChange={handleInputChange}
        isFormDisabled={isPending}
        setIsGeocoding={setIsFetchingOriginAddress}
        title="Origem da Entrega"
        cepLabel="CEP de Origem"
        addressLabel="Endereço de Origem"
      />

      <DestinationAddressSection
        formData={formData}
        handleInputChange={handleInputChange}
        isFormDisabled={isPending}
        setIsGeocoding={setIsFetchingDestinationAddress}
        title="Destino da Entrega"
        cepLabel="CEP de Destino"
        addressLabel="Endereço de Destino"
      />

      <DateSelectionSection
        formData={formData}
        handleInputChange={handleInputChange}
        isPending={isPending}
        type="entrega"
      />

      <ItemsSection
        onItemsUpdate={setDeliveryItems}
        isPending={isPending}
        initialItems={deliveryItems}
      />

      <LogisticsDetailsSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleDriverSelect={handleDriverSelect}
        handleTransportadoraSelect={handleTransportadoraSelect}
        isPending={isPending}
      />

      <ResponsibleUserSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleResponsibleUserSelect={handleResponsibleUserSelect}
        isPending={isPending}
      />

      <ObservationSection
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