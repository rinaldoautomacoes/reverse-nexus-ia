import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, User, Phone, Car, Hash, CheckCircle, Loader2 } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type DriverInsert = TablesInsert<'drivers'>;
type DriverUpdate = TablesUpdate<'drivers'>;

interface DriverFormProps {
  initialData?: DriverUpdate;
  onSave: (data: DriverInsert | DriverUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const DriverForm: React.FC<DriverFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const [formData, setFormData] = useState<DriverInsert | DriverUpdate>(initialData || {
    name: "",
    phone: "",
    vehicle_type: "",
    license_plate: "",
    status: "disponivel",
    user_id: "", // Será preenchido pela mutação
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (DriverInsert | DriverUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Motorista *</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder="Nome completo do motorista"
            className="pl-10"
            value={formData.name || ''}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              placeholder="(XX) XXXXX-XXXX"
              className="pl-10"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
          <div className="relative">
            <Car className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vehicle_type"
              placeholder="Ex: Van, Caminhão, Moto"
              className="pl-10"
              value={formData.vehicle_type || ''}
              onChange={(e) => handleInputChange("vehicle_type", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="license_plate">Placa do Veículo</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="license_plate"
              placeholder="Ex: ABC-1234"
              className="pl-10"
              value={formData.license_plate || ''}
              onChange={(e) => handleInputChange("license_plate", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'disponivel'}
            onValueChange={(value) => handleInputChange("status", value)}
            disabled={isPending}
          >
            <SelectTrigger className="pl-10">
              <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="em_rota">Em Rota</SelectItem>
              <SelectItem value="manutencao">Em Manutenção</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            <Truck className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Motorista"}
        </Button>
      </div>
    </form>
  );
};