import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProductCombobox } from '@/components/ProductCombobox';
import type { ParsedCollectionData, ParsedItem } from '@/lib/document-parser';
import type { Tables } from '@/integrations/supabase/types_generated';

type Product = Tables<'products'>;

interface MainProductAndDateSectionProps {
  parsedData: ParsedCollectionData;
  handleParsedDataChange: (field: keyof ParsedCollectionData, value: any) => void;
  isFormDisabled: boolean;
}

export const MainProductAndDateSection: React.FC<MainProductAndDateSectionProps> = ({
  parsedData,
  handleParsedDataChange,
  isFormDisabled,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Previsão de Coleta *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !parsedData.previsao_coleta && "text-muted-foreground"
              )}
              disabled={isFormDisabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {parsedData.previsao_coleta ? format(parseISO(parsedData.previsao_coleta), "PPP", { locale: ptBR }) : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={parsedData.previsao_coleta ? parseISO(parsedData.previsao_coleta) : undefined}
              onSelect={(date) => handleParsedDataChange("previsao_coleta", date ? format(date, 'yyyy-MM-dd') : null)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>Técnico Responsável</Label>
        <Input
          value={parsedData.responsavel || ''}
          onChange={(e) => handleParsedDataChange('responsavel', e.target.value)}
          disabled={isFormDisabled}
        />
      </div>
      <div className="space-y-2">
        <Label>Código do Produto Principal</Label>
        <ProductCombobox
          value={parsedData.modelo_aparelho || ''}
          onValueChange={(code) => handleParsedDataChange('modelo_aparelho', code)}
          onProductSelect={(product) => {
            if (product) {
              handleParsedDataChange('modelo_aparelho', product.code);
              handleParsedDataChange('modelo_aparelho_description', product.description);
            } else {
              handleParsedDataChange('modelo_aparelho', null);
              handleParsedDataChange('modelo_aparelho_description', null);
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição do Produto Principal</Label>
        <Input
          value={parsedData.modelo_aparelho_description || ''}
          onChange={(e) => handleParsedDataChange('modelo_aparelho_description', e.target.value)}
          disabled={isFormDisabled}
        />
      </div>
    </div>
  );
};