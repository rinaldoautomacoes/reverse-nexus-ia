import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Phone, Briefcase, UserCog, Sun, Moon, Users, Bike, Square, MapPin } from "lucide-react"; // Adicionado Bike, Square, MapPin
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { SupervisorCombobox } from "./SupervisorCombobox";
import { useToast } from "@/hooks/use-toast"; // Import useToast

type ProfileInsert = TablesInsert<'profiles'>;

interface CreateTechnicianFormProps {
  onSave: (data: ProfileInsert) => void; // Email and password are no longer part of data
  onCancel: () => void;
  isPending: boolean;
}

export const CreateTechnicianForm: React.FC<CreateTechnicianFormProps> = ({ onSave, onCancel, isPending }) => {
  const { toast } = useToast(); // Initialize useToast
  const [formData, setFormData] = useState<ProfileInsert>({
    first_name: "",
    last_name: "",
    role: "standard", // Default role for technicians
    phone_number: "",
    personal_phone_number: "", // Novo campo
    avatar_url: "",
    supervisor_id: null,
    team_shift: "day", // Novo campo com valor padrão
    team_name: "", // Novo campo
    motorcycle_model: "", // Novo campo
    license_plate: "", // Novo campo
    address: "",
    id: crypto.randomUUID(), // Generate ID here for new profiles
  });

  const handleInputChange = (field: keyof ProfileInsert, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupervisorSelect = (supervisorId: string | null) => {
    handleInputChange("supervisor_id", supervisorId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || formData.first_name.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O Primeiro Nome é obrigatório.", variant: "destructive" });
      return;
    }
    // Removido a validação de obrigatoriedade para last_name
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
          <Label htmlFor="last_name">Sobrenome</Label> {/* Removido o '*' de obrigatoriedade */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Novo grid para team_shift e supervisor */}
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
              <SelectValue placeholder="Selecionar equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="night">Noite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"> {/* Novo campo para Nome da Equipe */}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="supervisor_id">Supervisor</Label>
        <SupervisorCombobox
          value={formData.supervisor_id || null}
          onValueChange={handleSupervisorSelect}
          disabled={isPending}
        />
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
            <UserCog className="mr-2 h-4 w-4" />
          )}
          Adicionar Técnico
        </Button>
      </div>
    </form>