import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, FileText, Package, PlusCircle, XCircle, Tag } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type DebtRecordInsert = TablesInsert<'debt_records'>;
type DebtRecordUpdate = TablesUpdate<'debt_records'>;

interface DebtItem {
  id: string; // Local ID for UI management
  code: string;
  description: string;
  quantity: number;
}

interface DebtRecordFormProps {
  initialData?: DebtRecordUpdate;
  onSave: (data: DebtRecordInsert | DebtRecordUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const DebtRecordForm: React.FC<DebtRecordFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<DebtRecordInsert | DebtRecordUpdate>(initialData || {
    title: "",
    amount: 0,
    notes: "",
    item_details: [],
    status: "pendente",
    user_id: user?.id || "", // Will be filled by mutation
  });
  const [debtItems, setDebtItems] = useState<DebtItem[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setDebtItems((initialData.item_details as DebtItem[]) || []);
    } else {
      setFormData(prev => ({
        ...prev,
        user_id: user?.id || "",
      }));
      setDebtItems([]);
    }
  }, [initialData, user?.id]);

  const handleInputChange = useCallback((field: keyof (DebtRecordInsert | DebtRecordUpdate), value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDebtItemChange = useCallback((index: number, field: keyof DebtItem, value: string | number) => {
    setDebtItems(prevItems => {
      const newItems = [...prevItems];
      if (newItems[index]) {
        (newItems[index] as any)[field] = value;
      }
      return newItems;
    });
  }, []);

  const handleAddDebtItem = useCallback(() => {
    setDebtItems(prevItems => [
      ...prevItems,
      { id: crypto.randomUUID(), code: '', description: '', quantity: 1 }
    ]);
  }, []);

  const handleRemoveDebtItem = useCallback((idToRemove: string) => {
    setDebtItems(prevItems => prevItems.filter(item => item.id !== idToRemove));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.title.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O título do saldo devedor é obrigatório.", variant: "destructive" });
      return;
    }
    if (formData.amount === null || formData.amount <= 0) {
      toast({ title: "Campo Obrigatório", description: "O valor do saldo devedor deve ser maior que zero.", variant: "destructive" });
      return;
    }

    const itemsWithValidQuantity = debtItems.filter(item => item.code.trim() !== '' && item.quantity > 0);

    onSave({ ...formData, item_details: itemsWithValidQuantity });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Saldo Devedor *</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="title"
            placeholder="Ex: Saldo Devedor Coleta #123"
            className="pl-10"
            value={formData.title || ''}
            onChange={(e) => handleInputChange("title", e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="pl-10"
              value={formData.amount || ''}
              onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
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
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionais sobre o saldo devedor..."
          value={formData.notes || ''}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="space-y-4 border-t border-border/30 pt-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Itens Relacionados
        </h4>
        {debtItems.map((item, index) => (
          <div key={item.id} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`item-code-${item.id}`}>Código</Label>
              <Input
                id={`item-code-${item.id}`}
                placeholder="Código do item"
                value={item.code}
                onChange={(e) => handleDebtItemChange(index, 'code', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor={`item-description-${item.id}`}>Descrição</Label>
              <Input
                id={`item-description-${item.id}`}
                placeholder="Descrição do item"
                value={item.description}
                onChange={(e) => handleDebtItemChange(index, 'description', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="w-24 space-y-2">
              <Label htmlFor={`item-quantity-${item.id}`}>Qtd</Label>
              <Input
                id={`item-quantity-${item.id}`}
                type="number"
                min="1"
                placeholder="1"
                value={item.quantity}
                onChange={(e) => handleDebtItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                disabled={isPending}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveDebtItem(item.id)}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddDebtItem}
          disabled={isPending}
          className="w-full flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Adicionar Item
        </Button>
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
            <DollarSign className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Saldo Devedor"}
        </Button>
      </div>
    </form>
  );
};