import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Mail, Lock, Phone, Briefcase, UserCog, Sun, Moon } from "lucide-react"; // Adicionado Sun e Moon
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { SupervisorCombobox } from "./SupervisorCombobox"; // Importar SupervisorCombobox

type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface UserFormProps {
  initialData?: ProfileUpdate;
  onSave: (data: ProfileInsert | ProfileUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
  // New props for email/password when creating a new user (only for CreateTechnicianForm)
  showAuthFields?: boolean;
  onAuthFieldsChange?: (email: string, password: string) => void;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSave, onCancel, isPending, showAuthFields = false, onAuthFieldsChange }) => {
  const [formData, setFormData] = useState<ProfileInsert | ProfileUpdate>(initialData || {
    first_name: "",
    last_name: "",
    role: "standard", // Default role
    phone_number: "",
    avatar_url: "",
    supervisor_id: null, // Novo campo
    team_shift: "day", // Novo campo com valor padrão
    id: "", // Will be filled by mutation or existing user
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form for new user creation
      setFormData({
        first_name: "",
        last_name: "",
        role: "standard",
        phone_number: "",
        avatar_url: "",
        supervisor_id: null,
        team_shift: "day", // Reset para valor padrão
        id: "",
      });
      setEmail("");
      setPassword("");
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (ProfileInsert | ProfileUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupervisorSelect = (supervisorId: string | null) => {
    handleInputChange("supervisor_id", supervisorId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showAuthFields && onAuthFieldsChange) {
      onAuthFieldsChange(email, password); // Pass auth fields to parent
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showAuthFields && (
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /> {/* Reusing Lock icon for password */}
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            disabled={isPending || initialData?.role === 'admin'} // Prevent changing admin role via this form
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Novo grid para team_shift e supervisor */}
        <div className="space-y-2">
          <Label htmlFor="team_shift">Equipe</Label>
          <Select
            value={formData.team_shift || 'day'}
            onValueChange={(value) => handleInputChange("team_shift", value)}
            disabled={isPending}
          >
            <SelectTrigger className="pl-10">
              {(formData.team_shift === 'day' || !formData.team_shift) ? (
                <Sun className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              ) : (
                <Moon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              )}
              <SelectValue placeholder="Selecionar equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="night">Noite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supervisor_id">Supervisor</Label>
          <SupervisorCombobox
            value={formData.supervisor_id || null}
            onValueChange={handleSupervisorSelect}
            disabled={isPending}
            excludeUserId={initialData?.id} // Exclude the user being edited from being their own supervisor
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
            <UserIcon className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Usuário"}
        </Button>
      </div>
    </form>
  );
};