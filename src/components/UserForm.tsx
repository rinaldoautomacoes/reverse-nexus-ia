import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Mail, Lock, Phone, Briefcase, UserCog, Sun, Moon, MapPin, Users } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { SupervisorCombobox } from "./SupervisorCombobox";

type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface UserFormProps {
  initialData?: ProfileUpdate & { user_email?: string | null }; // Adicionado user_email como opcional para compatibilidade
  onSave: (data: ProfileInsert | ProfileUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
  showAuthFields?: boolean;
  onAuthFieldsChange?: (email: string, password: string) => void;
  defaultRole?: 'standard' | 'admin';
  profileType?: 'technician' | 'supervisor' | 'user';
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSave, onCancel, isPending, showAuthFields = false, onAuthFieldsChange, defaultRole = 'standard', profileType = 'user' }) => {
  const [formData, setFormData] = useState<ProfileInsert | ProfileUpdate>(initialData || {
    first_name: "",
    last_name: "",
    role: defaultRole,
    phone_number: "", // Telefone da Empresa
    personal_phone_number: "", // Telefone Pessoal
    avatar_url: "",
    supervisor_id: null,
    team_shift: "day",
    team_name: "", // Novo campo
    address: "",
    id: "",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialData) {
      // Destructure user_email out of initialData before setting formData
      const { user_email, ...restOfInitialData } = initialData;
      setFormData(restOfInitialData);
      // If showAuthFields is true, we might want to set the email input field
      if (showAuthFields && user_email) {
        setEmail(user_email);
      }
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        role: defaultRole,
        phone_number: "",
        personal_phone_number: "",
        avatar_url: "",
        supervisor_id: null,
        team_shift: "day",
        team_name: "", // Novo campo
        address: "",
        id: "",
      });
      setEmail("");
      setPassword("");
    }
  }, [initialData, defaultRole, showAuthFields]);

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
    // Ensure user_email is not part of the object passed to onSave
    const { user_email, ...dataToSave } = formData as ProfileUpdate & { user_email?: string | null };
    onSave(dataToSave);
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
          <Label htmlFor="phone_number">Telefone da Empresa</Label>
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
          <Label htmlFor="personal_phone_number">Telefone Pessoal</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="personal_phone_number"
              placeholder="(XX) XXXXX-XXXX"
              className="pl-10"
              value={formData.personal_phone_number || ''}
              onChange={(e) => handleInputChange("personal_phone_number", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="team_shift">Turno da Equipe</Label>
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
              <SelectValue placeholder="Selecionar turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="night">Noite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="team_name">Nome da Equipe</Label>
        <div className="relative">
          <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="team_name"
            placeholder="Ex: Equipe Alfa, Equipe Noturna SP"
            className="pl-10"
            value={formData.team_name || ''}
            onChange={(e) => handleInputChange("team_name", e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder="Endereço completo do usuário"
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
            <UserIcon className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Usuário"}
        </Button>
      </div>
    </form>