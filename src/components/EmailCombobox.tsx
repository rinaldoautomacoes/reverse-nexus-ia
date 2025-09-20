import * as React from "react";
import { Check, ChevronsUpDown, Mail, XCircle } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";

interface EmailComboboxProps {
  value: string; // The currently selected email (from parent state)
  onValueChange: (value: string) => void; // Callback to update parent state
  recentEmails: string[];
  onClearRecentEmails: () => void;
}

export const EmailCombobox: React.FC<EmailComboboxProps> = ({
  value,
  onValueChange,
  recentEmails,
  onClearRecentEmails,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value); // Internal state for the CommandInput
  const { toast } = useToast();

  // Sync internal inputValue with external value prop
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (currentValue: string) => {
    setInputValue(currentValue); // Update internal input value
    onValueChange(currentValue); // Update parent's email state
    setOpen(false);
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing popover
    onClearRecentEmails();
    setInputValue(""); // Clear internal input value
    toast({
      title: "Histórico Limpo",
      description: "O histórico de e-mails recentes foi removido.",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between pl-10"
        >
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {value ? value : "seu@email.com"} {/* Display selected value or placeholder */}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar e-mail ou digitar novo..."
            value={inputValue} // Use internal state for CommandInput
            onValueChange={(currentSearch) => {
              setInputValue(currentSearch); // Update internal state as user types
              onValueChange(currentSearch); // Also update parent's email state immediately
            }}
          />
          <CommandList>
            <CommandEmpty>Nenhum e-mail encontrado.</CommandEmpty>
            <CommandGroup>
              {recentEmails.length > 0 ? ( // Only show "Recent Emails" group if there are any
                <>
                  {recentEmails.map((emailItem) => (
                    <CommandItem
                      key={emailItem}
                      value={emailItem}
                      onSelect={() => handleSelect(emailItem)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === emailItem ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {emailItem}
                    </CommandItem>
                  ))}
                  <CommandItem onSelect={handleClearRecent} className="text-destructive hover:bg-destructive/10">
                    <XCircle className="mr-2 h-4 w-4" />
                    Limpar Histórico
                  </CommandItem>
                </>
              ) : (
                <CommandItem disabled>Nenhum e-mail recente</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};