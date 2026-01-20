import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useDataImportLogic } from '@/hooks/useDataImportLogic'; // Importar o novo hook

// Import new modular components
import { ImportFileSection } from './data-importer-sections/ImportFileSection';
import { DataPreviewTable } from './data-importer-sections/DataPreviewTable';
import { ImportActionButtons } from './data-importer-sections/ImportActionButtons';
import { ReviewImportDialog } from './data-importer-sections/ReviewImportDialog';

type ActiveTab = 'collections' | 'products' | 'clients' | 'technicians' | 'supervisors';

interface DataImporterProps {
  initialTab?: ActiveTab;
  onImportSuccess?: (importedType: ActiveTab) => void;
  onClose: () => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({ initialTab = 'collections', onImportSuccess, onClose }) => {
  const {
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
  } = useDataImportLogic({ initialTab, onImportSuccess });

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

      {step === 'preview_table' && extractedData && extractedData.length > 0 && (
        <>
          <DataPreviewTable activeTab={activeTab} extractedData={extractedData} />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setExtractedData(null);
                setParseError(null);
                setStep('upload');
              }}
              disabled={isImportPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Upload
            </Button>
            <Button
              onClick={() => setStep('review_dialog')}
              disabled={isImportPending}
              className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Revisar e Importar
            </Button>
          </div>
        </>
      )}

      {step === 'review_dialog' && extractedData && (
        <ReviewImportDialog
          activeTab={activeTab}
          extractedData={extractedData}
          onConfirm={handleConfirmImport}
          onCancel={() => setStep('preview_table')}
          isPending={isImportPending}
        />
      )}
    </div>
  );
};