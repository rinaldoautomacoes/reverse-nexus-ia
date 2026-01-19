import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Mail, Phone, Briefcase } from "lucide-react"; // Renomeado User para UserIcon para evitar conflito
import type { TablesInsert, TablesUpdate, Tables } from "@/integrations/supabase/types_generated";
import { SupervisorCombobox } from "./SupervisorCombobox"; // Importar SupervisorCombobox

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = Profile & { email?: string; password?: string }; // Adicionado email e password para novos usuários

interface UserFormProps {
  initialData?: ProfileUpdate;
  onSave: (data: ProfileInsert | ProfileUpdate) => void; // onSave agora aceita ProfileUpdate
  onCancel: () => void;
  isPending: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const [formData, setFormData] = useState<ProfileInsert | ProfileUpdate>(initialData || {
    first_name: "",
    last_name: "",
    role: "standard", // Default role
    phone_number: "",
    avatar_url: "",
    id: "", // Will be filled by mutation or existing user
    email: "", // Para novos usuários
    password: "", // Para novos usuários
    supervisor_id: null, // Novo campo
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (ProfileInsert | ProfileUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupervisorSelect = (supervisorProfile: Profile | null) => {
    handleInputChange("supervisor_id", supervisorProfile?.id || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isNewUser = !initialData?.id; // Determina se é um novo usuário
  const isTechnician = formData.role === 'standard'; // Determina se o usuário é um técnico

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isNewUser && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                className="pl-10"
                value={formData.email || ''}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={formData.password || ''}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>
        </>
      )}

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
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isTechnician && (
        <div className="space-y-2">
          <Label htmlFor="supervisor">Supervisor</Label>
          <SupervisorCombobox
            value={formData.supervisor_id || null}
            onValueChange={(id) => handleInputChange("supervisor_id", id)}
            onSupervisorSelect={handleSupervisorSelect}
            disabled={isPending}
          />
        </div>
      )}

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