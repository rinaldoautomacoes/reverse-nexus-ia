"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Truck, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";

type Driver = Tables<'drivers'>;

interface DriverComboboxProps {
  value: string | null; // O ID do motorista atualmente selecionado
  onValueChange: (driverId: string | null) => void; // Callback para atualizar o ID do motorista no formulário
  onDriverSelect: (driver: Driver | null) => void; // Callback para retornar o objeto motorista completo
}

export const DriverCombobox: React.FC<DriverComboboxProps> = ({
  value,
  onValueChange,
  onDriverSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(""); // Estado interno para o CommandInput, exibe o nome
  const { user } = useAuth();

  const { data: drivers, isLoading, error } = useQuery<Driver[], Error>({
    queryKey: ['drivers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  // Sincroniza inputValue interno com a prop value externa (ID do motorista)
  React.useEffect(() => {
    if (value && drivers) {
      const selectedDriver = drivers.find(driver => driver.id === value);
      if (selectedDriver) {
        setInputValue(selectedDriver.name);
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value, drivers]);

  const handleSelect = (driverId: string) => {
    const selectedDriver = drivers?.find((driver) => driver.id === driverId) || null;
    if (selectedDriver) {
      setInputValue(selectedDriver.name);
      onValueChange(selectedDriver.id);
      onDriverSelect(selectedDriver);
    } else {
      setInputValue("");
      onValueChange(null);
      onDriverSelect(null);
    }
    setOpen(false);
  };

  const handleInputChange = (currentSearch: string) => {
    setInputValue(currentSearch);
    // Não atualiza o valor do formulário pai diretamente aqui, apenas quando um item é selecionado
    // ou se o usuário limpar a seleção.
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between pl-10"
          disabled={isLoading}
        >
          <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {value && drivers ? (
            drivers.find(d => d.id === value)?.name || "Selecionar motorista..."
          ) : (
            "Selecionar motorista..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar motorista..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Carregando motoristas...</CommandEmpty>}
            {error && <CommandEmpty>Erro ao carregar motoristas.</CommandEmpty>}
            {!isLoading && !error && drivers?.length === 0 && (
              <CommandEmpty>Nenhum motorista encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {drivers?.filter(driver => 
                driver.name.toLowerCase().includes(inputValue.toLowerCase())
              ).map((driver) => (
                <CommandItem
                  key={driver.id}
                  value={driver.name}
                  onSelect={() => handleSelect(driver.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === driver.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {driver.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};