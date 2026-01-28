import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bug } from "lucide-react";
import { PestControlServiceForm } from "@/components/PestControlServiceForm";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type PestControlServiceInsert = TablesInsert<'pest_control_services'>;
type PestControlServiceUpdate = TablesUpdate<'pest_control_services'>;

interface CreatePestControlServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PestControlServiceInsert | PestControlServiceUpdate) => void;
  isPending: boolean;
}

export const CreatePestControlServiceDialog: React.FC<CreatePestControlServiceDialogProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  isPending,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Bug className="h-5 w-5" />
            Agendar Novo Serviço
          </DialogTitle>
        </DialogHeader>
        <PestControlServiceForm
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
};