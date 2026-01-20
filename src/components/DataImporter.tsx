import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { 
  parseCollectionsXLSX, parseCollectionsCSV, parsePDF, // Corrigido: Usando os nomes corretos para collections
  parseProductsXLSX, parseProductsCSV, parseProductsJSON,
  parseClientsXLSX, parseClientsCSV, parseClientsJSON,
  parseTechniciansXLSX, parseTechniciansCSV, parseTechniciansJSON
} from '@/lib/data-parser';
import type { TablesInsert } from '@/integrations/supabase/types_generated';
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData } from '@/lib/types';

// Import new modular components
import { ImportFileSection } from './data-importer-sections/ImportFileSection';
import { DataPreviewTable } from './data-importer-sections/DataPreviewTable';
import { ImportActionButtons } from './data-importer-sections/ImportActionButtons';

type ColetaInsert = TablesInsert<'coletas'>;
type ProductInsert = TablesInsert<'products'>;
type ClientInsert = TablesInsert<'clients'>;
type ItemInsert = TablesInsert<'items'>;

interface DataImporterProps {
  initialTab?: 'collections' | 'products' | 'clients' | 'technicians';
  onImportSuccess?: () => void;
  onClose: () => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({ initialTab = 'collections', onImportSuccess, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ColetaImportData[] | ProductImportData[] | ClientImportData[] | TechnicianImportData[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'products' | 'clients' | 'technicians'>(initialTab);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null);
      setParseError(null);
    }
  };

  const handleTabChange = useCallback((tab: 'collections' | 'products' | 'clients' | 'technicians') => {
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
      let data: ColetaImportData[] | ProductImportData[] | ClientImportData[] | TechnicianImportData[] = [];
      if (activeTab === 'collections') {
        if (fileExtension === 'xlsx') {
          data = await parseCollectionsXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseCollectionsCSV(selectedFile);
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
      } else if (activeTab === 'technicians') {
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
        if (activeTab === 'technicians') {
          const techItem = item as TechnicianImportData;
          return techItem.email && techItem.email.trim() !== '' &&
                 techItem.first_name && techItem.first_name.trim() !== '' &&
                 techItem.last_name && techItem.last_name.trim() !== '';
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
        endereco_origem: item.endereco_origem,
        cep_origem: item.cep_origem,
        origin_address_number: item.origin_address_number,
        endereco_destino: item.endereco_destino,
        cep_destino: item.cep_destino,
        destination_address_number: item.destination_address_number,
        origin_lat: item.origin_lat,
        origin_lng: item.origin_lng,
        destination_lat: item.destination_lat,
        destination_lng: item.destination_lng,
        previsao_coleta: item.previsao_coleta,
        qtd_aparelhos_solicitado: item.qtd_aparelhos_solicitado,
        modelo_aparelho: item.modelo_aparelho, // Keep this for now, will be updated by items
        freight_value: item.freight_value,
        observacao: item.observacao,
        status_coleta: item.status_coleta,
        type: item.type,
        contrato: item.contrato,
        nf_glbl: item.nf_glbl,
        partner_code: item.partner_code,
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
      queryClient.invalidateQueries({ queryKey: ['coletasForMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['coletasStatusChart'] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
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

  const importTechniciansMutation = useMutation({
    mutationFn: async (dataToImport: TechnicianImportData[]) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para importar técnicos.');
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error("Sessão de autenticação ausente. Faça login novamente.");
      }

      const results = await Promise.all(dataToImport.map(async (tech) => {
        try {
          console.log(`[DataImporter] Attempting to create user for email: ${tech.email}`); // Log email
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: tech.email,
              password: tech.password || 'LogiReverseIA@2025', // Default password
              first_name: tech.first_name,
              last_name: tech.last_name,
              role: tech.role || 'standard', // Ensure role is 'standard' for technicians
              phone_number: tech.phone_number,
              supervisor_id: tech.supervisor_id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`[DataImporter] Failed to create user ${tech.email}:`, errorData.error || response.statusText); // Log error
            throw new Error(errorData.error || `Falha ao criar técnico ${tech.email}.`);
          }

          const data = await response.json();
          console.log(`[DataImporter] Successfully created user ${tech.email}. Response:`, data); // Log success
          return { success: true, email: tech.email, userId: data.user };
        } catch (error: any) {
          console.error(`[DataImporter] Error importing technician ${tech.email}:`, error.message);
          return { success: false, email: tech.email, error: error.message };
        }
      }));

      console.log('[DataImporter] All technician import results:', results); // Log all results

      const successfulImports = results.filter(r => r.success).length;
      const failedImports = results.filter(r => !r.success);

      if (failedImports.length > 0) {
        const errorMessages = failedImports.map(f => `${f.email}: ${f.error}`).join('\n');
        toast({
          title: `Importação de Técnicos: ${successfulImports} sucesso, ${failedImports.length} falhas`,
          description: `Alguns técnicos não puderam ser importados:\n${errorMessages}`,
          variant: 'destructive',
          duration: 10000,
        });
      }

      return successfulImports;
    },
    onSuccess: (count) => {
      // Invalida a query principal da página TechnicianManagement
      queryClient.invalidateQueries({ queryKey: ['allProfiles', user?.id] }); 
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', user?.id] });
      toast({ title: 'Importação de Técnicos concluída!', description: `${count} técnicos foram salvos com sucesso no banco de dados.` });
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
    } else if (activeTab === 'technicians') {
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