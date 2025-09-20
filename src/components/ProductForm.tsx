import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Tag, FileText, Box, Hash, Image as ImageIcon } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type ProductInsert = TablesInsert<'products'>;
type ProductUpdate = TablesUpdate<'products'>;

interface ProductFormProps {
  initialData?: ProductUpdate;
  onSave: (data: ProductInsert | ProductUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const [formData, setFormData] = useState<ProductInsert | ProductUpdate>(initialData || {
    code: "",
    description: "",
    model: "",
    serial_number: "",
    image_url: "",
    user_id: "", // Será preenchido pela mutação
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (ProductInsert | ProductUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código do Produto *</Label>
        <div className="relative">
          <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="code"
            placeholder="Ex: PROD-001"
            className="pl-10"
            value={formData.code || ''}
            onChange={(e) => handleInputChange("code", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição do Produto</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="description"
            placeholder="Descrição detalhada do produto..."
            className="pl-10 min-h-[80px]"
            value={formData.description || ''}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <div className="relative">
            <Box className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="model"
              placeholder="Ex: XYZ-2000"
              className="pl-10"
              value={formData.model || ''}
              onChange={(e) => handleInputChange("model", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial_number">Número de Série</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="serial_number"
              placeholder="Ex: SN123456789"
              className="pl-10"
              value={formData.serial_number || ''}
              onChange={(e) => handleInputChange("serial_number", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">URL da Foto do Produto</Label>
        <div className="relative">
          <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="image_url"
            type="url"
            placeholder="https://exemplo.com/foto-produto.jpg"
            className="pl-10"
            value={formData.image_url || ''}
            onChange={(e) => handleInputChange("image_url", e.target.value)}
          />
        </div>
        {formData.image_url && (
          <div className="mt-2">
            <img src={formData.image_url} alt="Pré-visualização do produto" className="max-w-xs h-auto rounded-md border border-border" />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          disabled={isPending}
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Package className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Produto"}
        </Button>
      </div>
    </form>
  );
};