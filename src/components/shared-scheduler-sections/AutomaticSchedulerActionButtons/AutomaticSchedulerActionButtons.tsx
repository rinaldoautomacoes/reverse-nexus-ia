import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, XCircle, Send, Loader2 } from 'lucide-react';

interface AutomaticSchedulerActionButtonsProps {
  handleClearPreview: () => void;
  handleScheduleCollection: () => void;
  isFormDisabled: boolean;
  isSchedulePending: boolean;
  backButtonPath: string;
  backButtonText: string;
  saveButtonText: string;
  navigate: (path: string) => void;
  canSchedule: boolean; // Adicionado para controlar a habilitação do botão de agendamento
}

export const AutomaticSchedulerActionButtons: React.FC<AutomaticSchedulerActionButtonsProps> = ({
  handleClearPreview,
  handleScheduleCollection,
  isFormDisabled,
  isSchedulePending,
  backButtonPath,
  backButtonText,
  saveButtonText,
  navigate,
  canSchedule,
}) => {
  return (
    <div className="flex justify-between items-center mt-4 pt-4">
      <div className="flex gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(backButtonPath)}
          disabled={isFormDisabled}
          className="border-neural text-neural hover:bg-neural/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backButtonText}
        </Button>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleClearPreview}
          disabled={isFormDisabled}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Limpar Pré-visualização
        </Button>
        <Button
          onClick={handleScheduleCollection}
          disabled={isFormDisabled || !canSchedule}
          className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
        >
          {isSchedulePending ? (
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