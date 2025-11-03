import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { 
  parseXLSX, parseCSV, parsePDF, ColetaImportData, 
  ProductImportData, parseProductsXLSX, parseProductsCSV, parseProductsJSON,
  ClientImportData, parseClientsXLSX, parseClientsCSV, parseClientsJSON
} from '@/lib/data-parser';
import type { TablesInsert } from '@/integrations/supabase/types_generated';

// Import new modular components
import { ImportFileSection } from './data-importer-sections/ImportFileSection';
import { DataPreviewTable } from './data-importer-sections/DataPreviewTable';
import { ImportActionButtons } from './data-importer-sections/ImportActionButtons';

type ColetaInsert = TablesInsert<'coletas'>;
type ProductInsert = TablesInsert<'products'>;
type ClientInsert = TablesInsert<'clients'>;
type ItemInsert = TablesInsert<'items'>;

interface DataImporterProps {
  initialTab?: 'collections' | 'products' | 'clients';
  onImportSuccess?: () => void;
  onClose: () => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({ initialTab = 'collections', onImportSuccess, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ColetaImportData[] | ProductImportData[] | ClientImportData[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'products' | 'clients'>(initialTab);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null);
      setParseError(null);
    }
  };

  const handleTabChange = useCallback((tab: 'collections' | 'products' | 'clients') => {
    setActiveTab(tab);
    setSelectedFile(null);
    setExtractedData(null);
    setParseError(null);
  }, []);

  const handleParseFile = useCallback(async () => {
    if (!selectedFile) {
      toast({ title: 'Nenhum arquivo selecionado', description: 'Por favor, selecione um arquivo para importar.', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    setExtractedData(null);
    setParseError(null);

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    try {
      let data: ColetaImportData[] | ProductImportData[] | ClientImportData[] = [];
      if (activeTab === 'collections') {
        if (fileExtension === 'xlsx') {
          data = await parseXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseCSV(selectedFile);
        } else if (fileExtension === 'pdf') {
          toast({
            title: 'Extração de PDF (Simulada)',
            description: 'A extração de PDF está usando dados fictícios. Para uma funcionalidade real, integre uma API de OCR.',
            variant: 'warning',
            duration: 8000,
          });
          data = await parsePDF(selectedFile);
        } else {
          throw new Error('Formato de arquivo não suportado para coletas/entregas. Use XLSX, CSV ou PDF.');
        }
      } else if (activeTab === 'products') {
        if (fileExtension === 'xlsx') {
          data = await parseProductsXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseProductsCSV(selectedFile);
        } else if (fileExtension === 'json') {
          data = await parseProductsJSON(selectedFile);
        } else {
          throw new Error('Formato de arquivo não suportado para produtos. Use XLSX, CSV ou JSON.');
        }
      } else if (activeTab === 'clients') {
        if (fileExtension === 'xlsx') {
          data = await parseClientsXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseClientsCSV(selectedFile);
        } else if (fileExtension === 'json') {
          data = await parseClientsJSON(selectedFile);
        } else {
          throw new Error('Formato de arquivo não suportado para clientes. Use XLSX, CSV ou JSON.');
        }
      }

      const filteredData = data.filter(item => {
        if (activeTab === 'clients') {
          return (item as ClientImportData).name && (item as ClientImportData).name.trim() !== '';
        }
        if (activeTab === 'products') {
          return (item as ProductImportData).code && (item as ProductImportData).code.trim() !== '';
        }
        if (activeTab === 'collections') {
          return (item as ColetaImportData).parceiro && (item as ColetaImportData).parceiro.trim() !== '' &&
                 (item as ColetaImportData).endereco_origem && (item as ColetaImportData).endereco_origem.trim() !== '' &&
                 (item as ColetaImportData).previsao_coleta && (item as ColetaImportData).previsao_coleta.trim() !== '';
        }
        return true;
      });

      if (filteredData.length === 0) {
        throw new Error('Nenhum dado válido foi extraído do arquivo. Verifique se as colunas estão corretas e se há dados preenchidos.');
      }

      setExtractedData(filteredData);
      toast({ title: 'Dados extraídos com sucesso!', description: `Foram encontrados ${filteredData.length} registros para importação.` });

    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      setParseError(error.message || 'Arquivo inválido ou dados não reconhecidos.');
      toast({ title: 'Erro ao processar arquivo', description: error.message || 'Arquivo inválido ou dados não reconhecidos.', variant: 'destructive' });
      setExtractedData(null);
    } finally {
      setIsParsing(false);
    }
  }, [selectedFile, activeTab, toast]);

  const importCollectionsMutation = useMutation({
    mutationFn: async (dataToImport: ColetaImportData[]) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para importar dados.');
      }

      const inserts: ColetaInsert[] = dataToImport.map(item => ({
        user_id: user.id,
        unique_number: item.unique_number,
        client_control: item.client_control,
        parceiro: item.parceiro,
        contato: item.contato,
        telefone: item.telefone,
        email: item.email,
        cnpj: item.cnpj,
        endereco: item.endereco_origem,
        cep: item.cep_origem,
        endereco_origem: item.endereco_origem,
        cep_origem: item.cep_origem,
        origin_lat: item.origin_lat,
        origin_lng: item.origin_lng,
        endereco_destino: item.endereco_destino,
        cep_destino: item.cep_destino,
        destination_lat: item.destination_lat,
        destination_lng: item.destination_lng,
        previsao_coleta: item.previsao_coleta,
        modelo_aparelho: item.modelo_aparelho,
        qtd_aparelhos_solicitado: item.qtd_aparelhos_solicitado,
        freight_value: item.freight_value,
        observacao: item.observacao,
        status_coleta: item.status_coleta,
        type: item.type,
      }));

      const { data: insertedColetas, error: coletasError } = await supabase.from('coletas').insert(inserts).select('id, status_coleta');
      if (coletasError) throw new Error(coletasError.message);

      const itemsToInsert: ItemInsert[] = [];
      insertedColetas.forEach((coleta, index) => {
        const originalItemData = dataToImport[index];
        if (originalItemData.modelo_aparelho && originalItemData.qtd_aparelhos_solicitado && originalItemData.qtd_aparelhos_solicitado > 0) {
          itemsToInsert.push({
            user_id: user.id,
            collection_id: coleta.id,
            name: originalItemData.modelo_aparelho,
            description: originalItemData.modelo_aparelho,
            quantity: originalItemData.qtd_aparelhos_solicitado,
            status: coleta.status_coleta || 'pendente',
          });
        }
      });

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('items').insert(itemsToInsert);
        if (itemsError) throw new Error(itemsError.message);
      }

      return insertedColetas.length;
    },
    onSuccess: (count) => {
      // Invalidate specific queries used by the dashboard components
      queryClient.invalidateQueries({ queryKey: ['coletasForMetrics'] }); // For ColetasMetricsCards
      queryClient.invalidateQueries({ queryKey: ['coletasStatusChart'] }); // For ColetasStatusChart
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart'] }); // For CollectionStatusDonutChart
      queryClient.invalidateQueries({ queryKey: ['allProducts'] }); // Products might be updated or needed for descriptions

      // Also invalidate other relevant lists and dashboards
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas'] });
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas'] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas'] });
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas'] });
      queryClient.invalidateQueries({ queryKey: ['entregasForMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart'] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart'] });
      queryClient.invalidateQueries({ queryKey: ['allColetasForGeneralDashboard'] });
      
      toast({ title: 'Importação de Coletas/Entregas concluída!', description: `${count} registros foram salvos com sucesso no banco de dados.` });
      setSelectedFile(null);
      setExtractedData(null);
      onImportSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Coletas/Entregas', description: error.message, variant: 'destructive' });
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: async (dataToImport: ProductImportData[]) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para importar produtos.');
      }

      const inserts: ProductInsert[] = dataToImport.map(item => ({
        user_id: user.id,
        code: item.code,
        description: item.description,
        model: item.model,
        serial_number: item.serial_number,
      }));

      const { error } = await supabase
        .from('products')
        .upsert(inserts, { onConflict: 'code,user_id', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
      toast({ title: 'Importação de Produtos concluída!', description: `${count} produtos foram salvos com sucesso no banco de dados, duplicatas foram ignoradas.` });
      setSelectedFile(null);
      setExtractedData(null);
      onImportSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Produtos', description: error.message, variant: 'destructive' });
    },
  });

