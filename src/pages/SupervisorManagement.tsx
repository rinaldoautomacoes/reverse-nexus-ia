import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useAuth } from "@/hooks/use-auth";

// Import new modular components
import { SupervisorHeader } from "@/components/supervisor-management/SupervisorHeader";
import { SupervisorSearchBar } from "@/components/supervisor-management/SupervisorSearchBar";
import { CreateSupervisorDialog } from "@/components/supervisor-management/CreateSupervisorDialog";
import { EditSupervisorDialog } from "@/components/supervisor-management/EditSupervisorDialog";
import { ManageSupervisorTeamDialog } from "@/components/supervisor-management/ManageSupervisorTeamDialog";
import { SupervisorList } from "@/components/supervisor-management/SupervisorList";

type Profile = Tables<'profiles'>;

export const SupervisorManagement = () => {
  const { user: currentUser } = useAuth();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false);
  const [selectedSupervisorForTeam, setSelectedSupervisorForTeam] = useState<Profile | null>(null);

  const { data: supervisors, isLoading: isLoadingSupervisors, error: supervisorsError } = useQuery<Profile[], Error>({
    queryKey: ['supervisors', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'supervisor') // Filter for 'supervisor' role
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const { data: allTechnicians, isLoading: isLoadingTechnicians, error: techniciansError } = useQuery<Profile[], Error>({
    queryKey: ['allTechnicians', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'standard') // Only standard users are technicians
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id && isManageTeamDialogOpen, // Only fetch when dialog is open
  });

  const handleEditSupervisor = (supervisor: Profile) => {
    setEditingSupervisor(supervisor);
    setIsEditDialogOpen(true);
  };

  const handleManageTeam = (supervisor: Profile) => {
    setSelectedSupervisorForTeam(supervisor);
    setIsManageTeamDialogOpen(true);
  };

  if (isLoadingSupervisors) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando supervisores...</p>
        </div>
      </div>
    );
  }

  if (supervisorsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar supervisores: {supervisorsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <SupervisorHeader />
        <SupervisorSearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />

        <CreateSupervisorDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

        <SupervisorList
          supervisors={supervisors || []}
          searchTerm={searchTerm}
          onEditSupervisor={handleEditSupervisor}
          onManageTeam={handleManageTeam}
          isLoadingTechnicians={isLoadingTechnicians}
          allTechnicians={allTechnicians}
        />
      </div>

      <EditSupervisorDialog
        supervisor={editingSupervisor}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <ManageSupervisorTeamDialog
        supervisor={selectedSupervisorForTeam}
        isOpen={isManageTeamDialogOpen}
        onOpenChange={setIsManageTeamDialogOpen}
      />
    </div>
  );
};