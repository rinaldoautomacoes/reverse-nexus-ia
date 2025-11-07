import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, FileText, Tag, Clock, CheckCircle, XCircle } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";

type OutstandingCollectionItemInsert = TablesInsert<'outstanding_collection_items'>;
type OutstandingCollectionItemUpdate = TablesUpdate<'outstanding_collection_items'>;

interface OutstandingCollectionItemFormProps {
  initialData?: OutstandingCollectionItemUpdate;
  onSave: (data: OutstandingCollectionItemInsert | OutstandingCollectionItemUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const OutstandingCollectionItemForm: React.FC<OutstandingCollectionItemFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<OutstandingCollectionItemInsert | OutstandingCollectionItemUpdate>(initialData || {
    product_code: "",
    product_description: "",
    quantity_pending: 0,
    notes: "",
    status: "pendente",
    user_id: "", // Will be filled by mutation
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        product_code: "",
        product_description: "",
        quantity_pending: 0,
        notes: "",
        status: "pendente",
        user_id: "",
      });
    }
  }, [initialData]);

  const handleInputChange = useCallback((field: keyof (OutstandingCollectionItemInsert | OutstandingCollectionItemUpdate), value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_code || formData.product_code.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O código do produto é obrigatório.", variant: "destructive" });
      return;
    }
    if (formData.quantity_pending === null || formData.quantity_pending <= 0) {
      toast({ title: "Campo Obrigatório", description: "A quantidade pendente deve ser maior que zero.", variant: "destructive" });
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product_code">Código do Produto *</Label>
        <div className="relative">
          <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="product_code"
            placeholder="Ex: 46472"
            className="pl-10"
            value={formData.product_code || ''}
            onChange={(e) => handleInputChange("product_code", e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_description">Descrição do Produto</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="product_description"
            placeholder="Ex: OPENSCAPE DESK PHONE CP 205"
            className="pl-10"
            value={formData.product_description || ''}
            onChange={(e) => handleInputChange("product_description", e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity_pending">Quantidade Pendente *</Label>
          <div className="relative">
            <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="quantity_pending"
              type="number"
              min="1"
              placeholder="0"
              className="pl-10"
              value={formData.quantity_pending || ''}
              onChange={(e) => handleInputChange("quantity_pending", parseInt(e.target.value) || 0)}
              required
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'pendente'}
            onValueChange={(value) => handleInputChange("status", value)}
            disabled={isPending}
          >
            <SelectTrigger className="pl-10">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="coletado">Coletado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionais sobre o item pendente..."
          value={formData.notes || ''}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          rows={3}
          disabled={isPending}
        />
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Package className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Item Pendente"}
        </Button>
      </div>
    </form>
  );
};