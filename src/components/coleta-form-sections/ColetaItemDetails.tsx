import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/Combobox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types_generated';
import { Box, Hash, AlignLeft } from 'lucide-react'; // Adicionado Hash e AlignLeft para ícones

type Product = Tables<'products'>;

interface ColetaItemDetailsProps {
  formData: {
    modelo_aparelho: string | null;
    qtd_aparelhos_solicitado: number | null;
  };
  handleInputChange: (field: string, value: string | number | null) => void;
  handleProductComboboxSelect: (product: Product | null) => void;
  isPending: boolean;
  descricaoMaterial: string; // Nova prop para a descrição
  setDescricaoMaterial: (value: string) => void; // Nova prop para atualizar a descrição
}

export const ColetaItemDetails: React.FC<ColetaItemDetailsProps> = ({
  formData,
  handleInputChange,
  handleProductComboboxSelect,
  isPending,
  descricaoMaterial,
  setDescricaoMaterial,
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
    label: `${product.code} - ${product.description}`, // Exibe código e descrição no combobox
    data: product,
  })) || [];

  // Encontra o produto selecionado com base no código em formData.modelo_aparelho
  const selectedProduct = products?.find(p => p.code === formData.modelo_aparelho);

  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          Detalhes do Material
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-combobox">Tipo de Material</Label>
          <Combobox
            id="product-combobox"
            options={productOptions}
            value={selectedProduct?.id || ''} // O valor do Combobox é o ID do produto
            onValueChange={(value) => {
              const product = products?.find(p => p.id === value) || null;
              handleProductComboboxSelect(product); // Isso atualizará modelo_aparelho e setDescricaoMaterial no componente pai
            }}
            placeholder="Selecione ou digite o tipo de material"
            searchPlaceholder="Buscar material..."
            disabled={isPending || isLoadingProducts}
            // Exibe o código e a descrição do produto selecionado, ou apenas o código se digitado manualmente
            currentValueDisplay={selectedProduct ? `${selectedProduct.code} - ${selectedProduct.description}` : formData.modelo_aparelho || ''}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelo_aparelho">Código do Material</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="modelo_aparelho"
                placeholder="Ex: AP001"
                className="pl-10"
                value={formData.modelo_aparelho || ''}
                onChange={(e) => handleInputChange("modelo_aparelho", e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao_material">Descrição do Material</Label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="descricao_material"
                placeholder="Ex: Aparelho Celular Modelo X"
                className="pl-10"
                value={descricaoMaterial} // Usa a nova prop
                onChange={(e) => setDescricaoMaterial(e.target.value)} // Usa a nova prop
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos</Label>
          <div className="relative">
            <Box className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="qtd_aparelhos_solicitado"
              type="number"
              placeholder="1"
              min="1"
              className="pl-10"
              value={formData.qtd_aparelhos_solicitado || ''}
              onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || null)}
              disabled={isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};