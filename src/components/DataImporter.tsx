import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { 
  parseXLSX, parseCSV, parsePDF, 
  parseProductsXLSX, parseProductsCSV, parseProductsJSON,
  parseClientsXLSX, parseClientsCSV, parseClientsJSON,
  parseTechniciansXLSX, parseTechniciansCSV, parseTechniciansJSON // New imports
} from '@/lib/data-parser';
import type { TablesInsert } from '@/integrations/supabase/types_generated';
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData } from '@/lib/types'; // Updated import path

// Import new modular components
import { ImportFileSection } from './data-importer-sections/ImportFileSection';
import { DataPreviewTable } from './data-importer-sections/DataPreviewTable';
import { ImportActionButtons } from './data-importer-sections/ImportActionButtons';

type ColetaInsert = TablesInsert<'coletas'>;
type ProductInsert = TablesInsert<'products'>;
type ClientInsert = TablesInsert<'clients'>;
type ItemInsert = TablesInsert<'items'>;
type ProfileInsert = TablesInsert<'profiles'>; // New type for technicians

interface DataImporterProps {
  initialTab?: 'collections' | 'products' | 'clients' | 'technicians'; // Adicionado 'technicians'
  onImportSuccess?: () => void;
  onClose: () => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({ initialTab = 'collections', onImportSuccess, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ColetaImportData[] | ProductImportData[] | ClientImportData[] | TechnicianImportData[] | null>(null); // Updated type
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'products' | 'clients' | 'technicians'>(initialTab); // Updated type
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null);
      setParseError(null);
    }
  };

  const handleTabChange = useCallback((tab: 'collections' | 'products' | 'clients' | 'technicians') => { // Updated type
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
      let data: ColetaImportData[] | ProductImportData[] | ClientImportData[] | TechnicianImportData[] = []; // Updated type
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
      } else if (activeTab === 'technicians') { // New logic for technicians
        if (fileExtension === 'xlsx') {
          data = await parseTechniciansXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseTechniciansCSV(selectedFile);
        } else if (fileExtension === 'json') {
          data = await parseTechniciansJSON(selectedFile);
        } else {
          throw new Error('Formato de arquivo não suportado para técnicos. Use XLSX, CSV ou JSON.');
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
        if (activeTab === 'technicians') { // Adjusted filter for technicians: only require first_name
          return (item as TechnicianImportData).first_name && (item as TechnicianImportData).first_name.trim() !== '';
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
        address_number: item.address_number,
        cep: item.cep,
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

  const importTechniciansMutation = useMutation({ // New mutation for technicians
    mutationFn: async (dataToImport: TechnicianImportData[]) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para importar técnicos.');
      }

      const validTechnicians = dataToImport.filter(tech => tech.first_name && tech.first_name.trim() !== '');
      console.log(`[DataImporter] Number of valid technicians to process: ${validTechnicians.length}`);

      if (validTechnicians.length === 0) {
        console.log('[DataImporter] No valid technicians found in the input data after filtering.');
        return 0; // Return 0 if no valid technicians
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error("Sessão de autenticação ausente. Faça login novamente.");
      }

      let importedCount = 0;
      for (const tech of validTechnicians) {
        // Generate email for API call if missing, but don't store it in the parsed data
        const emailForApi = tech.email || (tech.first_name ? `${tech.first_name.toLowerCase().replace(/\s/g, '.')}${tech.last_name ? `.${tech.last_name.toLowerCase().replace(/\s/g, '.')}` : ''}@logireverseia.com` : null);

        if (!emailForApi) {
          console.warn(`[DataImporter] Skipping technician ${tech.first_name} due to missing email and inability to generate one.`);
          toast({ title: "Erro de Dados", description: `Técnico "${tech.first_name}" sem email válido e não foi possível gerar um.`, variant: "warning" });
          continue;
        }

        console.log(`[DataImporter] Attempting to process technician: ${tech.first_name} ${tech.last_name} (Email: ${emailForApi}, Role: ${tech.role}, Supervisor ID: ${tech.supervisor_id}, Address: ${tech.address})`);

        try {
          // Attempt to create/update user via Edge Function
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: emailForApi,
              password: 'password123', // Default placeholder password
              first_name: tech.first_name,
              last_name: tech.last_name,
              role: tech.role || 'standard',
              phone_number: tech.phone_number,
              supervisor_id: tech.supervisor_id,
              address: tech.address,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`[DataImporter] Edge Function 'create-user' failed for ${emailForApi}:`, errorData.error);
            toast({ title: "Erro na Operação", description: `Falha ao criar/atualizar usuário ${emailForApi}: ${errorData.error}`, variant: "destructive" });
            continue; // Continue to next technician even if one fails
          }

          const responseData = await response.json();
          console.log(`[DataImporter] Edge Function response for ${emailForApi}:`, responseData);
          importedCount++; // Increment count if user created/updated successfully

        } catch (error: any) {
          console.error(`[DataImporter] Unexpected error during processing technician ${tech.first_name} (${emailForApi}):`, error.message);
          toast({ title: "Erro Inesperado", description: `Erro ao processar técnico ${tech.first_name}: ${error.message}`, variant: "destructive" });
        }
      }
      console.log(`[DataImporter] Final imported count: ${importedCount}`);
      return importedCount;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['technicians', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['users', user?.id] }); // Invalidate general users too
      queryClient.invalidateQueries({ queryKey: ['supervisors', user?.id] }); // Invalidate supervisors list
      queryClient.invalidateQueries({ queryKey: ['supervisorsList', user?.id] }); // Invalidate supervisor combobox list
      queryClient.invalidateQueries({ queryKey: ['allTechnicians', user?.id] }); // Invalidate all technicians list
      toast({ title: 'Importação de Técnicos concluída!', description: `${count} técnicos foram salvos/atualizados com sucesso.` });
      setSelectedFile(null);
      setExtractedData(null);
      onImportSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Técnicos', description: error.message, variant: 'destructive' });
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
    } else if (activeTab === 'technicians') { // New logic for technicians
      importTechniciansMutation.mutate(extractedData as TechnicianImportData[]);
    }
  }, [extractedData, activeTab, importCollectionsMutation, importProductsMutation, importClientsMutation, importTechniciansMutation, toast]);

  const isImportPending = importCollectionsMutation.isPending || importProductsMutation.isPending || importClientsMutation.isPending || importTechniciansMutation.isPending;

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