"use client";

import * as React from "react";
import { Check, ChevronsUpDown, MapPin, History } from "lucide-react";

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
import { Input } from "@/components/ui/input";

interface CepInputWithRecentsProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  isOrigin: boolean; // To differentiate localStorage keys
}

const RECENT_CEPS_KEY_PREFIX = "recent_ceps_";
const MAX_RECENT_CEPS = 5;

export const CepInputWithRecents: React.FC<CepInputWithRecentsProps> = ({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Ex: 01000-000",
  disabled = false,
  isOrigin,
}) => {
  const [open, setOpen] = React.useState(false);
  const [recentCeps, setRecentCeps] = React.useState<string[]>([]);
  const localStorageKey = isOrigin ? `${RECENT_CEPS_KEY_PREFIX}origin` : `${RECENT_CEPS_KEY_PREFIX}destination`;

  // Load recent CEPs from localStorage on mount
  React.useEffect(() => {
    try {
      const storedCeps = localStorage.getItem(localStorageKey);
      if (storedCeps) {
        setRecentCeps(JSON.parse(storedCeps));
      }
    } catch (error) {
      console.error("Failed to load recent CEPs from localStorage:", error);
    }
  }, [localStorageKey]);

  // Save recent CEPs to localStorage when they change
  React.useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(recentCeps));
    } catch (error) {
      console.error("Failed to save recent CEPs to localStorage:", error);
    }
  }, [recentCeps, localStorageKey]);

  const addCepToRecents = React.useCallback((cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      setRecentCeps(prevCeps => {
        const newCeps = [cleanedCep, ...prevCeps.filter(c => c !== cleanedCep)];
        return newCeps.slice(0, MAX_RECENT_CEPS);
      });
    }
  }, []);

  const handleSelectRecentCep = (selectedCep: string) => {
    onChange(selectedCep); // Update the parent's state
    setOpen(false);
    // Create a synthetic event to trigger the parent's onBlur handler
    const syntheticEvent = {
      target: { value: selectedCep, id: id || '' }
    } as React.FocusEvent<HTMLInputElement>;
    onBlur(syntheticEvent); // Trigger the parent's onBlur handler
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur(e); // Call the original onBlur prop
    addCepToRecents(e.target.value); // Add current CEP to recents
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={id}
            placeholder={placeholder}
            className="pl-10 pr-10" // Adjust padding for the dropdown button
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleInputBlur}
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
            onClick={() => setOpen(prev => !prev)}
            disabled={disabled}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar CEP ou selecionar recente..." value={value} onValueChange={onChange} />
          <CommandList>
            {recentCeps.length === 0 && <CommandEmpty>Nenhum CEP recente.</CommandEmpty>}
            <CommandGroup heading="CEPs Recentes">
              {recentCeps.map((cep) => (
                <CommandItem
                  key={cep}
                  value={cep}
                  onSelect={() => handleSelectRecentCep(cep)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cep ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <History className="mr-2 h-4 w-4 text-muted-foreground" />
                  {cep}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};