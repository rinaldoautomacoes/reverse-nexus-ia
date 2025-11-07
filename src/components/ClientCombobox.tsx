import * as React from "react";
import { Check, ChevronsUpDown, User, PlusCircle } from "lucide-react";

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

type Client = Tables<'clients'>;

interface ClientComboboxProps {
  value: string; // O nome do cliente atualmente selecionado/digitado
  onValueChange: (name: string) => void; // Callback para atualizar o nome do cliente no formulário
  onClientSelect: (client: Client | null) => void; // Callback para retornar o objeto cliente completo
}

export const ClientCombobox: React.FC<ClientComboboxProps> = ({
  value,
  onValueChange,
  onClientSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value); // Estado interno para o CommandInput
  const { user } = useAuth();

  // Sincroniza inputValue interno com a prop value externa
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const { data: clients, isLoading, error } = useQuery<Client[], Error>({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSelect = (clientName: string) => {
    const selectedClient = clients?.find((client) => client.name === clientName) || null;
    setInputValue(clientName);
    onValueChange(clientName);
    onClientSelect(selectedClient);
    setOpen(false);
  };

  const handleInputChange = (currentSearch: string) => {
    setInputValue(currentSearch);
    onValueChange(currentSearch); // Atualiza o valor no formulário pai enquanto o usuário digita
    onClientSelect(null); // Limpa o cliente selecionado se o usuário estiver digitando um novo
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
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {value ? value : "Selecionar cliente..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar cliente ou digitar novo..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Carregando clientes...</CommandEmpty>}
            {error && <CommandEmpty>Erro ao carregar clientes.</CommandEmpty>}
            {!isLoading && !error && clients?.length === 0 && (
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {clients?.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => handleSelect(client.name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {inputValue && !clients?.some(c => c.name === inputValue) && (
              <CommandGroup heading="Novo Cliente">
                <CommandItem
                  onSelect={() => handleSelect(inputValue)}
                  className="text-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar "{inputValue}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};