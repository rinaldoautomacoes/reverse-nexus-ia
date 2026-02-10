import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

// Import modular components
import { CollectionDetailsSection } from "./collection-form-sections/CollectionDetailsSection";
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

interface ColetaFormProps {
  initialData?: ColetaUpdate & { items?: ItemData[] };
  onSave: (data: ColetaInsert | ColetaUpdate, items: ItemData[], attachments: FileAttachment[]) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ColetaForm: React.FC<ColetaFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ColetaInsert | ColetaUpdate>(initialData || {
    parceiro: "",
    endereco: "", // This will be mapped to endereco_origem for display purposes
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
    type: "coleta",
    user_id: user?.id || "",
    cep: "", // This will be mapped to cep_origem for display purposes
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
    cep_destino: "",
    endereco_origem: "",
    endereco_destino: "",
    driver_id: null,
    transportadora_id: null,
    freight_value: null,
    unique_number: generateUniqueNumber('COL'),
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

  const [collectionItems, setCollectionItems] = useState<ItemData[]>(initialData?.items || []);
  
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
      const { items, attachments: initialAttachments, ...restOfColetaData } = initialData;
      setFormData(restOfColetaData);
      setCollectionItems(items || []);
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
        type: "coleta",
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
        cep_destino: "",
        endereco_origem: "",
        endereco_destino: "",
        driver_id: null,
        transportadora_id: null,
        freight_value: null,
        unique_number: generateUniqueNumber('COL'),
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
      setCollectionItems([]);
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
        handleInputChange("endereco_origem", client.address);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.parceiro || formData.parceiro.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Cliente' é obrigatório.", variant: "destructive" });
      return;
    }
    if (!formData.endereco_origem || formData.endereco_origem.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Endereço de Origem' é obrigatório.", variant: "destructive" });
      return;
    }
    if (!formData.previsao_coleta || formData.previsao_coleta.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Data da Coleta' é obrigatório.", variant: "destructive" });
      return;
    }
    
    if (collectionItems.length === 0) {
      toast({ title: "Campo Obrigatório", description: "Adicione pelo menos um item de material.", variant: "destructive" });
      return;
    }

    for (const item of collectionItems) {
      if (!item.modelo_aparelho || item.modelo_aparelho.trim() === '') {
        toast({ title: "Campo Obrigatório", description: `O 'Código do Material' do item #${collectionItems.indexOf(item) + 1} é obrigatório.`, variant: "destructive" });
        return;
      }
      if (item.qtd_aparelhos_solicitado === null || item.qtd_aparelhos_solicitado <= 0) {
        toast({ title: "Campo Obrigatório", description: `A 'Quantidade' do item #${collectionItems.indexOf(item) + 1} deve ser maior que zero.`, variant: "destructive" });
        return;
      }
    }

    console.log("ColetaForm: Submitting formData:", formData);
    console.log("ColetaForm: Submitting collectionItems:", collectionItems);
    console.log("ColetaForm: Submitting attachments:", attachments);

    onSave({
      ...formData,
      endereco: formData.endereco_origem,
      cep: formData.cep_origem,
      modelo_aparelho: formatItemsForColetaModeloAparelho(collectionItems), // Resumo dos itens
      qtd_aparelhos_solicitado: getTotalQuantityOfItems(collectionItems as unknown as Array<{ quantity: number }>), // Quantidade total
    }, collectionItems, attachments);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CollectionDetailsSection
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
        title="Origem da Coleta"
        cepLabel="CEP de Origem"
        addressLabel="Endereço de Origem"
      />

      <DestinationAddressSection
        formData={formData}
        handleInputChange={handleInputChange}
        isFormDisabled={isPending}
        setIsGeocoding={setIsFetchingDestinationAddress}
        title="Destino da Coleta"
        cepLabel="CEP de Destino"
        addressLabel="Endereço de Destino"
      />

      <DateSelectionSection
        formData={formData}
        handleInputChange={handleInputChange}
        isPending={isPending}
        type="coleta"
      />

      <ItemsSection
        onItemsUpdate={setCollectionItems}
        isPending={isPending}
        initialItems={collectionItems}
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
        label="Anexos da Coleta"
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
            <Package className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Agendar Coleta"}
        </Button>
      </div>
    </form>
  );
};