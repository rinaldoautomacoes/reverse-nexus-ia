import React from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Removido CardHeader e CardTitle
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/Combobox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types_generated';
import { Box, Hash, AlignLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Product = Tables<'products'>;

export interface ItemData {
  id: string; // ID temporário para gerenciamento local da lista
  modelo_aparelho: string | null; // Código do material
  qtd_aparelhos_solicitado: number | null; // Quantidade
  descricaoMaterial: string; // Descrição do material (local, não persistente)
}

interface ItemRowProps {
  item: ItemData;
  index: number;
  onItemChange: (index: number, field: keyof ItemData, value: string | number | null) => void;
  onItemDelete: (index: number) => void;
  isPending: boolean;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  onItemChange,
  onItemDelete,
  isPending,
}) => {
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    },
  });

  const productOptions = products?.map(product => ({
    value: product.id,
    label: `${product.code} - ${product.description}`,
    data: product,
  })) || [];

  const selectedProduct = products?.find(p => p.code === item.modelo_aparelho);

  const handleProductComboboxSelect = (productId: string | null) => {
    const product = products?.find(p => p.id === productId) || null;
    if (product) {
      onItemChange(index, "modelo_aparelho", product.code);
      onItemChange(index, "descricaoMaterial", product.description || "");
    } else {
      onItemChange(index, "modelo_aparelho", "");
      onItemChange(index, "descricaoMaterial", "");
    }
  };

  return (
    <Card className="card-futuristic p-4 mb-4">
      <CardContent className="p-0 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold text-primary">Item #{index + 1}</h4>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onItemDelete(index)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir Item
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`product-combobox-${item.id}`}>Tipo de Material</Label>
          <Combobox
            id={`product-combobox-${item.id}`}
            options={productOptions}
            value={selectedProduct?.id || ''}
            onValueChange={handleProductComboboxSelect}
            placeholder="Selecione ou digite o tipo de material"
            searchPlaceholder="Buscar material..."
            disabled={isPending || isLoadingProducts}
            currentValueDisplay={selectedProduct ? `${selectedProduct.code} - ${selectedProduct.description}` : item.modelo_aparelho || ''}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`modelo_aparelho-${item.id}`}>Código do Material</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id={`modelo_aparelho-${item.id}`}
                placeholder="Ex: AP001"
                className="pl-10"
                value={item.modelo_aparelho || ''}
                onChange={(e) => onItemChange(index, "modelo_aparelho", e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`descricao_material-${item.id}`}>Descrição do Material</Label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id={`descricao_material-${item.id}`}
                placeholder="Ex: Aparelho Celular Modelo X"
                className="pl-10"
                value={item.descricaoMaterial}
                onChange={(e) => onItemChange(index, "descricaoMaterial", e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`qtd_aparelhos_solicitado-${item.id}`}>Quantidade</Label>
            <div className="relative">
              <Box className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id={`qtd_aparelhos_solicitado-${item.id}`}
                type="number"
                placeholder="1"
                min="1"
                className="pl-10"
                value={item.qtd_aparelhos_solicitado || ''}
                onChange={(e) => onItemChange(index, "qtd_aparelhos_solicitado", parseInt(e.target.value) || null)}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};