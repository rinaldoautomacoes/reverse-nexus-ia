import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber } from "@/lib/utils";
import { format } from "date-fns";

// Import modular components
import { ColetaClientDetails } from "./coleta-form-sections/ColetaClientDetails";
import { ColetaOriginAddress } from "./coleta-form-sections/ColetaOriginAddress";
import { ColetaDestinationAddress } from "./coleta-form-sections/ColetaDestinationAddress";
import { ColetaItemDetails } from "./coleta-form-sections/ColetaItemDetails";
import { ColetaLogisticsDetails } from "./coleta-form-sections/ColetaLogisticsDetails";
import { ColetaResponsibleUser } from "./coleta-form-sections/ColetaResponsibleUser";
import { ColetaObservation } from "./coleta-form-sections/ColetaObservation";

// Import types
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";

type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;

interface ColetaFormProps {
  initialData?: ColetaUpdate;
  onSave: (data: ColetaInsert | ColetaUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ColetaForm: React.FC<ColetaFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ColetaInsert | ColetaUpdate>(initialData || {
    parceiro: "",
    endereco: "", // This will be mapped to endereco_origem for display purposes
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
    qtd_aparelhos_solicitado: 1,
    modelo_aparelho: "",
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
    contrato: "",
    nf_glbl: "",
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
  });

  // State for fetching status from address lookup hooks
  const [isFetchingOriginAddress, setIsFetchingOriginAddress] = useState(false);
  const [isFetchingDestinationAddress, setIsFetchingDestinationAddress] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        parceiro: "",
        endereco: "",
        previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
        qtd_aparelhos_solicitado: 1,
        modelo_aparelho: "",
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
        contrato: "",
        nf_glbl: "",
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
      });
    }
  }, [initialData, user?.id]);

  const handleInputChange = useCallback((field: keyof (ColetaInsert | ColetaUpdate), value: string | number | null) => {
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
      // If client has an address, pre-fill origin address and CEP
      if (client.address) {
        handleInputChange("endereco_origem", client.address);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      // Ensure the main 'endereco' and 'cep' fields are consistent with origin for coletas
      endereco: formData.endereco_origem,
      cep: formData.cep_origem,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="unique_number">Número Único da Coleta</Label>
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

      <ColetaClientDetails
        formData={formData}
        handleInputChange={handleInputChange}
        handleClientComboboxSelect={handleClientComboboxSelect}
        isPending={isPending}
      />

      <ColetaOriginAddress
        formData={formData}
        handleInputChange={(field, value) => {
          handleInputChange(field, value);
          if (field === "origin_lat" || field === "origin_lng") {
            setIsFetchingOriginAddress(false); // Reset fetching state when lat/lng are updated
          } else if (field === "cep_origem" && value === "") {
            setIsFetchingOriginAddress(true); // Set fetching state when CEP is cleared
          }
        }}
        isPending={isPending}
      />

      <ColetaDestinationAddress
        formData={formData}
        handleInputChange={(field, value) => {
          handleInputChange(field, value);
          if (field === "destination_lat" || field === "destination_lng") {
            setIsFetchingDestinationAddress(false); // Reset fetching state when lat/lng are updated
          } else if (field === "cep_destino" && value === "") {
            setIsFetchingDestinationAddress(true); // Set fetching state when CEP is cleared
          }
        }}
        isPending={isPending}
      />

      <ColetaItemDetails
        formData={formData}
        handleInputChange={handleInputChange}
        handleProductComboboxSelect={handleProductComboboxSelect}
        isPending={isPending}
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