import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, PlusCircle, Loader2, Tag, ClipboardList, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems, cn } from "@/lib/utils";
import { format } from "date-fns";
import { parseReturnDocumentText, processSelectedSpreadsheetCellsForItems, parseSelectedSpreadsheetCells } from '@/lib/document-parser';
import type { ParsedCollectionData, ParsedItem } from '@/lib/types'; // Updated import path

// Import new modular components from the shared directory
import { DocumentInputCard } from '@/components/shared-scheduler-sections/DocumentInputCard';
import { ColetaClientDetails } from '@/components/shared-scheduler-sections/ColetaClientDetails';
import { OriginAddressSection } from '@/components/shared-scheduler-sections/OriginAddressSection';
import { DestinationAddressSection } from '@/components/shared-scheduler-sections/DestinationAddressSection';
import { MainProductAndDateSection } from '@/components/shared-scheduler-sections/MainProductAndDateSection';
import { ItemsTableSection } from '@/components/shared-scheduler-sections/ItemsTableSection';
import { AutomaticSchedulerActionButtons } from '@/components/shared-scheduler-sections/AutomaticSchedulerActionButtons/AutomaticSchedulerActionButtons';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";


type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;
type ItemInsert = TablesInsert<'items'>;

export const AutomaticCollectionSchedulerPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();

  const [formData, setFormData] = useState<ParsedCollectionData>({
    parceiro: "",
    endereco_origem: "",
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
    items: [],
    status_coleta: "pendente",
    type: "coleta",
    unique_number: generateUniqueNumber('COL'), // Always generate a unique number on initial state
    client_control: null, // Alterado para null
  });

  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [documentText, setDocumentText] = useState<string>("");

  const handleParseDocument = useCallback(async (textToParse: string = documentText) => {
    if (!textToParse.trim()) {
      toast({ title: "Nenhum texto para processar", description: "Por favor, cole o conteúdo do documento.", variant: "destructive" });
      return;
    }

    setIsProcessingDocument(true);
    try {
      const parsed = parseReturnDocumentText(textToParse);
      
      let originLat = parsed.origin_lat;
      let originLng = parsed.origin_lng;
      let destinationLat = parsed.destination_lat;
      let destinationLng = parsed.destination_lng;

      const mapboxAccessToken = localStorage.getItem("mapbox_token");

      if (mapboxAccessToken) {
        setIsGeocoding(true);
        if (parsed.endereco_origem && (!parsed.origin_lat || !parsed.origin_lng)) {
          try {
            const geoResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(parsed.endereco_origem)}.json?access_token=${mapboxAccessToken}`
            );
            const geoData = await geoResponse.json();
            if (geoData.features && geoData.features.length > 0) {
              [originLng, originLat] = geoData.features[0].center;
            } else {
              toast({ title: "Geocodificação de Origem Falhou", description: "Não foi possível obter as coordenadas para o endereço de origem.", variant: "warning" });
            }
          } catch (geoError) {
            console.error("Erro ao geocodificar origem:", geoError);
            toast({ title: "Erro na Geocodificação de Origem", description: "Ocorreu um erro ao geocodificar o endereço de origem.", variant: "destructive" });
          }
        }

        if (parsed.endereco_destino && (!parsed.destination_lat || !parsed.destination_lng)) {
          try {
            const geoResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(parsed.endereco_destino)}.json?access_token=${mapboxAccessToken}`
            );
            const geoData = await geoResponse.json();
            if (geoData.features && geoData.features.length > 0) {
              [destinationLng, destinationLat] = geoData.features[0].center;
            } else {
              toast({ title: "Geocodificação de Destino Falhou", description: "Não foi possível obter as coordenadas para o endereço de destino.", variant: "warning" });
            }
          } catch (geoError) {
            console.error("Erro ao geocodificar destino:", geoError);
            toast({ title: "Erro na Geocodificação de Destino", description: "Ocorreu um erro ao geocodificar o endereço de destino.", variant: "destructive" });
          }
        }
        setIsGeocoding(false);
      } else {
        toast({ title: "Token Mapbox Ausente", description: "Insira seu token Mapbox para geocodificação automática de endereços.", variant: "warning" });
      }

      setFormData(prev => ({
        ...prev,
        ...parsed,
        unique_number: generateUniqueNumber('COL'), // Always override with a new unique number
        origin_lat: originLat,
        origin_lng: originLng,
        destination_lat: destinationLat,
        destination_lng: destinationLng,
      }));
      toast({ title: "Documento Processado", description: "Dados extraídos e preenchidos no formulário." });
    } catch (error: any) {
      toast({ title: "Erro ao Processar Documento", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingDocument(false);
    }
  }, [documentText, toast]);

  useEffect(() => {
    if (location.state?.parsedCollectionData) {
      // Handle structured data coming from ExcelExtractorPage
      setFormData(prev => ({
        ...prev,
        ...location.state.parsedCollectionData,
        unique_number: generateUniqueNumber('COL'), // Always override with a new unique number
      }));
      setDocumentText(""); // Clear documentText if data came from spreadsheet
      navigate(location.pathname, { replace: true, state: {} });
      toast({ title: "Dados do Excel carregados", description: `Dados extraídos da planilha e preenchidos no formulário.` });
    } else if (location.state?.extractedText) {
      // Handle data coming from manual text paste or old ExcelExtractorPage flow
      setDocumentText(location.state.extractedText);
      handleParseDocument(location.state.extractedText);
      // Clear location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, toast, handleParseDocument]);

  useEffect(() => {
    if (user?.id) {
      // user_id will be added in mutation
    }
  }, [user?.id]);

  const handleParsedDataChange = useCallback((field: keyof ParsedCollectionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof ParsedItem, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      if (newItems[index]) {
        (newItems[index] as any)[field] = value;
      }
      return { ...prev, items: newItems };
    });
  }, []);

  const handleAddItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { product_code: '', product_description: '', quantity: 1 }],
    }));
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  }, []);

  const addColetaMutation = useMutation({
    mutationFn: async (newColeta: ColetaInsert & { items: ParsedItem[] }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar coletas.");
      }
      
      const { items, ...coletaData } = newColeta;
      
      const coletaToInsert: ColetaInsert = {
        ...coletaData,
        user_id: user.id,
        type: 'coleta',
        modelo_aparelho: formatItemsForColetaModeloAparelho(items), // Resumo dos itens
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(items), // Quantidade total
      };

      const { data: insertedColeta, error: coletaError } = await supabase
        .from('coletas')
        .insert(coletaToInsert)
        .select()
        .single();
      
      if (coletaError) throw new Error(coletaError.message);

      if (items && items.length > 0) {
        const itemsToInsert: ItemInsert[] = items.map(item => ({
          user_id: user.id,
          collection_id: insertedColeta.id,
          name: item.product_code,
          description: item.product_description,
          quantity: item.quantity,
          status: insertedColeta.status_coleta || 'pendente',
        }));
        const { error: itemError } = await supabase.from('items').insert(itemsToInsert);
        if (itemError) {
          console.error("Erro ao inserir itens na tabela 'items':", itemError.message);
        }
      }

      return insertedColeta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['itemsForColetasMetrics', user?.id] });
      toast({ title: "Coleta Agendada!", description: "Nova coleta criada com sucesso." });
      navigate('/coletas-ativas');
    },
    onError: (err) => {
      toast({ title: "Erro ao agendar coleta", description: err.message, variant: "destructive" });
    },
  });

  const handleScheduleCollection = () => {
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
    if (!formData.items || formData.items.length === 0 || formData.items.some(item => !item.product_code || item.quantity <= 0)) {
      toast({ title: "Itens Obrigatórios", description: "Adicione pelo menos um item válido com código e quantidade maior que zero.", variant: "destructive" });
      return;
    }

    const coletaToInsert: ColetaInsert & { items: ParsedItem[] } = {
      user_id: user?.id || "",
      parceiro: formData.parceiro,
      endereco: formData.endereco_origem,
      previsao_coleta: formData.previsao_coleta,
      status_coleta: formData.status_coleta,
      type: formData.type,
      unique_number: formData.unique_number,
      client_control: formData.client_control,
      contato: formData.contato,
      telefone: formData.telefone,
      email: formData.email,
      cnpj: formData.cnpj,
      contrato: formData.contrato,
      observacao: formData.observacao,
      responsavel: formData.responsavel,
      responsible_user_id: formData.responsible_user_id,
      cep_origem: formData.cep_origem,
      endereco_origem: formData.endereco_origem,
      origin_lat: formData.origin_lat,
      origin_lng: formData.origin_lng,
      cep_destino: formData.cep_destino,
      endereco_destino: formData.endereco_destino,
      destination_lat: formData.destination_lat,
      destination_lng: formData.destination_lng,
      modelo_aparelho: formatItemsForColetaModeloAparelho(formData.items), // Resumo dos itens
      qtd_aparelhos_solicitado: getTotalQuantityOfItems(formData.items), // Quantidade total
      items: formData.items,
    };

    addColetaMutation.mutate(coletaToInsert);
  };

  const handleClearPreview = () => {
    setDocumentText("");
    setFormData({
      parceiro: "",
      endereco_origem: "",
      previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
      items: [],
      status_coleta: "pendente",
      type: "coleta",
      unique_number: generateUniqueNumber('COL'), // Reset to a new unique number
      client_control: null, // Reset to null
    });
    toast({ title: "Pré-visualização Limpa", description: "Todos os dados do formulário foram resetados." });
  };

  const isFormDisabled = addColetaMutation.isPending || isProcessingDocument || isGeocoding;

  const canSchedule = formData.parceiro && formData.endereco_origem && formData.previsao_coleta && formData.items && formData.items.length > 0 && formData.items.every(item => item.product_code && item.quantity > 0);

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Agendamento Automático de Coleta
            </h1>
            <p className="text-muted-foreground">
              Cole o texto de um documento para preencher automaticamente os detalhes da coleta.
            </p>
          </div>

          <DocumentInputCard
            documentText={documentText}
            setDocumentText={setDocumentText}
            handleProcessDocument={() => handleParseDocument()}
            isProcessing={isProcessingDocument}
            isGeocoding={isGeocoding}
            isFormDisabled={isFormDisabled}
          />

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
                      onChange={(e) => handleParsedDataChange("client_control", e.target.value)}
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </div>

              <ColetaClientDetails
                parsedData={formData}
                handleParsedDataChange={handleParsedDataChange}
                isFormDisabled={isFormDisabled}
              />

              <OriginAddressSection
                formData={formData}
                handleInputChange={handleParsedDataChange}
                isFormDisabled={isFormDisabled}
                setIsGeocoding={setIsGeocoding}
              />

              <DestinationAddressSection
                formData={formData}
                handleInputChange={handleParsedDataChange}
                isFormDisabled={isFormDisabled}
                setIsGeocoding={setIsGeocoding}
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

              <AutomaticSchedulerActionButtons
                handleClearPreview={handleClearPreview}
                handleScheduleCollection={handleScheduleCollection}
                isFormDisabled={isFormDisabled}
                isSchedulePending={addColetaMutation.isPending}
                backButtonPath="/coletas-dashboard"
                backButtonText="Voltar ao Dashboard de Coletas"
                saveButtonText="Agendar Coleta"
                navigate={navigate}
                canSchedule={canSchedule}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};