import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Bug } from "lucide-react";
import { PestControlServiceForm } from "@/components/PestControlServiceForm";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type PestControlService = Tables<'pest_control_services'> & {
  client?: { name: string } | null;
  responsible_user?: { first_name: string; last_name: string } | null;
};
type PestControlServiceInsert = TablesInsert<'pest_control_services'>;
type PestControlServiceUpdate = TablesUpdate<'pest_control_services'>;

interface EditPestControlServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: PestControlService | null;
  onSave: (data: PestControlServiceInsert | PestControlServiceUpdate) => void;
  isPending: boolean;
}

export const EditPestControlServiceDialog: React.FC<EditPestControlServiceDialogProps> = ({
  isOpen,
  onOpenChange,
  service,
  onSave,
  isPending,
}) => {
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Edit className="h-5 w-5" />
            Editar Serviço: {service.client?.name || 'N/A'}
          </DialogTitle>
        </DialogHeader>
        <PestControlServiceForm
          initialData={service}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
};