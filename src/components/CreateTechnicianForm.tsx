import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Mail, Lock, Phone, Briefcase, UserCog } from "lucide-react";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { SupervisorCombobox } from "./SupervisorCombobox";
import { useToast } from "@/hooks/use-toast"; // Import useToast

type ProfileInsert = TablesInsert<'profiles'>;

interface CreateTechnicianFormProps {
  onSave: (data: ProfileInsert & { email?: string; password?: string }) => void; // Email and password are now optional
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
    avatar_url: "",
    supervisor_id: null,
    id: "", // Will be filled by the edge function
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleInputChange = (field: keyof ProfileInsert, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupervisorSelect = (supervisorId: string | null) => {
    handleInputChange("supervisor_id", supervisorId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      toast({ title: "Campos Obrigatórios", description: "Primeiro Nome e Sobrenome são obrigatórios.", variant: "destructive" });
      return;
    }
    onSave({ ...formData, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label> {/* Removed * */}
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label> {/* Removed * */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

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
  );
};