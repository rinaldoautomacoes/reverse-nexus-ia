import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ClipboardList, Loader2 } from 'lucide-react';

interface DocumentInputCardProps {
  documentText: string;
  setDocumentText: (text: string) => void;
  handleProcessDocument: () => void;
  isProcessing: boolean;
  isGeocoding: boolean;
  isFormDisabled: boolean;
}

export const DocumentInputCard: React.FC<DocumentInputCardProps> = ({
  documentText,
  setDocumentText,
  handleProcessDocument,
  isProcessing,
  isGeocoding,
  isFormDisabled,
}) => {
  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Colar Documento de Devolução
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <Textarea
          placeholder="Cole o conteúdo do documento de devolução aqui..."
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          rows={15}
          className="min-h-[200px]"
          disabled={isFormDisabled}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleProcessDocument}
            disabled={!documentText.trim() || isFormDisabled}
            className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          >
            {isProcessing || isGeocoding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="mr-2 h-4 w-4" />
            )}
            Processar Documento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};