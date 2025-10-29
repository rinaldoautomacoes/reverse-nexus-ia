import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package, PlusCircle, XCircle } from 'lucide-react';
import type { ParsedCollectionData, ParsedItem } from '@/lib/document-parser';

interface ItemsTableSectionProps {
  parsedData: ParsedCollectionData;
  handleItemChange: (index: number, field: keyof ParsedItem, value: any) => void;
  handleAddItem: () => void;
  handleRemoveItem: (index: number) => void;
  isFormDisabled: boolean;
}

export const ItemsTableSection: React.FC<ItemsTableSectionProps> = ({
  parsedData,
  handleItemChange,
  handleAddItem,
  handleRemoveItem,
  isFormDisabled,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold mt-6 flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        Itens para Coleta
      </h3>
      <div className="max-h-60 overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código do Item</TableHead>
              <TableHead>Descrição do Item</TableHead>
              <TableHead className="w-[100px] text-right">Quantidade</TableHead>
              <TableHead className="w-[50px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parsedData.items.length > 0 ? (
              parsedData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.product_code}
                      onChange={(e) => handleItemChange(index, 'product_code', e.target.value)}
                      disabled={isFormDisabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.product_description}
                      onChange={(e) => handleItemChange(index, 'product_description', e.target.value)}
                      disabled={isFormDisabled}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      disabled={isFormDisabled}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isFormDisabled}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  Nenhum item adicionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-start items-center mt-4">
        <Button
          variant="outline"
          onClick={handleAddItem}
          disabled={isFormDisabled}
          className="border-primary text-primary hover:bg-primary/10"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Item
        </Button>
      </div>
    </>
  );
};