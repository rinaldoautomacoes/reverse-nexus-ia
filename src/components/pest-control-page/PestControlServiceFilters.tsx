import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Enums } from "@/integrations/supabase/types_generated";

interface PestControlServiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterDate: Date | undefined;
  setFilterDate: (date: Date | undefined) => void;
  filterStatus: Enums<'pest_service_status'> | 'all';
  setFilterStatus: (status: Enums<'pest_service_status'> | 'all') => void;
  filterPriority: Enums<'pest_service_priority'> | 'all';
  setFilterPriority: (priority: Enums<'pest_service_priority'> | 'all') => void;
}

export const PestControlServiceFilters: React.FC<PestControlServiceFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterDate,
  setFilterDate,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
}) => {
  // Debounce search term to avoid excessive re-renders/queries
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchTerm, setSearchTerm]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);


  return (
    <Card className="card-futuristic">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por cliente, endereço, pragas, técnico ou observações..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
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
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Enums<'pest_service_status'> | 'all')}
            className="h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full md:w-auto"
          >
            <option value="all">Todos os Status</option>
            <option value="agendado">Agendado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Enums<'pest_service_priority'> | 'all')}
            className="h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full md:w-auto"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="normal">Normal</option>
            <option value="urgente">Urgente</option>
            <option value="contrato">Contrato</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
};