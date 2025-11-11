import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Adicionado: Importação do componente Button
import { Loader2, Package, Tag, ClipboardList, Calendar as CalendarIcon, FileText, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems, cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";

// Import modular components
import { ColetaClientDetails } from "@/components/shared-scheduler-sections/ColetaClientDetails";
import { OriginAddressSection } from "@/components/shared-scheduler-sections/OriginAddressSection";
import { DestinationAddressSection } from "@/components/shared-scheduler-sections/DestinationAddressSection";
import { ItemsTableSection } from "@/components/shared-scheduler-sections/ItemsTableSection";
import { ColetaLogisticsDetails } from "@/components/coleta-form-sections/ColetaLogisticsDetails";
import { ColetaResponsibleUser } from "@/components/coleta-form-sections/ColetaResponsibleUser";
import { ColetaObservation } from "@/components/coleta-form-sections/ColetaObservation";
import { FileUploadField } from "@/components/FileUploadField";

// Import types
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import type { ParsedCollectionData, ParsedItem } from '@/lib/types';

type ColetaInsert = TablesInsert<'coletas'>;
type Client = Tables<'clients'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface AutomaticCollectionFormProps {
  formData: ParsedCollectionData;
  setFormData: React.Dispatch<React.SetStateAction<ParsedCollectionData>>;
  isFormDisabled: boolean;
  setIsGeocoding: (value: boolean) => void;
  attachments: FileAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
}

export const AutomaticCollectionForm: React.FC<AutomaticCollectionFormProps> = ({
  formData,
  setFormData,
  isFormDisabled,
  setIsGeocoding,
  attachments,
  setAttachments,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleParsedDataChange = useCallback((field: keyof ParsedCollectionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const handleItemChange = useCallback((index: number, field: keyof ParsedItem, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      if (newItems[index]) {
        (newItems[index] as any)[field] = value;
      }
      return { ...prev, items: newItems };
    });
  }, [setFormData]);

  const handleAddItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { product_code: '', product_description: '', quantity: 1 }],
    }));
  }, [setFormData]);

  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  }, [setFormData]);

  // Handler para quando um cliente é selecionado no ClientCombobox dentro de ColetaClientDetails
  const handleClientSelectedInDetails = useCallback((client: Client | null) => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        parceiro: client.name,
        telefone: client.phone || '',
        email: client.email || '',
        cnpj: client.cnpj || '',
        contato: client.contact_person || '',
        client_id: client.id,
        endereco_origem: client.address || prev.endereco_origem, // Atualiza endereço de origem se disponível
        cep_origem: client.cep || prev.cep_origem, // Atualiza CEP de origem se disponível
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        client_id: null,
        parceiro: '', // Limpa o nome do parceiro se nenhum cliente for selecionado
        telefone: '',
        email: '',
        cnpj: '',
        contato: '',
        // Não limpa endereco_origem/cep_origem automaticamente aqui,
        // pois podem ter sido preenchidos pelo parser de documento.
      }));
    }
  }, [setFormData]);

  const handleResponsibleUserSelect = useCallback((userProfile: Profile | null) => {
    handleParsedDataChange("responsible_user_id", userProfile?.id || null);
    handleParsedDataChange("responsavel", userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : null);
  }, [handleParsedDataChange]);

  const handleDriverSelect = useCallback((driver: Driver | null) => {
    handleParsedDataChange("driver_id", driver?.id || null);
  }, [handleParsedDataChange]);

  const handleTransportadoraSelect = useCallback((transportadora: Transportadora | null) => {
    handleParsedDataChange("transportadora_id", transportadora?.id || null);
  }, [handleParsedDataChange]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unique_number">Código da Coleta</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="unique_number"
              value={formData.unique_number || ''}
              readOnly
              className="pl-10 bg-muted/50"
              disabled={isFormDisabled}
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
              onChange={(e) => handleParsedDataChange("client_control", e.target.value)}
              disabled={isFormDisabled}
            />
          </div>
        </div>
      </div>

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
              onChange={(e) => handleParsedDataChange("contrato", e.target.value)}
              disabled={isFormDisabled}
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
              onChange={(e) => handleParsedDataChange("nf_glbl", e.target.value)}
              disabled={isFormDisabled}
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
              onChange={(e) => handleParsedDataChange("partner_code", e.target.value)}
              disabled={isFormDisabled}
            />
          </div>
        </div>
      </div>

      <ColetaClientDetails
        parsedData={formData}
        handleParsedDataChange={handleParsedDataChange} // Passa o handler genérico
        onClientSelected={handleClientSelectedInDetails} // Passa o handler específico para seleção de cliente
        isFormDisabled={isFormDisabled}
      />

      <OriginAddressSection
        formData={formData}
        handleInputChange={handleParsedDataChange}
        isFormDisabled={isFormDisabled}
        setIsGeocoding={setIsGeocoding}
        title="Origem da Coleta"
        cepLabel="CEP de Origem"
        addressLabel="Endereço de Origem"
      />

      <DestinationAddressSection
        formData={formData}
        handleInputChange={handleParsedDataChange}
        isFormDisabled={isFormDisabled}
        setIsGeocoding={setIsGeocoding}
        title="Destino da Coleta"
        cepLabel="CEP de Destino"
        addressLabel="Endereço de Destino"
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
                disabled={isFormDisabled}
              >
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {formData.created_at ? (isValid(new Date(formData.created_at)) ? format(new Date(formData.created_at), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.created_at ? new Date(formData.created_at) : undefined}
                onSelect={(date) => handleParsedDataChange("created_at", date ? format(date, 'yyyy-MM-ddTHH:mm:ss.SSSZ') : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="previsao_coleta">Previsão de Coleta *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal pl-10",
                  !formData.previsao_coleta && "text-muted-foreground"
                )}
                disabled={isFormDisabled}
              >
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {formData.previsao_coleta ? (isValid(new Date(formData.previsao_coleta)) ? format(new Date(formData.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.previsao_coleta ? new Date(formData.previsao_coleta) : undefined}
                onSelect={(date) => handleParsedDataChange("previsao_coleta", date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ItemsTableSection
        parsedData={formData}
        handleItemChange={handleItemChange}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        isFormDisabled={isFormDisabled}
      />

      <ColetaLogisticsDetails
        formData={formData}
        handleInputChange={handleParsedDataChange}
        handleDriverSelect={handleDriverSelect}
        handleTransportadoraSelect={handleTransportadoraSelect}
        isPending={isFormDisabled}
      />

      <ColetaResponsibleUser
        formData={formData}
        handleInputChange={handleParsedDataChange}
        handleResponsibleUserSelect={handleResponsibleUserSelect}
        isPending={isFormDisabled}
      />

      <ColetaObservation
        formData={formData}
        handleInputChange={handleParsedDataChange}
        isPending={isFormDisabled}
      />

      <FileUploadField
        label="Anexos da Coleta"
        initialFiles={attachments}
        onFilesChange={setAttachments}
        disabled={isFormDisabled}
      />
    </div>
  );
};