import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ParsedCollectionData } from '@/lib/types'; // Updated import path

interface ObservationSectionProps {
  parsedData: ParsedCollectionData;
  handleParsedDataChange: (field: keyof ParsedCollectionData, value: any) => void;
  isFormDisabled: boolean;
}

export const ObservationSection: React.FC<ObservationSectionProps> = ({
  parsedData,
  handleParsedDataChange,
  isFormDisabled,
}) => {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label>Observações</Label>
      <Textarea
        value={parsedData.observacao || ''}
        onChange={(e) => handleParsedDataChange('observacao', e.target.value)}
        rows={3}
        disabled={isFormDisabled}
      />
    </div>
  );
};