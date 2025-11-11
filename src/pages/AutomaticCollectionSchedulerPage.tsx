import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, PlusCircle, Loader2, Tag, ClipboardList, Calendar as CalendarIcon, FileText, Hash } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateUniqueNumber, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems, cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { parseReturnDocumentText, processSelectedSpreadsheetCellsForItems, parseSelectedSpreadsheetCells } from '@/lib/document-parser';
import type { ParsedCollectionData, ParsedItem } from '@/lib/types'; // Updated import path

// Import new modular components from the shared directory
import { DocumentInputCard } from '@/components/shared-scheduler-sections/DocumentInputCard';
import { AutomaticSchedulerActionButtons } from '@/components/shared-scheduler-sections/AutomaticSchedulerActionButtons/AutomaticSchedulerActionButtons';
import { AutomaticCollectionForm } from '@/components/automatic-scheduler-sections/AutomaticCollectionForm'; // Import the new form component

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
    unique_number: generateUniqueNumber('COL'), // Always generate a new unique number on initial state
    client_control: null,
    contrato: null,
    nf_glbl: null,
    partner_code: null,
    origin_address_number: "", // Novo campo
    destination_address_number: "", // Novo campo
  });

  const [attachments, setAttachments] = useState<FileAttachment[]>([]); // Estado para os anexos

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

  const addColetaMutation = useMutation({
    mutationFn: async (newColeta: ColetaInsert & { items: ParsedItem[]; attachments: FileAttachment[] }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para agendar coletas.");
      }
      
      const { items, attachments: currentAttachments, ...coletaData } = newColeta;
      
      const coletaToInsert: ColetaInsert = {
        user_id: user.id,
        parceiro: coletaData.parceiro,
        endereco: coletaData.endereco_origem,
        previsao_coleta: coletaData.previsao_coleta,
        status_coleta: coletaData.status_coleta,
        type: coletaData.type,
        unique_number: coletaData.unique_number,
        client_control: coletaData.client_control,
        contato: coletaData.contato,
        telefone: coletaData.telefone,
        email: coletaData.email,
        cnpj: coletaData.cnpj,
        contrato: coletaData.contrato,
        nf_glbl: coletaData.nf_glbl,
        partner_code: coletaData.partner_code,
        observacao: coletaData.observacao,
        responsavel: coletaData.responsavel,
        responsible_user_id: coletaData.responsible_user_id,
        cep_origem: coletaData.cep_origem,
        endereco_origem: coletaData.endereco_origem,
        origin_lat: coletaData.origin_lat,
        origin_lng: coletaData.origin_lng,
        cep_destino: coletaData.cep_destino,
        endereco_destino: coletaData.endereco_destino,
        destination_lat: coletaData.destination_lat,
        destination_lng: coletaData.destination_lng,
        modelo_aparelho: formatItemsForColetaModeloAparelho(items), // Resumo dos itens
        qtd_aparelhos_solicitado: getTotalQuantityOfItems(items), // Quantidade total
        attachments: currentAttachments, // Salvar os anexos
        origin_address_number: coletaData.origin_address_number, // Novo campo
        destination_address_number: coletaData.destination_address_number, // Novo campo
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
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
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

    const coletaToInsert: ColetaInsert & { items: ParsedItem[]; attachments: FileAttachment[] } = {
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
      nf_glbl: formData.nf_glbl,
      partner_code: formData.partner_code,
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
      attachments: attachments, // Passar os anexos
      origin_address_number: formData.origin_address_number, // Novo campo
      destination_address_number: formData.destination_address_number, // Novo campo
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
      client_control: null,
      contrato: null,
      nf_glbl: null,
      partner_code: null,
      origin_address_number: "", // Resetar
      destination_address_number: "", // Resetar
    });
    setAttachments([]); // Clear attachments
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
            <AutomaticCollectionForm
              formData={formData}
              setFormData={setFormData}
              isFormDisabled={isFormDisabled}
              setIsGeocoding={setIsGeocoding}
              attachments={attachments}
              setAttachments={setAttachments}
            />
          </Card>

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
        </div>
      </div>
    </div>
  );
};