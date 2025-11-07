import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, User as UserIcon, Phone, Mail, MapPin, Hash, Loader2 } from "lucide-react"; // Renomeado User para UserIcon
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

type TransportadoraInsert = TablesInsert<'transportadoras'>;
type TransportadoraUpdate = TablesUpdate<'transportadoras'>;

interface TransportadoraFormProps {
  initialData?: TransportadoraUpdate;
  onSave: (data: TransportadoraInsert | TransportadoraUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const TransportadoraForm: React.FC<TransportadoraFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth(); // Get current user
  const [formData, setFormData] = useState<TransportadoraInsert | TransportadoraUpdate>(initialData || {
    name: "",
    cnpj: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    user_id: user?.id || "", // Set user_id from auth
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(prev => ({ ...prev, user_id: user?.id || "" })); // Ensure user_id is set for new forms
    }
  }, [initialData, user?.id]);

  const handleInputChange = (field: keyof (TransportadoraInsert | TransportadoraUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Transportadora *</Label>
        <div className="relative">
          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder="Nome da Transportadora"
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
          <Label htmlFor="cnpj">CNPJ</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="cnpj"
              placeholder="XX.XXX.XXX/XXXX-XX"
              className="pl-10"
              value={formData.cnpj || ''}
              onChange={(e) => handleInputChange("cnpj", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_person">Pessoa de Contato</Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /> {/* Usando UserIcon */}
            <Input
              id="contact_person"
              placeholder="Nome do contato principal"
              className="pl-10"
              value={formData.contact_person || ''}
              onChange={(e) => handleInputChange("contact_person", e.target.value)}
              disabled={isPending}
            />
          </div>
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
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="contato@transportadora.com"
              className="pl-10"
              value={formData.email || ''}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isPending}
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
            placeholder="Endereço completo da transportadora"
            className="pl-10"
            value={formData.address || ''}
            onChange={(e) => handleInputChange("address", e.target.value)}
            disabled={isPending}
          />
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
            <Building className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Transportadora"}
        </Button>
      </div>
    </form>
  );
};