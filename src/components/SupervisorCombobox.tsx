"use client";

import * as React from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";

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
  onValueChange: (supervisorId: string | null) => void; // Callback para atualizar o ID do supervisor
  onSupervisorSelect?: (supervisorProfile: Profile | null) => void; // Optional callback for full profile object
  disabled?: boolean;
  excludeUserId?: string | null; // Optional: exclude a specific user from the list (e.g., the user being edited)
}

export const SupervisorCombobox: React.FC<SupervisorComboboxProps> = ({
  value,
  onValueChange,
  onSupervisorSelect,
  disabled = false,
  excludeUserId = null,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const { user: currentUser } = useAuth();

  const { data: profiles, isLoading, error } = useQuery<Profile[], Error>({
    queryKey: ['allProfilesForSupervisor', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('supervisor_id', null) // Filtra para mostrar apenas perfis que são supervisores (não têm supervisor)
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Filter out the excluded user and the current user if they are not supervisors
  const availableSupervisors = React.useMemo(() => {
    return profiles?.filter(profile => 
      profile.id !== excludeUserId && profile.id !== currentUser?.id // Exclude self and the user being edited
    ) || [];
  }, [profiles, excludeUserId, currentUser?.id]);

  // Sync inputValue with the selected supervisor's name
  React.useEffect(() => {
    if (value && availableSupervisors) {
      const selectedProfile = availableSupervisors.find(profile => profile.id === value);
      if (selectedProfile) {
        setInputValue(`${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim());
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value, availableSupervisors]);

  const handleSelect = (profileId: string) => {
    const selectedProfile = availableSupervisors.find((profile) => profile.id === profileId) || null;
    if (selectedProfile) {
      setInputValue(`${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim());
      onValueChange(selectedProfile.id);
      onSupervisorSelect?.(selectedProfile);
    } else {
      setInputValue("");
      onValueChange(null);
      onSupervisorSelect?.(null);
    }
    setOpen(false);
  };

  const handleInputChange = (currentSearch: string) => {
    setInputValue(currentSearch);
    // Se o usuário está digitando e o texto não corresponde a um supervisor existente,
    // o valor do supervisor_id deve ser null.
    const matchedProfile = availableSupervisors.find(profile => 
      `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase().includes(currentSearch.toLowerCase())
    );
    if (!matchedProfile && currentSearch.trim() === "") { // Só limpa se o input estiver vazio e não houver correspondência
      onValueChange(null);
      onSupervisorSelect?.(null);
    }
  };

  // Refined display logic for the button trigger
  const selectedSupervisor = availableSupervisors.find(p => p.id === value);
  const buttonDisplayContent = selectedSupervisor 
    ? (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={selectedSupervisor.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground"> {/* Adicionado estilo explícito */}
            {selectedSupervisor.first_name?.charAt(0) || 'U'} {/* Fallback para 'U' se first_name estiver vazio */}
          </AvatarFallback>
        </Avatar>
        {`${selectedSupervisor.first_name || ''} ${selectedSupervisor.last_name || ''}`.trim()}
      </div>
    ) : (
      inputValue || "Selecionar supervisor..."
    );

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
          {buttonDisplayContent} {/* Usa o conteúdo refinado */}
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
            {!isLoading && !error && availableSupervisors.length === 0 && (
              <CommandEmpty>Nenhum supervisor encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {availableSupervisors?.filter(profile => 
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
                    <AvatarFallback className="bg-primary text-primary-foreground"> {/* Adicionado estilo explícito */}
                      {profile.first_name?.charAt(0) || 'U'}
                    </AvatarFallback>
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