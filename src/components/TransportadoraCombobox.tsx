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
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

type Transportadora = Tables<'transportadoras'>;

interface TransportadoraComboboxProps {
  value: string | null; // O valor é o ID da transportadora (string ou null)
  onValueChange: (id: string | null) => void;
  onTransportadoraSelect: (transportadora: Transportadora | null) => void;
  disabled?: boolean;
}

export const TransportadoraCombobox: React.FC<TransportadoraComboboxProps> = ({
  value, // Este é o ID
  onValueChange,
  onTransportadoraSelect,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth(); // Use useAuth to get the current user

  const { data: transportadoras, isLoading } = useQuery<Transportadora[], Error>({
    queryKey: ['transportadoras', user?.id], // Add user.id to queryKey for RLS
    queryFn: async () => {
      if (!user?.id) return []; // Return empty array if no user
      const { data, error } = await supabase.from('transportadoras').select('*').eq('user_id', user.id); // Filter by user_id
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id, // Only enable query if user is logged in
  });

  // Encontra o objeto transportadora selecionado com base no ID passado no prop 'value'
  const selectedTransportadoraObject = transportadoras?.find((t) => t.id === value);

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
          {selectedTransportadoraObject ? selectedTransportadoraObject.name : "Selecionar transportadora..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar transportadora..." />
          <CommandEmpty>Nenhuma transportadora encontrada.</CommandEmpty>
          <CommandGroup>
            {transportadoras?.map((transportadora) => (
              <CommandItem
                key={transportadora.id}
                value={transportadora.name || ''} // Usar o nome para pesquisa
                onSelect={() => {
                  onValueChange(transportadora.id); // Passa o ID
                  onTransportadoraSelect(transportadora); // Passa o objeto completo
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === transportadora.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {transportadora.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};