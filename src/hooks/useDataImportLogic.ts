import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  parseCollectionsXLSX, parseCollectionsCSV, parsePDF,
  parseProductsXLSX, parseProductsCSV, parseProductsJSON,
  parseClientsXLSX, parseClientsCSV, parseClientsJSON,
  parseTechniciansXLSX, parseTechniciansCSV, parseTechniciansJSON,
  parseSupervisorsXLSX, parseSupervisorsCSV, parseSupervisorsJSON
} from '@/lib/data-parser';
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData, SupervisorImportData } from '@/lib/types';
import { useImportMutations } from './useImportMutations';

type ActiveTab = 'collections' | 'products' | 'clients' | 'technicians' | 'supervisors';
type ExtractedDataType = ColetaImportData[] | ProductImportData[] | ClientImportData[] | TechnicianImportData[] | SupervisorImportData[] | null;
type StepType = 'upload' | 'preview_table' | 'review_dialog';

interface UseDataImportLogicProps {
  initialTab?: ActiveTab;
  onImportSuccess?: (importedType: ActiveTab) => void;
}

export const useDataImportLogic = ({ initialTab = 'collections', onImportSuccess }: UseDataImportLogicProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedDataType>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [parseError, setParseError] = useState<string | null>(null);
  const [step, setStep] = useState<StepType>('upload');

  const {
    importCollectionsMutation,
    importProductsMutation,
    importClientsMutation,
    importTechniciansMutation,
    importSupervisorsMutation,
    isImportPending,
  } = useImportMutations({
    userId: user?.id,
    onImportSuccess: (type) => {
      setSelectedFile(null);
      setExtractedData(null);
      setStep('upload');
      onImportSuccess?.(type);
    },
    onImportError: (error, type) => {
      console.error(`Erro na mutação de importação para ${type}:`, error);
      setStep('preview_table'); // Volta para a tabela de preview para revisão
    },
  });

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null);
      setParseError(null);
      setStep('upload');
    }
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedFile(null);
    setExtractedData(null);
    setParseError(null);
    setStep('upload');
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
      let data: ExtractedDataType = [];
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
      } else if (activeTab === 'supervisors') {
        if (fileExtension === 'xlsx') {
          data = await parseSupervisorsXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseSupervisorsCSV(selectedFile);
        } else if (fileExtension === 'json') {
          data = await parseSupervisorsJSON(selectedFile);
        } else {
          throw new Error('Formato de arquivo não suportado para supervisores. Use XLSX, CSV ou JSON.');
        }
      }

      const filteredData = (data || []).filter(item => {
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
          return techItem.first_name && techItem.first_name.trim() !== '';
        }
        if (activeTab === 'supervisors') {
          const supervisorItem = item as SupervisorImportData;
          return supervisorItem.first_name && supervisorItem.first_name.trim() !== '';
        }
        return true;
      });

      if (filteredData.length === 0) {
        throw new Error('Nenhum dado válido foi extraído do arquivo. Verifique se as colunas estão corretas e se há dados preenchidos.');
      }

      setExtractedData(filteredData);
      setStep('preview_table');
      toast({ title: 'Dados extraídos com sucesso!', description: `Foram encontrados ${filteredData.length} registros para importação.` });

    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      setParseError(error.message || 'Arquivo inválido ou dados não reconhecidos.');
      toast({ title: 'Erro ao processar arquivo', description: error.message || 'Arquivo inválido ou dados não reconhecidos.', variant: 'destructive' });
      setExtractedData(null);
      setStep('upload');
    } finally {
      setIsParsing(false);
    }
  }, [selectedFile, activeTab, toast]);

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
    } else if (activeTab === 'supervisors') {
      importSupervisorsMutation.mutate(extractedData as SupervisorImportData[]);
    }
  }, [extractedData, activeTab, importCollectionsMutation, importProductsMutation, importClientsMutation, importTechniciansMutation, importSupervisorsMutation, toast]);

  return {
    selectedFile,
    extractedData,
    isParsing,
    activeTab,
    parseError,
    step,
    isImportPending,
    handleFileChange,
    handleTabChange,
    handleParseFile,
    handleConfirmImport,
    setStep,
    setSelectedFile,
    setExtractedData,
    setParseError,
  };
};