import React from 'react';
import { Label } from "@/components/ui/label";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;
type Profile = Tables<'profiles'>;

interface ColetaResponsibleUserProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  handleResponsibleUserSelect: (userProfile: Profile | null) => void;
  isPending: boolean;
}

export const ColetaResponsibleUser: React.FC<ColetaResponsibleUserProps> = ({
  formData,
  handleInputChange,
  handleResponsibleUserSelect,
  isPending,
}) => {
  const { user } = useAuth(); // Use useAuth to ensure user is loaded

  if (!user) {
    // Optionally, render a loading state or redirect if user is not available
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Carregando responsável...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="responsible_user">Responsável pela Coleta</Label>
      <ResponsibleUserCombobox
        value={formData.responsible_user_id || null}
        onValueChange={(id) => handleInputChange("responsible_user_id", id)}
        onUserSelect={handleResponsibleUserSelect}
        disabled={isPending}
      />
    </div>
  );
};