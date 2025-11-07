import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Mail, Phone, Briefcase } from "lucide-react"; // Renomeado User para UserIcon para evitar conflito
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface UserFormProps {
  initialData?: ProfileUpdate;
  onSave: (data: ProfileInsert | ProfileUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth(); // Get current user
  const [formData, setFormData] = useState<ProfileInsert | ProfileUpdate>(initialData || {
    first_name: "",
    last_name: "",
    role: "standard", // Default role
    phone_number: "",
    avatar_url: "",
    id: initialData?.id || user?.id || "", // Use existing ID, current user ID, or empty
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(prev => ({ ...prev, id: user?.id || "" })); // Ensure ID is set for new forms
    }
  }, [initialData, user?.id]);

  const handleInputChange = (field: keyof (ProfileInsert | ProfileUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Primeiro Nome *</Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="first_name"
              placeholder="Primeiro Nome"
              className="pl-10"
              value={formData.first_name || ''}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Sobrenome *</Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="last_name"
              placeholder="Sobrenome"
              className="pl-10"
              value={formData.last_name || ''}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone_number">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone_number"
              placeholder="(XX) XXXXX-XXXX"
              className="pl-10"
              value={formData.phone_number || ''}
              onChange={(e) => handleInputChange("phone_number", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Função *</Label>
          <Select
            value={formData.role || 'standard'}
            onValueChange={(value) => handleInputChange("role", value)}
            disabled={isPending}
          >
            <SelectTrigger className="pl-10">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Selecionar função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Padrão</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email e Senha não são gerenciados diretamente aqui, pois são do Supabase Auth */}
      {/* Para adicionar um novo usuário, a Edge Function 'create-user' é usada */}
      {/* Para editar, apenas os campos do perfil são atualizados */}

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
            <UserIcon className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Usuário"}
        </Button>
      </div>
    </form>
  );
};