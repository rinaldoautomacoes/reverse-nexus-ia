import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { ImportActionButtons } from './ImportActionButtons';
import { DataPreviewTable } from './DataPreviewTable'; // Re-use the preview table for review
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData } from '@/lib/types';

interface ReviewImportDialogProps {
  activeTab: 'collections' | 'products' | 'clients' | 'technicians';
  extractedData: ColetaImportData[] | ProductImportData[] | ClientImportData[] | TechnicianImportData[];
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ReviewImportDialog: React.FC<ReviewImportDialogProps> = ({
  activeTab,
  extractedData,
  onConfirm,
  onCancel,
  isPending,
}) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'collections': return 'Revisar Coletas/Entregas';
      case 'products': return 'Revisar Produtos';
      case 'clients': return 'Revisar Clientes';
      case 'technicians': return 'Revisar Técnicos';
      default: return 'Revisar Dados';
    }
  };

  const getDescription = () => {
    const count = extractedData.length;
    const itemType = activeTab === 'collections' ? 'coletas/entregas' :
                     activeTab === 'products' ? 'produtos' :
                     activeTab === 'clients' ? 'clientes' : 'técnicos';
    return `Você está prestes a importar ${count} ${itemType}. Por favor, revise os dados abaixo antes de confirmar.`;
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}> {/* Always open when rendered, close onCancel */}
      <DialogContent className="sm:max-w-[900px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <FileText className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <DataPreviewTable activeTab={activeTab} extractedData={extractedData} />
        </div>

        <ImportActionButtons
          onCancel={onCancel}
          onConfirmImport={onConfirm}
          isImportPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
};