import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, PlusCircle, Loader2, Tag, ClipboardList, Calendar as CalendarIcon, FileText, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems, cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";


// Import modular components
import { ColetaClientDetails } from "@/components/shared-scheduler-sections/ColetaClientDetails";
import { OriginAddressSection } from "@/components/shared-scheduler-sections/OriginAddressSection";
import { DestinationAddressSection } from "@/components/shared-scheduler-sections/DestinationAddressSection";
import { ColetaItemsSection } from "@/components/coleta-form-sections/ColetaItemsSection"; // Novo componente
import { ItemData } from "@/components/coleta-form-sections/ColetaItemRow"; // Importa a interface ItemData
import { ColetaLogisticsDetails } from "@/components/coleta-form-sections/ColetaLogisticsDetails";
import { ColetaResponsibleUser } from "@/components/coleta-form-sections/ColetaResponsibleUser";
import { ColetaObservation } from "@/components/coleta-form-sections/ColetaObservation";
import { ManualSchedulerActionButtons } from "@/components/manual-scheduler-sections/ManualSchedulerActionButtons";
import { FileUploadField } from "@/components/FileUploadField"; // Import the new component

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
    type: "coleta",
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
    client_control: null, // Alterado para null
    attachments: [], // Novo campo para anexos
  });

  const [collectionItems, setCollectionItems] = useState<ItemData[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]); // Estado para os anexos

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
        modelo_aparelho: formatItemsForColetaModeloAparelho(data.items), // Resumo dos itens
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(data.items), // Quantidade total
        attachments: data.attachments, // Salvar os anexos
      };

      const { data: insertedColeta, error: coletaError } = await supabase
        .from('coletas')
        .insert(coletaToInsert)
        .select()
        .single();
      
      if (coletaError) throw new Error(coletaError.message);

      for (const item of data.items) {
        if (item.modelo_aparelho && item.qtd_aparelhos_solicitado && item.qtd_aparelhos_solicitado > 0) {
          const newItem: ItemInsert = {
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

  const handleSave = (data: ColetaInsert, items: ItemData[]) => {
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
      attachments: attachments, // Passar os anexos para a mutação
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
            <CardContent className="p-6 space-y-6">
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
                      onChange={(e) => handleInputChange("client_control", e.target.value)}
                      disabled={isFormDisabled}
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
                      onChange={(e) => handleInputChange("nf_glbl", e.target.value)}
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
                      onChange={(e) => handleInputChange("partner_code", e.target.value)}
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </div>

              <ColetaClientDetails
                parsedData={formData}
                handleParsedDataChange={handleInputChange}
                isFormDisabled={isFormDisabled}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previsao_coleta">Data da Coleta *</Label>
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
              </div>

              <ColetaItemsSection
                onItemsUpdate={setCollectionItems}
                isPending={isFormDisabled}
                initialItems={collectionItems}
              />

              <ColetaLogisticsDetails
                formData={formData}
                handleInputChange={handleInputChange}
                handleDriverSelect={handleDriverSelect}
                handleTransportadoraSelect={handleTransportadoraSelect}
                isPending={isFormDisabled}
              />

              <ColetaResponsibleUser
                formData={formData}
                handleInputChange={handleInputChange}
                handleResponsibleUserSelect={handleResponsibleUserSelect}
                isPending={isFormDisabled}
              />

              <ColetaObservation
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

              <ManualSchedulerActionButtons
                onCancel={() => navigate('/coletas-dashboard')}
                onSave={() => handleSave(formData, collectionItems)}
                isPending={isFormDisabled}
                backButtonPath="/coletas-dashboard"
                backButtonText="Voltar ao Dashboard de Coletas"
                saveButtonText="Agendar Coleta"
                navigate={navigate}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};