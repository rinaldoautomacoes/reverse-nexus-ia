import React from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ImportActionButtonsProps {
  onCancel: () => void;
  onConfirmImport: () => void;
  isImportPending: boolean;
}

export const ImportActionButtons: React.FC<ImportActionButtonsProps> = ({
  onCancel,
  onConfirmImport,
  isImportPending,
}) => {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isImportPending}
      >
        <XCircle className="mr-2 h-4 w-4" />
        Cancelar
      </Button>
      <Button
        onClick={onConfirmImport}
        disabled={isImportPending}
        className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
      >
        {isImportPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        Confirmar Importação
      </Button>
    </div>
  );
};