  const importClientsMutation = useMutation({
    mutationFn: async (dataToImport: ClientImportData[]) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para importar clientes.');
      }

      const validClients = dataToImport.filter(client => client.name && client.name.trim() !== '');
      if (validClients.length === 0) {
        throw new Error('Nenhum cliente válido encontrado para importação. Certifique-se de que a coluna "Nome" ou "Nome do Cliente" não está vazia.');
      }

      const inserts: ClientInsert[] = validClients.map(item => ({
        user_id: user.id,
        name: item.name,
        phone: item.phone,
        email: item.email,
        address: item.address,
        cnpj: item.cnpj,
        contact_person: item.contact_person,
      }));

      const { error } = await supabase
        .from('clients')
        .upsert(inserts, { onConflict: 'name,user_id', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      toast({ title: 'Importação de Clientes concluída!', description: `${count} clientes foram salvos com sucesso no banco de dados, duplicatas foram ignoradas.` });
      setSelectedFile(null);
      setExtractedData(null);
      onImportSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Clientes', description: error.message, variant: 'destructive' });
    },
  });

  const handleConfirmImport = useCallback(() => {
    if (!extractedData || extractedData.length === 0) {
      toast({ title: 'Nenhum dado para importar', description: 'Por favor, extraia dados antes de confirmar a importação.', variant: 'destructive' });
      return;
    }

    if (activeTab === 'collections') {
      importCollectionsMutation.mutate(extractedData as ColetaImportData[]);
    } else if (activeTab === 'products') {
      importProductsMutation.mutate(extractedData as ProductImportData[]);
    } else if (activeTab === 'clients') {
      importClientsMutation.mutate(extractedData as ClientImportData[]);
    }
  }, [extractedData, activeTab, importCollectionsMutation, importProductsMutation, importClientsMutation, toast]);

  const isImportPending = importCollectionsMutation.isPending || importProductsMutation.isPending || importClientsMutation.isPending;

  return (
    <div className="space-y-6">
      <ImportFileSection
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedFile={selectedFile}
        handleFileChange={handleFileChange}
        handleParseFile={handleParseFile}
        isParsing={isParsing}
        isImportPending={isImportPending}
        error={parseError}
      />

      {extractedData && extractedData.length > 0 && (
        <>
          <DataPreviewTable activeTab={activeTab} extractedData={extractedData} />
          <ImportActionButtons
            onCancel={() => {
              setSelectedFile(null);
              setExtractedData(null);
              setParseError(null);
            }}
            onConfirmImport={handleConfirmImport}
            isImportPending={isImportPending}
          />
        </>
      )}
    </div>
  );
};