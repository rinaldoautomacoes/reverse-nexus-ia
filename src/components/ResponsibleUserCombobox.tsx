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

interface ResponsibleUserComboboxProps {
  value: string | null; // O ID do usuário atualmente selecionado
  onValueChange: (userId: string | null) => void; // Callback para atualizar o ID do usuário no formulário
  onUserSelect: (userProfile: Profile | null) => void; // Callback para retornar o objeto de perfil completo
}

export const ResponsibleUserCombobox: React.FC<ResponsibleUserComboboxProps> = ({
  value,
  onValueChange,
  onUserSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(""); // Estado interno para o CommandInput, exibe o nome
  const { user: currentUser } = useAuth();

  const { data: profiles, isLoading, error } = useQuery<Profile[], Error>({
    queryKey: ['responsibleUsers', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Sincroniza inputValue interno com a prop value externa (ID do usuário)
  React.useEffect(() => {
    if (value && profiles) {
      const selectedProfile = profiles.find(profile => profile.id === value);
      if (selectedProfile) {
        setInputValue(`${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim());
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value, profiles]);

  const handleSelect = (profileId: string) => {
    const selectedProfile = profiles?.find((profile) => profile.id === profileId) || null;
    if (selectedProfile) {
      setInputValue(`${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim());
      onValueChange(selectedProfile.id);
      onUserSelect(selectedProfile);
    } else {
      setInputValue("");
      onValueChange(null);
      onUserSelect(null);
    }
    setOpen(false);
  };

  const handleInputChange = (currentSearch: string) => {
    setInputValue(currentSearch);
    // Não atualiza o valor do formulário pai diretamente aqui, apenas quando um item é selecionado
    // ou se o usuário limpar a seleção.
    // onValueChange(null); // Limpa a seleção se o usuário estiver digitando um novo
    // onUserSelect(null);
  };

  const displayValue = value && profiles ? 
    profiles.find(p => p.id === value)?.first_name || "Selecionar responsável..." : 
    "Selecionar responsável...";

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
          {value && profiles ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={profiles.find(p => p.id === value)?.avatar_url || undefined} />
                <AvatarFallback>
                  {profiles.find(p => p.id === value)?.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {`${profiles.find(p => p.id === value)?.first_name || ''} ${profiles.find(p => p.id === value)?.last_name || ''}`.trim()}
            </div>
          ) : (
            "Selecionar responsável..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar responsável..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Carregando usuários...</CommandEmpty>}
            {error && <CommandEmpty>Erro ao carregar usuários.</CommandEmpty>}
            {!isLoading && !error && profiles?.length === 0 && (
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {profiles?.filter(profile => 
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
            {/* Não permitir adicionar novo usuário por aqui, apenas selecionar existentes */}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};