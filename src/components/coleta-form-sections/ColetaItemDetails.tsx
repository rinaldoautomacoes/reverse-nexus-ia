import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProductCombobox } from "@/components/ProductCombobox";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;
type Product = Tables<'products'>;

interface ColetaItemDetailsProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  handleProductComboboxSelect: (product: Product | null) => void;
  isPending: boolean;
}

export const ColetaItemDetails: React.FC<ColetaItemDetailsProps> = ({
  formData,
  handleInputChange,
  handleProductComboboxSelect,
  isPending,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="previsao_coleta">Data da Coleta *</Label>
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
                {formData.previsao_coleta ? format(new Date(formData.previsao_coleta), "PPP", { locale: ptBR }) : "Selecionar data"}
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
        <div className="space-y-2">
          <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos *</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="qtd_aparelhos_solicitado"
              type="number"
              placeholder="1"
              className="pl-10"
              value={formData.qtd_aparelhos_solicitado || 0}
              onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || 0)}
              required
              min={1}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelo_aparelho">Tipo de Material *</Label>
        <ProductCombobox
          value={formData.modelo_aparelho || ''}
          onValueChange={(code) => handleInputChange("modelo_aparelho", code)}
          onProductSelect={handleProductComboboxSelect}
        />
      </div>
    </>
  );
};