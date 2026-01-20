import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Mail, Lock, Phone, Briefcase, UserCog, Sun, Moon } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { SupervisorCombobox } from "./SupervisorCombobox";

type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface UserFormProps {
  initialData?: ProfileUpdate;
  onSave: (data: ProfileInsert | ProfileUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
  showAuthFields?: boolean;
  onAuthFieldsChange?: (email: string, password: string) => void;
  defaultRole?: 'standard' | 'admin';
  profileType?: 'technician' | 'supervisor' | 'user'; // Novo prop
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSave, onCancel, isPending, showAuthFields = false, onAuthFieldsChange, defaultRole = 'standard', profileType = 'user' }) => {
  const [formData, setFormData] = useState<ProfileInsert | ProfileUpdate>(initialData || {
    first_name: "",
    last_name: "",
    role: defaultRole,
    phone_number: "",
    avatar_url: "",
    supervisor_id: null,
    team_shift: "day",
    address: "", // Adicionado o campo address
    id: "",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        role: defaultRole,
        phone_number: "",
        avatar_url: "",
        supervisor_id: null,
        team_shift: "day",
        address: "", // Resetar address
        id: "",
      });
      setEmail("");
      setPassword("");
    }
  }, [initialData, defaultRole]);

  const handleInputChange = (field: keyof (ProfileInsert | ProfileUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupervisorSelect = (supervisorId: string | null) => {
    handleInputChange("supervisor_id", supervisorId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showAuthFields && onAuthFieldsChange) {
      onAuthFieldsChange(email, password);
    }
    onSave(formData);
  };

  const isSupervisorProfile = profileType === 'supervisor';

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
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
          <Label htmlFor="last_name">Sobrenome</Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="last_name"
              placeholder="Sobrenome"
              className="pl-10"
              value={formData.last_name || ''}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
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
            disabled={isPending || initialData?.role === 'admin' || defaultRole === 'standard'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        {/* Conditionally render SupervisorCombobox */}
        {!isSupervisorProfile && (
          <div className="space-y-2">
            <Label htmlFor="supervisor_id">Supervisor</Label>
            <SupervisorCombobox
              value={formData.supervisor_id || null}
              onValueChange={handleSupervisorSelect}
              disabled={isPending}
              excludeUserId={initialData?.id}
            />
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