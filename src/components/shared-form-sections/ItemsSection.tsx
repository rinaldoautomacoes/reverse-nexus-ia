import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItemRow, ItemData } from './ItemRow'; // Importa o componente renomeado

interface ItemsSectionProps {
  onItemsUpdate: (items: ItemData[]) => void;
  isPending: boolean;
  initialItems?: ItemData[]; // Para pré-preencher se necessário (ex: edição)
}

export const ItemsSection: React.FC<ItemsSectionProps> = ({
  onItemsUpdate,
  isPending,
  initialItems = [],
}) => {
  const [items, setItems] = useState<ItemData[]>(initialItems.length > 0 ? initialItems : [
    { id: crypto.randomUUID(), modelo_aparelho: null, qtd_aparelhos_solicitado: 1, descricaoMaterial: "" }
  ]);

  useEffect(() => {
    onItemsUpdate(items);
  }, [items, onItemsUpdate]);

  const handleAddItem = useCallback(() => {
    setItems(prevItems => [
      ...prevItems,
      { id: crypto.randomUUID(), modelo_aparelho: null, qtd_aparelhos_solicitado: 1, descricaoMaterial: "" }
    ]);
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof ItemData, value: string | number | null) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      // Garante que o valor numérico seja tratado corretamente
      if (field === "qtd_aparelhos_solicitado" && typeof value === 'string') {
        newItems[index] = { ...newItems[index], [field]: parseInt(value) || null };
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      return newItems;
    });
  }, []);

  const handleItemDelete = useCallback((index: number) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  }, []);

  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          Detalhes dos Materiais
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            onItemChange={handleItemChange}
            onItemDelete={handleItemDelete}
            isPending={isPending}
          />
        ))}
        <Button
          variant="outline"
          onClick={handleAddItem}
          disabled={isPending}
          className="w-full flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Adicionar Item
        </Button>
      </CardContent>
    </Card>
  );
};