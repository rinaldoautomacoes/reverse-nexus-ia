import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, XCircle, Send, Loader2 } from 'lucide-react';

interface ManualSchedulerActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isPending: boolean;
  backButtonPath: string;
  backButtonText: string;
  saveButtonText: string;
  navigate: (path: string) => void;
}

export const ManualSchedulerActionButtons: React.FC<ManualSchedulerActionButtonsProps> = ({
  onCancel,
  onSave,
  isPending,
  backButtonPath,
  backButtonText,
  saveButtonText,
  navigate,
}) => {
  return (
    <div className="flex justify-between items-center mt-4 pt-4">
      <div className="flex gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(backButtonPath)}
          disabled={isPending}
          className="border-neural text-neural hover:bg-neural/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backButtonText}
        </Button>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          disabled={isPending}
          className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {saveButtonText}
        </Button>
      </div>
    </div>
  );
};