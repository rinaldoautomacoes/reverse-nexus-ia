import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ColetasFiltersProps {
  onFiltersChange: (searchTerm: string, filterDate: Date | undefined) => void;
  initialSearchTerm?: string;
  initialFilterDate?: Date;
}

export const ColetasFilters: React.FC<ColetasFiltersProps> = ({
  onFiltersChange,
  initialSearchTerm = "",
  initialFilterDate = undefined,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filterDate, setFilterDate] = useState<Date | undefined>(initialFilterDate);

  // Debounce search term to avoid excessive re-renders/queries
  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange(searchTerm, filterDate);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, filterDate, onFiltersChange]);

  return (
    <Card className="card-futuristic">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por parceiro, endereço, modelo, status, número único, controle do cliente, contrato ou CÓD. PARC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full md:w-auto justify-start text-left font-normal",
                  !filterDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? (isValid(filterDate) ? format(filterDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Filtrar por data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {filterDate && (
            <Button variant="ghost" onClick={() => setFilterDate(undefined)} className="w-full md:w-auto">
              Limpar Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};