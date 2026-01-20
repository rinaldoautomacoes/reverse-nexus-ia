import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;

interface DateSelectionSectionProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | null) => void;
  isPending: boolean;
  type: 'coleta' | 'entrega'; // Para ajustar os labels
}

export const DateSelectionSection: React.FC<DateSelectionSectionProps> = ({
  formData,
  handleInputChange,
  isPending,
  type,
}) => {
  const previsaoLabel = type === 'coleta' ? 'Previsão de Coleta' : 'Previsão de Entrega';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="data_solicitacao">Data da Solicitação</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal pl-10",
                !formData.created_at && "text-muted-foreground"
              )}
              disabled={isPending}
            >
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              {formData.created_at ? (isValid(new Date(formData.created_at)) ? format(new Date(formData.created_at), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.created_at ? new Date(formData.created_at) : undefined}
              onSelect={(date) => handleInputChange("created_at", date ? format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX") : null)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label htmlFor="previsao_coleta">{previsaoLabel} *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal pl-10",
                !formData.previsao_coleta && "text-muted-foreground"
              )}
              disabled={isPending}
            >
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              {formData.previsao_coleta ? (isValid(new Date(formData.previsao_coleta)) ? format(new Date(formData.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.previsao_coleta ? new Date(formData.previsao_coleta) : undefined}
              onSelect={(date) => handleInputChange("previsao_coleta", date ? format(date, 'yyyy-MM-dd') : null)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};