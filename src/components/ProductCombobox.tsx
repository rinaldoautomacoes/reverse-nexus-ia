"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Package, PlusCircle } from "lucide-react";

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
import { useAuth } from "@/hooks/useAuth";

type Product = Tables<'products'>;

interface ProductComboboxProps {
  value: string; // O código do produto atualmente selecionado/digitado
  onValueChange: (code: string) => void; // Callback para atualizar o código do produto no formulário
  onProductSelect: (product: Product | null) => void; // Callback para retornar o objeto produto completo
}

export const ProductCombobox: React.FC<ProductComboboxProps> = ({
  value,
  onValueChange,
  onProductSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value); // Estado interno para o CommandInput
  const { user } = useAuth();

  // Sincroniza inputValue interno com a prop value externa
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const { data: products, isLoading, error } = useQuery<Product[], Error>({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('code', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSelect = (productCode: string) => {
    const selectedProduct = products?.find((product) => product.code === productCode) || null;
    setInputValue(productCode);
    onValueChange(productCode);
    onProductSelect(selectedProduct);
    setOpen(false);
  };

  const handleInputChange = (currentSearch: string) => {
    setInputValue(currentSearch);
    onValueChange(currentSearch); // Atualiza o valor no formulário pai enquanto o usuário digita
    onProductSelect(null); // Limpa o produto selecionado se o usuário estiver digitando um novo
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
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {value ? value : "Selecionar produto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar produto ou digitar novo..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Carregando produtos...</CommandEmpty>}
            {error && <CommandEmpty>Erro ao carregar produtos.</CommandEmpty>}
            {!isLoading && !error && products?.length === 0 && (
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {products?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.code}
                  onSelect={() => handleSelect(product.code)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {product.code} - {product.description}
                </CommandItem>
              ))}
            </CommandGroup>
            {/* Permitir adicionar um novo produto digitando, se não existir */}
            {inputValue && !products?.some(p => p.code === inputValue) && (
              <CommandGroup heading="Novo Produto">
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