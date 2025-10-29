import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Tables } from "@/integrations/supabase/types_generated";

type Driver = Tables<'drivers'>;

interface DriverComboboxProps {
  value: string | null; // O valor é o ID do motorista (string ou null)
  onValueChange: (id: string | null) => void;
  onDriverSelect: (driver: Driver | null) => void;
  disabled?: boolean;
}

export const DriverCombobox: React.FC<DriverComboboxProps> = ({
  value, // Este é o ID
  onValueChange,
  onDriverSelect,
  disabled,
}) => {
  const [open, setOpen] = useState(false);

  const { data: drivers, isLoading } = useQuery<Driver[], Error>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Encontra o objeto motorista selecionado com base no ID passado no prop 'value'
  const selectedDriverObject = drivers?.find((driver) => driver.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {selectedDriverObject ? selectedDriverObject.name : "Selecionar motorista..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar motorista..." />
          <CommandEmpty>Nenhum motorista encontrado.</CommandEmpty>
          <CommandGroup>
            {drivers?.map((driver) => (
              <CommandItem
                key={driver.id}
                value={driver.name || ''} // Usar o nome para pesquisa
                onSelect={() => {
                  onValueChange(driver.id); // Passa o ID
                  onDriverSelect(driver); // Passa o objeto completo
                  setOpen(false);
                }}
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
        </Command>
      </PopoverContent>
    </Popover>
  );
};