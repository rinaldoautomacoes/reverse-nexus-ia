import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, Building } from "lucide-react"; // Adicionado Building
import { ClientCombobox } from "@/components/ClientCombobox";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;

interface ClientDetailsSectionProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  handleClientComboboxSelect: (client: Client | null) => void;
  isPending: boolean;
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  formData,
  handleInputChange,
  handleClientComboboxSelect,
  isPending,
}) => {
  if (!formData) {
    console.error("ClientDetailsSection: formData é undefined ou null.");
    return null; 
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="parceiro">Cliente *</Label>
        <ClientCombobox
          value={formData.parceiro || ''}
          onValueChange={(name) => handleInputChange("parceiro", name)}
          onClientSelect={handleClientComboboxSelect}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contato">Pessoa de Contato</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="contato"
            placeholder="Nome do contato"
            className="pl-10"
            value={formData.contato || ''}
            onChange={(e) => handleInputChange("contato", e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="telefone"
            placeholder="(XX) XXXXX-XXXX"
            className="pl-10"
            value={formData.telefone || ''}
            onChange={(e) => handleInputChange("telefone", e.target.value)}
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
            placeholder="contato@cliente.com"
            className="pl-10"
            value={formData.email || ''}
            onChange={(e) => handleInputChange("email", e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
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
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
};