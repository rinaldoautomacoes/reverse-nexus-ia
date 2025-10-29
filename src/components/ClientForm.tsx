import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, User, Phone, Mail, MapPin, Building, Briefcase } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type ClientInsert = TablesInsert<'clients'>;
type ClientUpdate = TablesUpdate<'clients'>;

interface ClientFormProps {
  initialData?: ClientUpdate;
  onSave: (data: ClientInsert | ClientUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const [formData, setFormData] = useState<ClientInsert | ClientUpdate>(initialData || {
    name: "",
    phone: "",
    email: "",
    address: "",
    cnpj: "",
    contact_person: "",
    user_id: "", // Será preenchido pela mutação
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (ClientInsert | ClientUpdate), value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Cliente *</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder="Nome da Empresa ou Pessoa"
            className="pl-10"
            value={formData.name || ''}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              placeholder="(XX) XXXXX-XXXX"
              className="pl-10"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="contato@cliente.com"
              className="pl-10"
              value={formData.email || ''}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder="Endereço completo do cliente"
            className="pl-10"
            value={formData.address || ''}
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="cnpj"
              placeholder="XX.XXX.XXX/XXXX-XX"
              className="pl-10"
              value={formData.cnpj || ''}
              onChange={(e) => handleInputChange("cnpj", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_person">Pessoa de Contato</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="contact_person"
              placeholder="Nome do contato principal"
              className="pl-10"
              value={formData.contact_person || ''}
              onChange={(e) => handleInputChange("contact_person", e.target.value)}
            />
          </div>
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
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Cliente"}
        </Button>
      </div>
    </form>
  );
};