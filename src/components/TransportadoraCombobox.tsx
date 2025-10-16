"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building, PlusCircle } from "lucide-react";

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

type Transportadora = Tables<'transportadoras'>;

interface TransportadoraComboboxProps {
  value: string | null; // O ID da transportadora atualmente selecionada
  onValueChange: (transportadoraId: string | null) => void; // Callback para atualizar o ID da transportadora no formulário
  onTransportadoraSelect: (transportadora: Transportadora | null) => void; // Callback para retornar o objeto transportadora completo
}

export const TransportadoraCombobox: React.FC<TransportadoraComboboxProps> = ({
  value,
  onValueChange,
  onTransportadoraSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(""); // Estado interno para o CommandInput, exibe o nome
  const { user } = useAuth();

  const { data: transportadoras, isLoading, error } = useQuery<Transportadora[], Error>({
    queryKey: ['transportadoras', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transportadoras')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  // Sincroniza inputValue interno com a prop value externa (ID da transportadora)
  React.useEffect(() => {
    if (value && transportadoras) {
      const selectedTransportadora = transportadoras.find(t => t.id === value);
      if (selectedTransportadora) {
        setInputValue(selectedTransportadora.name);
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value, transportadoras]);

  const handleSelect = (transportadoraId: string) => {
    const selectedTransportadora = transportadoras?.find((t) => t.id === transportadoraId) || null;
    if (selectedTransportadora) {
      setInputValue(selectedTransportadora.name);
      onValueChange(selectedTransportadora.id);
      onTransportadoraSelect(selectedTransportadora);
    } else {
      setInputValue("");
      onValueChange(null);
      onTransportadoraSelect(null);
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
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {value && transportadoras ? (
            transportadoras.find(t => t.id === value)?.name || "Selecionar transportadora..."
          ) : (
            "Selecionar transportadora..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar transportadora..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Carregando transportadoras...</CommandEmpty>}
            {error && <CommandEmpty>Erro ao carregar transportadoras.</CommandEmpty>}
            {!isLoading && !error && transportadoras?.length === 0 && (
              <CommandEmpty>Nenhuma transportadora encontrada.</CommandEmpty>
            )}
            <CommandGroup>
              {transportadoras?.filter(transportadora => 
                transportadora.name.toLowerCase().includes(inputValue.toLowerCase())
              ).map((transportadora) => (
                <CommandItem
                  key={transportadora.id}
                  value={transportadora.name}
                  onSelect={() => handleSelect(transportadora.id)}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};