import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EntregasFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterDate: Date | undefined;
  setFilterDate: (date: Date | undefined) => void;
  isFormDisabled: boolean;
}

export const EntregasFilters: React.FC<EntregasFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterDate,
  setFilterDate,
  isFormDisabled,
}) => {
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
              disabled={isFormDisabled}
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
                disabled={isFormDisabled}
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
            <Button variant="ghost" onClick={() => setFilterDate(undefined)} className="w-full md:w-auto" disabled={isFormDisabled}>
              Limpar Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};