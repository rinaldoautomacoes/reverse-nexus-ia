// @ts-nocheck
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

// Import modular components
import { CollectionDetailsSection } from "@/components/collection-form-sections/CollectionDetailsSection";
import { ClientDetailsSection } from "@/components/shared-form-sections/ClientDetailsSection";
import { OriginAddressSection } from "@/components/shared-form-sections/OriginAddressSection";
import { DestinationAddressSection } from "@/components/shared-form-sections/DestinationAddressSection";
import { ItemsSection } from "@/components/shared-form-sections/ItemsSection";
import { ItemData } from "@/components/shared-form-sections/ItemRow";
import { LogisticsDetailsSection } from "@/components/shared-form-sections/LogisticsDetailsSection";
import { ResponsibleUserSection } from "@/components/shared-form-sections/ResponsibleUserSection";
import { ObservationSection } from "@/components/shared-form-sections/ObservationSection";
import { FormActionButtons } from "@/components/shared-form-sections/FormActionButtons";
import { FileUploadField } from "@/components/FileUploadField";
import { DateSelectionSection } from "@/components/shared-form-sections/DateSelectionSection";

type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;
type ItemInsert = TablesInsert<'items'>;

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export const AgendarColetaPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ColetaInsert>({
    parceiro: "",
    endereco: "",
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

  const [collectionItems, setCollectionItems] = useState<ItemData[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
    }
  }, [user?.id]);

  const handleInputChange = useCallback((field: keyof ColetaInsert, value: string | number | null | FileAttachment[]) => {
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

  const addColetaMutation = useMutation({
    mutationFn: async (data: { coleta: ColetaInsert; items: ItemData[]; attachments: FileAttachment[] }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar coletas.");
      }
      
      const coletaToInsert: ColetaInsert = {
        ...data.coleta,
        user_id: user.id,
        type: 'coleta',
        modelo_aparelho: formatItemsForColetaModeloAparelho(data.items),
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(data.items),
        attachments: data.attachments,
      };

      const { data: insertedColeta, error: coletaError } = await supabase
        .from('coletas')
        .insert(coletaToInsert)
        .select()
        .single();
      
      if (coletaError) throw new Error(coletaError.message);

      for (const item of data.items) {
        if (item.modelo_aparelho && item.qtd_aparelhos_solicitado && item.qtd_aparelhos_solicitado > 0) {
          const newItem: TablesInsert<'items'> = {
            user_id: user.id,
            collection_id: insertedColeta.id,
            name: item.modelo_aparelho,
            description: item.descricaoMaterial,
            quantity: item.qtd_aparelhos_solicitado,
            status: insertedColeta.status_coleta || 'pendente',
          };
          const { error: itemError } = await supabase.from('items').insert(newItem);
          if (itemError) {
            console.error("Erro ao inserir item na tabela 'items':", itemError.message);
          }
        }
      }

      return insertedColeta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Coleta Agendada!", description: "Nova coleta criada com sucesso." });
      navigate('/coletas-ativas');
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar coleta", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: ColetaInsert, items: ItemData[], attachments: FileAttachment[]) => {
    if (!data.parceiro || data.parceiro.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Cliente' é obrigatório.", variant: "destructive" });
      return;
    }
    if (!data.endereco_origem || data.endereco_origem.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Endereço de Origem' é obrigatório.", variant: "destructive" });
      return;
    }
    if (!data.previsao_coleta || data.previsao_coleta.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Data da Coleta' é obrigatório.", variant: "destructive" });
      return;
    }
    
    if (items.length === 0) {
      toast({ title: "Campo Obrigatório", description: "Adicione pelo menos um item de material.", variant: "destructive" });
      return;
    }

    for (const item of items) {
      if (!item.modelo_aparelho || item.modelo_aparelho.trim() === '') {
        toast({ title: "Campo Obrigatório", description: `O 'Código do Material' do item #${items.indexOf(item) + 1} é obrigatório.`, variant: "destructive" });
        return;
      }
      if (item.qtd_aparelhos_solicitado === null || item.qtd_aparelhos_solicitado <= 0) {
        toast({ title: "Campo Obrigatório", description: `A 'Quantidade' do item #${items.indexOf(item) + 1} deve ser maior que zero.`, variant: "destructive" });
        return;
      }
    }

    addColetaMutation.mutate({
      coleta: {
        ...data,
        endereco: data.endereco_origem,
        cep: data.cep_origem,
      },
      items: items,
      attachments: attachments,
    });
  };

  const isFormDisabled = addColetaMutation.isPending || isGeocoding;

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Agendar Nova Coleta
            </h1>
            <p className="text-muted-foreground">
              Preencha os detalhes para agendar uma nova coleta de materiais.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Detalhes da Coleta
              </CardTitle>
            </CardHeader>
            <div className="p-6 space-y-6">
              <CollectionDetailsSection
                formData={formData}
                handleInputChange={handleInputChange}
                isPending={isFormDisabled}
              />

              <ClientDetailsSection
                formData={formData}
                handleInputChange={handleInputChange}
                handleClientComboboxSelect={handleClientComboboxSelect}
                isPending={isFormDisabled}
              />

              <OriginAddressSection
                formData={formData}
                handleInputChange={handleInputChange}
                isFormDisabled={isFormDisabled}
                setIsGeocoding={setIsGeocoding}
                title="Origem da Coleta"
                cepLabel="CEP de Origem"
                addressLabel="Endereço de Origem"
              />

              <DestinationAddressSection
                formData={formData}
                handleInputChange={handleInputChange}
                isFormDisabled={isFormDisabled}
                setIsGeocoding={setIsGeocoding}
                title="Destino da Coleta"
                cepLabel="CEP de Destino"
                addressLabel="Endereço de Destino"
              />

              <DateSelectionSection
                formData={formData}
                handleInputChange={handleInputChange}
                isPending={isFormDisabled}
                type="coleta"
              />

              <ItemsSection
                onItemsUpdate={setCollectionItems}
                isPending={isFormDisabled}
                initialItems={collectionItems}
              />

              <LogisticsDetailsSection
                formData={formData}
                handleInputChange={handleInputChange}
                handleDriverSelect={handleDriverSelect}
                handleTransportadoraSelect={handleTransportadoraSelect}
                isPending={isFormDisabled}
              />

              <ResponsibleUserSection
                formData={formData}
                handleInputChange={handleInputChange}
                handleResponsibleUserSelect={handleResponsibleUserSelect}
                isPending={isFormDisabled}
              />

              <ObservationSection
                formData={formData}
                handleInputChange={handleInputChange}
                isPending={isFormDisabled}
              />

              <FileUploadField
                label="Anexos da Coleta"
                initialFiles={attachments}
                onFilesChange={setAttachments}
                disabled={isFormDisabled}
              />

              <FormActionButtons
                onCancel={() => navigate('/coletas-dashboard')}
                onSave={() => handleSave(formData, collectionItems, attachments)}
                isPending={isFormDisabled}
                backButtonPath="/coletas-dashboard"
                backButtonText="Voltar ao Dashboard de Coletas"
                saveButtonText="Agendar Coleta"
                navigate={navigate}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};