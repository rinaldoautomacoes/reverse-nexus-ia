"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = Tables<'profiles'>;

interface SupervisorComboboxProps {
  value: string | null; // O ID do supervisor atualmente selecionado
  onValueChange: (supervisorId: string | null) => void; // Callback para atualizar o ID do supervisor no formulário
  onSupervisorSelect: (supervisorProfile: Profile | null) => void; // Callback para retornar o objeto de perfil completo
  disabled?: boolean;
}

export const SupervisorCombobox: React.FC<SupervisorComboboxProps> = ({
  value,
  onValueChange,
  onSupervisorSelect,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(""); // Estado interno para o CommandInput, exibe o nome
  const { user: currentUser } = useAuth();

  const { data: supervisors, isLoading, error } = useQuery<Profile[], Error>({
    queryKey: ['supervisorsList', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'supervisor') // Filtrar apenas por perfis com a função 'supervisor'
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Sincroniza inputValue interno com a prop value externa (ID do usuário)
  React.useEffect(() => {
    if (value && supervisors) {
      const selectedSupervisor = supervisors.find(profile => profile.id === value);
      if (selectedSupervisor) {
        setInputValue(`${selectedSupervisor.first_name || ''} ${selectedSupervisor.last_name || ''}`.trim());
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value, supervisors]);

  const handleSelect = (profileId: string) => {
    const selectedSupervisor = supervisors?.find((profile) => profile.id === profileId) || null;
    if (selectedSupervisor) {
      setInputValue(`${selectedSupervisor.first_name || ''} ${selectedSupervisor.last_name || ''}`.trim());
      onValueChange(selectedSupervisor.id);
      onSupervisorSelect(selectedSupervisor);
    } else {
      setInputValue("");
      onValueChange(null);
      onSupervisorSelect(null);
    }
    setOpen(false);
  };

  const handleInputChange = (currentSearch: string) => {
    setInputValue(currentSearch);
    // Não atualiza o valor do formulário pai diretamente aqui, apenas quando um item é selecionado
    // ou se o usuário limpar a seleção.
  };

  const displayValue = value && supervisors ? 
    supervisors.find(p => p.id === value)?.first_name || "Selecionar supervisor..." : 
    "Selecionar supervisor...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between pl-10"
          disabled={disabled || isLoading}
        >
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {value && supervisors ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={supervisors.find(p => p.id === value)?.avatar_url || undefined} />
                <AvatarFallback>
                  {supervisors.find(p => p.id === value)?.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {`${supervisors.find(p => p.id === value)?.first_name || ''} ${supervisors.find(p => p.id === value)?.last_name || ''}`.trim()}
            </div>
          ) : (
            "Selecionar supervisor..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar supervisor..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Carregando supervisores...</CommandEmpty>}
            {error && <CommandEmpty>Erro ao carregar supervisores.</CommandEmpty>}
            {!isLoading && !error && supervisors?.length === 0 && (
              <CommandEmpty>Nenhum supervisor encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {supervisors?.filter(profile => 
                `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase().includes(inputValue.toLowerCase())
              ).map((profile) => (
                <CommandItem
                  key={profile.id}
                  value={`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}
                  onSelect={() => handleSelect(profile.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === profile.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.first_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};